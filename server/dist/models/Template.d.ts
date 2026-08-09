import mongoose, { Document } from 'mongoose';
export interface ITemplate extends Document {
    title: string;
    type: string;
    duration: number;
    workingHours: {
        start: string;
        end: string;
    };
    minimumNotice: number;
    description?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Template: mongoose.Model<ITemplate, {}, {}, {}, mongoose.Document<unknown, {}, ITemplate, {}, {}> & ITemplate & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
