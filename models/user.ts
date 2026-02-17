import { Schema, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  telegram_id: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    telegram_id: {
      type: Number,
      required: true,
      unique: true,
    },
    name: { type: String },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
