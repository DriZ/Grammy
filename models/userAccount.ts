import { Schema, model, Document, Types } from "mongoose";

export interface IUserAccount extends Document {
	telegram_id: number;
	account_id: Types.ObjectId;
	createdAt?: Date;
	updatedAt?: Date;
}

const userAccountSchema = new Schema<IUserAccount>(
	{
		telegram_id: { type: Schema.Types.Number, required: true, ref: "User" },
		account_id: { type: Schema.Types.ObjectId, required: true, ref: "Account" },
	},
	{ timestamps: true },
);

userAccountSchema.index({ telegram_id: 1, account_id: 1 }, { unique: true });
export const UserAccount = model<IUserAccount>("UserAccount", userAccountSchema);
