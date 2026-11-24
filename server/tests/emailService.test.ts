import { sendCandidateInviteEmail, sendCandidateRescheduleEmail } from '../src/services/emailService';

describe('EmailService - Candidate Notifications', () => {
  it('should successfully generate and send interview invitation email with candidate scheduling link', async () => {
    const result = await sendCandidateInviteEmail({
      candidateName: 'Jane Doe',
      candidateEmail: 'janedoe@example.com',
      interviewTitle: 'Senior Frontend Engineer Interview',
      interviewType: 'Technical Deep Dive',
      duration: 45,
      recruiterName: 'Alex Recruiter',
      schedulingUrl: 'http://localhost:5173/schedule/test-token-12345',
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      timezone: 'America/New_York',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it('should successfully generate and send reschedule email with new candidate scheduling link', async () => {
    const result = await sendCandidateRescheduleEmail({
      candidateName: 'John Smith',
      candidateEmail: 'johnsmith@example.com',
      interviewTitle: 'System Design Interview',
      interviewType: 'Architecture',
      duration: 60,
      recruiterName: 'Alex Recruiter',
      schedulingUrl: 'http://localhost:5173/schedule/reschedule-token-99999',
      expiresAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });
});
