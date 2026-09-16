import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from './config';
import { User } from './models/User';
import { Candidate } from './models/Candidate';
import { Template } from './models/Template';
import { Interview } from './models/Interview';

async function seed() {
  try {
    console.log('🌱 Connecting to MongoDB for seeding...');
    await mongoose.connect(config.mongoUri);
    console.log('MongoDB connected successfully.');

    // Clear existing collection data
    await User.deleteMany({});
    await Candidate.deleteMany({});
    await Template.deleteMany({});
    await Interview.deleteMany({});

    console.log('🧹 Cleared existing database records.');

    // 1. Create Recruiter User
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const recruiter = await User.create({
      name: 'Sarah Connor',
      email: 'recruiter@demo.com',
      passwordHash,
      role: 'RECRUITER',
      timezone: 'Asia/Kolkata',
      googleCalendar: {
        connected: false,
        calendarId: 'primary',
      },
    });

    console.log('✅ Created Recruiter User: recruiter@demo.com (Password: password123)');

    // 2. Create Candidate Profiles
    const candidate1 = await Candidate.create({
      name: 'Alex Rivera',
      email: 'alex.rivera@example.com',
      timezone: 'America/New_York',
      notes: 'Senior Full Stack Engineer applicant. 6+ yrs Node.js & React experience.',
    });

    const candidate2 = await Candidate.create({
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      timezone: 'Asia/Kolkata',
      notes: 'Backend Systems Engineer candidate. Strong expertise in distributed architectures.',
    });

    const candidate3 = await Candidate.create({
      name: 'David Chen',
      email: 'david.chen@example.com',
      timezone: 'Europe/London',
      notes: 'Product Specialist applicant.',
    });

    console.log('✅ Created 3 Candidate Profiles.');

    // 3. Create Interview Templates
    const techTemplate = await Template.create({
      title: 'Senior Technical Screen',
      type: 'Technical Interview',
      duration: 60,
      workingHours: { start: '09:00', end: '17:00' },
      minimumNotice: 12,
      description: 'Algorithm problem solving, system architecture discussion, and live coding exercises.',
      createdBy: recruiter._id,
    });

    const hrTemplate = await Template.create({
      title: 'HR Screening & Behavioral',
      type: 'HR Screening',
      duration: 30,
      workingHours: { start: '10:00', end: '16:00' },
      minimumNotice: 6,
      description: 'Initial HR screening to discuss culture fit, compensation expectations, and timeline.',
      createdBy: recruiter._id,
    });

    const systemDesignTemplate = await Template.create({
      title: 'System Design & Architecture',
      type: 'System Design',
      duration: 90,
      workingHours: { start: '10:00', end: '18:00' },
      minimumNotice: 24,
      description: 'High-level design of scalable distributed systems and database modeling.',
      createdBy: recruiter._id,
    });

    console.log('✅ Created 3 Reusable Interview Templates.');

    // 4. Create Sample Interview Requests
    const now = new Date();
    const token1 = crypto.randomBytes(24).toString('hex');
    const token2 = crypto.randomBytes(24).toString('hex');

    // Active Scheduling Interview for Alex Rivera
    const interview1 = await Interview.create({
      candidateId: candidate1._id,
      recruiterId: recruiter._id,
      interviewerIds: [recruiter._id],
      title: 'Senior Full Stack Technical Interview',
      type: 'Technical Interview',
      duration: 60,
      status: 'SCHEDULING',
      schedulingToken: token1,
      tokenExpiresAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
      timezone: 'Asia/Kolkata',
      schedulingWindow: {
        startDate: now,
        endDate: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
      },
      workingHours: { start: '09:00', end: '17:00' },
      minimumNotice: 12,
    });

    // Scheduled Interview for Priya Sharma
    const scheduledStart = new Date(now.getTime() + 2 * 24 * 3600 * 1000);
    scheduledStart.setHours(14, 0, 0, 0);
    const scheduledEnd = new Date(scheduledStart.getTime() + 60 * 60 * 1000);

    const interview2 = await Interview.create({
      candidateId: candidate2._id,
      recruiterId: recruiter._id,
      interviewerIds: [recruiter._id],
      title: 'Backend Systems Architecture Interview',
      type: 'System Design',
      duration: 60,
      status: 'SCHEDULED',
      schedulingToken: token2,
      tokenExpiresAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
      timezone: 'Asia/Kolkata',
      schedulingWindow: {
        startDate: now,
        endDate: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
      },
      workingHours: { start: '09:00', end: '17:00' },
      minimumNotice: 12,
      selectedSlot: {
        start: scheduledStart,
        end: scheduledEnd,
        timezone: 'Asia/Kolkata',
      },
      googleEventId: `evt_demo_${Date.now()}`,
      meetingLink: 'https://meet.google.com/demo-interview-call',
    });

    console.log('✅ Created 2 Sample Interview Requests.');
    console.log(`   - Pending Link: http://localhost:5173/schedule/${token1}`);
    console.log(`   - Scheduled Interview ID: ${interview2._id}`);

    console.log('🎉 Seeding finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
}

seed();
