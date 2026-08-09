import { SchedulingService } from '../src/services/scheduling/SchedulingService';
import { InterviewStateMachine } from '../src/services/stateMachine';

describe('Scheduling Engine - Interval Merging & State Machine', () => {
  describe('mergeBusyIntervals', () => {
    it('should correctly merge overlapping intervals', () => {
      const busy = [
        { start: new Date('2026-08-10T10:00:00Z'), end: new Date('2026-08-10T11:00:00Z') },
        { start: new Date('2026-08-10T10:30:00Z'), end: new Date('2026-08-10T12:00:00Z') },
        { start: new Date('2026-08-10T14:00:00Z'), end: new Date('2026-08-10T15:00:00Z') },
      ];

      const merged = SchedulingService.mergeBusyIntervals(busy);

      expect(merged).toHaveLength(2);
      expect(merged[0].start.toISOString()).toBe('2026-08-10T10:00:00.000Z');
      expect(merged[0].end.toISOString()).toBe('2026-08-10T12:00:00.000Z');
      expect(merged[1].start.toISOString()).toBe('2026-08-10T14:00:00.000Z');
      expect(merged[1].end.toISOString()).toBe('2026-08-10T15:00:00.000Z');
    });

    it('should return empty array if input is empty', () => {
      expect(SchedulingService.mergeBusyIntervals([])).toEqual([]);
    });
  });

  describe('InterviewStateMachine', () => {
    it('should allow valid transitions', () => {
      expect(InterviewStateMachine.canTransition('SCHEDULING', 'SCHEDULED')).toBe(true);
      expect(InterviewStateMachine.canTransition('SCHEDULED', 'CANCELLED')).toBe(true);
      expect(InterviewStateMachine.canTransition('SCHEDULED', 'RESCHEDULE_REQUESTED')).toBe(true);
      expect(InterviewStateMachine.canTransition('RESCHEDULE_REQUESTED', 'SCHEDULED')).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(InterviewStateMachine.canTransition('CANCELLED', 'SCHEDULED')).toBe(false);
      expect(InterviewStateMachine.canTransition('COMPLETED', 'SCHEDULING')).toBe(false);
    });
  });
});
