/// <reference types="mongoose/types/aggregate" />
/// <reference types="mongoose/types/callback" />
/// <reference types="mongoose/types/collection" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/expressions" />
/// <reference types="mongoose/types/helpers" />
/// <reference types="mongoose/types/middlewares" />
/// <reference types="mongoose/types/indexes" />
/// <reference types="mongoose/types/models" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/populate" />
/// <reference types="mongoose/types/query" />
/// <reference types="mongoose/types/schemaoptions" />
/// <reference types="mongoose/types/session" />
/// <reference types="mongoose/types/types" />
/// <reference types="mongoose/types/utility" />
/// <reference types="mongoose/types/validation" />
/// <reference types="mongoose/types/virtuals" />
/// <reference types="mongoose/types/schematypes" />
/// <reference types="mongoose/types/inferschematype" />
/// <reference types="mongoose/types/inferrawdoctype" />
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
