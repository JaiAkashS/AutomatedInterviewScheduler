import mongoose, { Document } from 'mongoose';
export interface ICandidate extends Document {
    name: string;
    email: string;
    passwordHash?: string;
    timezone: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Candidate: mongoose.Model<ICandidate, {}, {}, {}, mongoose.Document<unknown, {}, ICandidate, {}, {}> & ICandidate & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
