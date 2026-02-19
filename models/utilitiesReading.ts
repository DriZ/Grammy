import { Schema, model, Document, Types } from "mongoose";

export type ZoneReading = {
	name: string; // "day", "night", "peak", "half-peak"
	value: number;
}

export interface IUtilitiesReading extends Document {
	account_id: Types.ObjectId;
	year: number; // новый атрибут
	month: number; // новый атрибут (1–12)
	zones: ZoneReading[];
	createdAt?: Date;
	updatedAt?: Date;
}

const utilitiesReadingSchema = new Schema<IUtilitiesReading>(
	{
		account_id: { type: Schema.Types.ObjectId, required: true, ref: "Account" },
		year: { type: Number, required: true },
		month: { type: Number, required: true, min: 1, max: 12 },
		zones: [
			{
				name: { type: Schema.Types.String, required: true },
				value: { type: Schema.Types.Number, required: true, min: 0 },
			},
		],
	},
	{ timestamps: true },
);

// уникальность показаний для одного счёта в конкретный месяц/год
utilitiesReadingSchema.index({ account_id: 1, year: 1, month: 1 }, { unique: true });

export const UtilitiesReading = model<IUtilitiesReading>(
	"UtilitiesReading",
	utilitiesReadingSchema,
);
