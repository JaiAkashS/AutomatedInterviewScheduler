import { InterviewStatus } from '../types';

const ALLOWED_TRANSITIONS: Record<InterviewStatus, InterviewStatus[]> = {
  DRAFT: ['SCHEDULING', 'CANCELLED'],
  SCHEDULING: ['SCHEDULED', 'EXPIRED', 'CANCELLED'],
  SCHEDULED: ['RESCHEDULE_REQUESTED', 'COMPLETED', 'CANCELLED'],
  RESCHEDULE_REQUESTED: ['SCHEDULED', 'CANCELLED', 'EXPIRED'],
  CANCELLED: [],
  COMPLETED: [],
  EXPIRED: ['SCHEDULING', 'CANCELLED'],
};

export class InterviewStateMachine {
  public static canTransition(currentStatus: InterviewStatus, targetStatus: InterviewStatus): boolean {
    if (currentStatus === targetStatus) return true;
    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    return allowed ? allowed.includes(targetStatus) : false;
  }

  public static validateTransition(currentStatus: InterviewStatus, targetStatus: InterviewStatus): void {
    if (!this.canTransition(currentStatus, targetStatus)) {
      throw new Error(`Invalid status transition from '${currentStatus}' to '${targetStatus}'.`);
    }
  }
}
