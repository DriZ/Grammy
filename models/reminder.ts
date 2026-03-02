import { Schema, model, Document } from "mongoose";

export interface IReminder extends Document {
  telegram_id: number;
  title: string;
  dayOfMonth: number;
  hour: number;
  minute: number;
  isEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const reminderSchema = new Schema<IReminder>(
  {
    telegram_id: { type: Number, required: true },
    title: { type: String, required: true, default: "Напоминание" },
    dayOfMonth: { type: Number, required: true, min: 1, max: 31 },
    hour: { type: Number, required: true, min: 0, max: 23, default: 10 },
    minute: { type: Number, required: true, min: 0, max: 59, default: 0 },
    isEnabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Reminder = model<IReminder>("Reminder", reminderSchema);
