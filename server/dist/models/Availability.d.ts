import mongoose, { Document } from 'mongoose';
export interface IAvailability extends Document {
    interviewId: mongoose.Types.ObjectId;
    candidateId: mongoose.Types.ObjectId;
    date: string;
    startTime: string;
    endTime: string;
    timezone: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Availability: mongoose.Model<IAvailability, {}, {}, {}, mongoose.Document<unknown, {}, IAvailability, {}, {}> & IAvailability & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
