import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config';

let cachedTransporter: Transporter | null = null;

/**
 * Initializes and returns a Nodemailer transporter.
 * Uses configured SMTP credentials if provided.
 * Falls back to Ethereal (test account) or jsonTransport in development.
 */
export const getEmailTransporter = async (): Promise<Transporter> => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  // 1. If real SMTP credentials are provided, use them
  if ((config.smtp.host || config.smtp.service) && config.smtp.user && config.smtp.pass) {
    const isGmail =
      (config.smtp.service && config.smtp.service.toLowerCase().includes('gmail')) ||
      (config.smtp.host && config.smtp.host.toLowerCase().includes('gmail'));

    if (isGmail) {
      cachedTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
      console.log(`[EmailService] Configured Gmail transporter with service: 'gmail' (SSL on port 465)`);
    } else {
      cachedTransporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: {
          rejectUnauthorized: false,
        },
      });
      console.log(`[EmailService] Configured SMTP transporter with host: ${config.smtp.host}:${config.smtp.port}`);
    }
    return cachedTransporter;
  }

  // 2. In dev/test without credentials, try creating an Ethereal test account
  if (config.nodeEnv !== 'production') {
    try {
      const testAccount = await nodemailer.createTestAccount();
      cachedTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[EmailService] Created Ethereal test email account: ${testAccount.user}`);
      return cachedTransporter;
    } catch (testAccountErr) {
      console.warn('[EmailService] Failed to create Ethereal test account, falling back to JSON console logger.', testAccountErr);
    }
  }

  // 3. Fallback: JSON stream transporter (logs email output to stdout without failing)
  cachedTransporter = nodemailer.createTransport({
    jsonTransport: true,
  });
  console.log('[EmailService] Configured fallback JSON transporter.');
  return cachedTransporter;
};

export interface CandidateInviteEmailParams {
  candidateName: string;
  candidateEmail: string;
  interviewTitle: string;
  interviewType: string;
  duration: number; // in minutes
  recruiterName?: string;
  recruiterEmail?: string;
  schedulingUrl: string;
  expiresAt?: Date;
  timezone?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string | false;
  error?: string;
}

/**
 * Sends an email to a candidate containing their personal interview scheduling link.
 */
export const sendCandidateInviteEmail = async (
  params: CandidateInviteEmailParams
): Promise<EmailSendResult> => {
  const {
    candidateName,
    candidateEmail,
    interviewTitle,
    interviewType,
    duration,
    recruiterName,
    schedulingUrl,
    expiresAt,
    timezone,
  } = params;

  try {
    const transporter = await getEmailTransporter();

    const formattedExpires = expiresAt
      ? new Intl.DateTimeFormat('en-US', {
          dateStyle: 'full',
          timeStyle: 'short',
        }).format(new Date(expiresAt))
      : null;

    const subject = `Invitation to Schedule: ${interviewTitle}`;

    const textContent = `
Hello ${candidateName},

You have been invited to schedule an interview for "${interviewTitle}" (${interviewType}).
Duration: ${duration} minutes.
${recruiterName ? `Recruiter: ${recruiterName}\n` : ''}${
      formattedExpires ? `Please select your slot before: ${formattedExpires}\n` : ''
    }

Please use the following link to choose a time that works best for you:
${schedulingUrl}

Best regards,
The AutoSched Team
`.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #334155;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: #0f172a;
      padding: 28px 32px;
      text-align: center;
    }
    .header h1 {
      color: #38bdf8;
      font-size: 22px;
      margin: 0;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 16px;
    }
    .details-card {
      background: #f1f5f9;
      border-left: 4px solid #38bdf8;
      padding: 16px 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .details-row {
      margin: 6px 0;
      font-size: 14px;
    }
    .details-label {
      font-weight: 600;
      color: #475569;
      width: 110px;
      display: inline-block;
    }
    .details-val {
      color: #0f172a;
      font-weight: 500;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 24px;
    }
    .btn {
      display: inline-block;
      background: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 8px;
      letter-spacing: 0.2px;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }
    .fallback-url {
      font-size: 12px;
      color: #64748b;
      word-break: break-all;
      background: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      border: 1px dashed #cbd5e1;
      margin-top: 16px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding: 20px 32px;
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
      background: #f8fafc;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AutoSched</h1>
    </div>
    <div class="content">
      <div class="greeting">Hello ${candidateName},</div>
      <p>You have been invited to schedule your interview session. Please select an available slot that aligns best with your schedule.</p>
      
      <div class="details-card">
        <div class="details-row"><span class="details-label">Interview:</span> <span class="details-val">${interviewTitle}</span></div>
        <div class="details-row"><span class="details-label">Type:</span> <span class="details-val">${interviewType}</span></div>
        <div class="details-row"><span class="details-label">Duration:</span> <span class="details-val">${duration} minutes</span></div>
        ${recruiterName ? `<div class="details-row"><span class="details-label">Organizer:</span> <span class="details-val">${recruiterName}</span></div>` : ''}
        ${formattedExpires ? `<div class="details-row"><span class="details-label">Expires:</span> <span class="details-val">${formattedExpires}</span></div>` : ''}
      </div>

      <div class="cta-container">
        <a href="${schedulingUrl}" class="btn" target="_blank" rel="noopener noreferrer">Select Your Interview Slot</a>
      </div>

      <p class="fallback-url">
        If the button above does not work, copy and paste this link into your browser:<br>
        <a href="${schedulingUrl}" style="color: #2563eb;">${schedulingUrl}</a>
      </p>
    </div>
    <div class="footer">
      This is an automated notification from AutoSched.<br>
      Please do not reply directly to this email.
    </div>
  </div>
</body>
</html>
`.trim();

    const info = await transporter.sendMail({
      from: config.smtp.from,
      to: `"${candidateName}" <${candidateEmail}>`,
      subject,
      text: textContent,
      html: htmlContent,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[EmailService] Invitation email sent to ${candidateEmail}. Message ID: ${info.messageId}`);
    if (previewUrl) {
      console.log(`[EmailService] Ethereal Email Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || false,
    };
  } catch (error: any) {
    console.error(`[EmailService Error] Failed to send email to ${candidateEmail}:`, error?.message || error);
    return {
      success: false,
      error: error?.message || 'Unknown email transmission error',
    };
  }
};

/**
 * Sends an email to a candidate notifying them of an interview reschedule request with a new link.
 */
export const sendCandidateRescheduleEmail = async (
  params: CandidateInviteEmailParams
): Promise<EmailSendResult> => {
  const {
    candidateName,
    candidateEmail,
    interviewTitle,
    interviewType,
    duration,
    recruiterName,
    schedulingUrl,
    expiresAt,
  } = params;

  try {
    const transporter = await getEmailTransporter();

    const formattedExpires = expiresAt
      ? new Intl.DateTimeFormat('en-US', {
          dateStyle: 'full',
          timeStyle: 'short',
        }).format(new Date(expiresAt))
      : null;

    const subject = `Reschedule Requested: ${interviewTitle}`;

    const textContent = `
Hello ${candidateName},

Your interview "${interviewTitle}" (${interviewType}) needs to be rescheduled.
Duration: ${duration} minutes.
${recruiterName ? `Recruiter: ${recruiterName}\n` : ''}${
      formattedExpires ? `Please select your new slot before: ${formattedExpires}\n` : ''
    }

Please use the following link to choose a new time slot:
${schedulingUrl}

Best regards,
The AutoSched Team
`.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #334155;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: #0f172a;
      padding: 28px 32px;
      text-align: center;
    }
    .header h1 {
      color: #38bdf8;
      font-size: 22px;
      margin: 0;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 16px;
    }
    .details-card {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .details-row {
      margin: 6px 0;
      font-size: 14px;
    }
    .details-label {
      font-weight: 600;
      color: #92400e;
      width: 110px;
      display: inline-block;
    }
    .details-val {
      color: #78350f;
      font-weight: 500;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 24px;
    }
    .btn {
      display: inline-block;
      background: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 8px;
      letter-spacing: 0.2px;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }
    .fallback-url {
      font-size: 12px;
      color: #64748b;
      word-break: break-all;
      background: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      border: 1px dashed #cbd5e1;
      margin-top: 16px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding: 20px 32px;
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
      background: #f8fafc;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AutoSched</h1>
    </div>
    <div class="content">
      <div class="greeting">Hello ${candidateName},</div>
      <p>A rescheduling request has been made for your interview session. Please select a new available slot at your earliest convenience.</p>
      
      <div class="details-card">
        <div class="details-row"><span class="details-label">Interview:</span> <span class="details-val">${interviewTitle}</span></div>
        <div class="details-row"><span class="details-label">Type:</span> <span class="details-val">${interviewType}</span></div>
        <div class="details-row"><span class="details-label">Duration:</span> <span class="details-val">${duration} minutes</span></div>
        ${recruiterName ? `<div class="details-row"><span class="details-label">Organizer:</span> <span class="details-val">${recruiterName}</span></div>` : ''}
        ${formattedExpires ? `<div class="details-row"><span class="details-label">Expires:</span> <span class="details-val">${formattedExpires}</span></div>` : ''}
      </div>

      <div class="cta-container">
        <a href="${schedulingUrl}" class="btn" target="_blank" rel="noopener noreferrer">Select New Time Slot</a>
      </div>

      <p class="fallback-url">
        If the button above does not work, copy and paste this link into your browser:<br>
        <a href="${schedulingUrl}" style="color: #2563eb;">${schedulingUrl}</a>
      </p>
    </div>
    <div class="footer">
      This is an automated notification from AutoSched.<br>
      Please do not reply directly to this email.
    </div>
  </div>
</body>
</html>
`.trim();

    const info = await transporter.sendMail({
      from: config.smtp.from,
      to: `"${candidateName}" <${candidateEmail}>`,
      subject,
      text: textContent,
      html: htmlContent,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[EmailService] Reschedule email sent to ${candidateEmail}. Message ID: ${info.messageId}`);
    if (previewUrl) {
      console.log(`[EmailService] Ethereal Email Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || false,
    };
  } catch (error: any) {
    console.error(`[EmailService Error] Failed to send reschedule email to ${candidateEmail}:`, error?.message || error);
    return {
      success: false,
      error: error?.message || 'Unknown email transmission error',
    };
  }
};
