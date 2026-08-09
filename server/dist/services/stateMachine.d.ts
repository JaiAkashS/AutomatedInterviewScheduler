import { InterviewStatus } from '../types';
export declare class InterviewStateMachine {
    static canTransition(currentStatus: InterviewStatus, targetStatus: InterviewStatus): boolean;
    static validateTransition(currentStatus: InterviewStatus, targetStatus: InterviewStatus): void;
}
