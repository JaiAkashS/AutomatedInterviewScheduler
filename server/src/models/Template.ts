import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplate extends Document {
  title: string;
  type: string;
  duration: number; // in minutes
  workingHours: {
    start: string;
    end: string;
  };
  minimumNotice: number; // in hours
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, required: true, default: 'Technical Interview' },
    duration: { type: Number, required: true, default: 60 },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
    },
    minimumNotice: { type: Number, default: 12 },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Template = mongoose.model<ITemplate>('Template', TemplateSchema);
