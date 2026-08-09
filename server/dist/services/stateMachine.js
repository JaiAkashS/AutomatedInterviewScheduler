"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewStateMachine = void 0;
const ALLOWED_TRANSITIONS = {
    DRAFT: ['SCHEDULING', 'CANCELLED'],
    SCHEDULING: ['SCHEDULED', 'EXPIRED', 'CANCELLED'],
    SCHEDULED: ['RESCHEDULE_REQUESTED', 'COMPLETED', 'CANCELLED'],
    RESCHEDULE_REQUESTED: ['SCHEDULED', 'CANCELLED', 'EXPIRED'],
    CANCELLED: [],
    COMPLETED: [],
    EXPIRED: ['SCHEDULING', 'CANCELLED'],
};
class InterviewStateMachine {
    static canTransition(currentStatus, targetStatus) {
        if (currentStatus === targetStatus)
            return true;
        const allowed = ALLOWED_TRANSITIONS[currentStatus];
        return allowed ? allowed.includes(targetStatus) : false;
    }
    static validateTransition(currentStatus, targetStatus) {
        if (!this.canTransition(currentStatus, targetStatus)) {
            throw new Error(`Invalid status transition from '${currentStatus}' to '${targetStatus}'.`);
        }
    }
}
exports.InterviewStateMachine = InterviewStateMachine;
