import { Schema, model, Document, Types } from "mongoose";

export enum MeterType {
  SINGLE = "single",
  DAY_NIGHT = "day-night",
  MULTI_ZONE = "multi-zone",
}

export interface IAccount extends Document {
  account_number: string;
  resource: "electricity" | "water" | "gas" | "heating" | "internet" | "garbage" | "other";
  address_id: Types.ObjectId;
  meterType?: MeterType | undefined;
  currency: string;
  unit: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const accountSchema = new Schema<IAccount>(
  {
    account_number: { type: Schema.Types.String, required: true, unique: true },
    resource: {
      type: Schema.Types.String,
      enum: ["electricity", "water", "gas", "heating", "internet", "garbage", "other"],
      required: true,
    },
    address_id: { type: Schema.Types.ObjectId, ref: "Address", required: true },
    meterType: { type: String, enum: MeterType },
    currency: { type: String, default: "UAH" },
    unit: { type: String, default: "" },
  },
  { timestamps: true },
);

export const Account = model<IAccount>("Account", accountSchema);
