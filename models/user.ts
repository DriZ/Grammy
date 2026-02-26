import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
	telegram_id: number;
	language?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
	{
		telegram_id: {
			type: Schema.Types.Number,
			required: true,
			unique: true,
		},
		language: { type: String, default: "ru" },
	},
	{ timestamps: true },
);

export const User = model<IUser>("User", userSchema);
