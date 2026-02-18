import { Schema, model, Document, Types } from "mongoose";

export enum TariffType {
	"single",
	"day-night",
	"multi-zone",
}

export interface ZoneParams {
	name: string;
	price: number;
}

export interface ITariff extends Document {
	account_id: Types.ObjectId;
	type: string;
	zones: ZoneParams[];
	startDate: Date;
	endDate?: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

const tariffSchema = new Schema<ITariff>(
	{
		account_id: { type: Schema.Types.ObjectId, ref: "Account", required: true },
		// Тип тарифа: однотарифный, двухтарифный, трёхтарифный
		type: { type: Schema.Types.String, enum: TariffType, required: true },
		// Стоимость по зонам
		zones: [
			{
				name: { type: Schema.Types.String, required: true }, // "day", "night", "peak", "half-peak"
				price: { type: Schema.Types.Number, required: true }, // цена за кВт·ч
			},
		],
		startDate: { type: Schema.Types.Date, required: true },
		endDate: { type: Schema.Types.Date }, // может быть null
		createdAt: { type: Schema.Types.Date, default: Date.now },
	},
	{ timestamps: true },
);

export const Tariff = model<ITariff>("Tariff", tariffSchema);
