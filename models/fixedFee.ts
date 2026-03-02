import { Schema, model, type Document, type Types } from "mongoose";

export interface IFixedFee extends Document {
  account_id: Types.ObjectId;
  amount: number;
  startDate: Date;
}

const fixedFeeSchema = new Schema<IFixedFee>({
  account_id: { type: Schema.Types.ObjectId, ref: "Account", required: true },
  amount: { type: Number, required: true },
  startDate: { type: Date, required: true },
});

export const FixedFee = model<IFixedFee>("FixedFee", fixedFeeSchema);
