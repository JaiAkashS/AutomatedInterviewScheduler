import mongoose, { Document } from 'mongoose';
import { InterviewStatus } from '../types';
export interface ISelectedSlot {
    start: Date;
    end: Date;
    timezone: string;
}
export interface IInterview extends Document {
    candidateId: mongoose.Types.ObjectId;
    recruiterId: mongoose.Types.ObjectId;
    interviewerIds: mongoose.Types.ObjectId[];
    title: string;
    type: string;
    duration: number;
    status: InterviewStatus;
    schedulingToken: string;
    tokenExpiresAt: Date;
    timezone: string;
    schedulingWindow: {
        startDate: Date;
        endDate: Date;
    };
    workingHours: {
        start: string;
        end: string;
    };
    minimumNotice: number;
    selectedSlot?: ISelectedSlot;
    googleEventId?: string;
    meetingLink?: string;
    cancellationReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Interview: mongoose.Model<IInterview, {}, {}, {}, mongoose.Document<unknown, {}, IInterview, {}, {}> & IInterview & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
