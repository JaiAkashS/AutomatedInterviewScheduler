export type UserRole = 'RECRUITER' | 'INTERVIEWER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  googleCalendarConnected: boolean;
  timezone: string;
}

export interface Candidate {
  _id: string;
  name: string;
  email: string;
  timezone: string;
  notes?: string;
  createdAt: string;
}

export type InterviewStatus =
  | 'DRAFT'
  | 'SCHEDULING'
  | 'SCHEDULED'
  | 'RESCHEDULE_REQUESTED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'EXPIRED';

export interface SelectedSlot {
  start: string;
  end: string;
  timezone: string;
}

export interface Interview {
  _id: string;
  candidateId: Candidate;
  recruiterId: User;
  interviewerIds: User[];
  title: string;
  type: string;
  duration: number; // in minutes
  status: InterviewStatus;
  schedulingToken: string;
  tokenExpiresAt: string;
  timezone: string;
  schedulingWindow: {
    startDate: string;
    endDate: string;
  };
  workingHours: {
    start: string;
    end: string;
  };
  minimumNotice: number;
  selectedSlot?: SelectedSlot;
  googleEventId?: string;
  meetingLink?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  _id: string;
  title: string;
  type: string;
  duration: number;
  workingHours: {
    start: string;
    end: string;
  };
  minimumNotice: number;
  description?: string;
  createdAt: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  formattedStart: string;
  formattedEnd: string;
  timezone: string;
  available: boolean;
}
