import { Schema, model, Document, Types } from "mongoose";

export interface IBilling extends Document {
	account_id: Types.ObjectId;
	month: Date;
	total_cost: number;
	createdAt?: Date;
	updatedAt?: Date;
}

const billingSchema = new Schema<IBilling>(
	{
		account_id: { type: Schema.Types.ObjectId, required: true, ref: "Account" },
		month: { type: Date, required: true },
		total_cost: { type: Number, required: true, min: 0 }
	},
	{ timestamps: true }
);

billingSchema.index({ account_id: 1, month: 1 }, { unique: true });
export const Billing = model<IBilling>("Billing", billingSchema);
