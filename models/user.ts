import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
	telegram_id: number;
	language?: string;
	createdAt?: Date;
	updatedAt?: Date;
	reminderDay?: number; // День месяца для напоминания (1-31)
	remindersEnabled?: boolean;
	timezone?: string;
}

const userSchema = new Schema<IUser>(
	{
		telegram_id: {
			type: Schema.Types.Number,
			required: true,
			unique: true,
		},
		language: { type: String, default: "ru" },
		reminderDay: { type: Number, default: 20 }, // По умолчанию напоминаем 20-го числа
		remindersEnabled: { type: Boolean, default: true },
		timezone: { type: String, default: "Europe/Kyiv" },
	},
	{ timestamps: true },
);

export const User = model<IUser>("User", userSchema);
