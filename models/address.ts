import { Document, Schema, model } from "mongoose";

export interface IAddress extends Document {
	name: string;
	ownerId?: number;
	createdAt?: Date;
	updatedAt?: Date;
}

const addressSchema = new Schema<IAddress>(
	{
		name: { type: Schema.Types.String, required: true },
		ownerId: { type: Schema.Types.Number },
		createdAt: { type: Schema.Types.Date, default: Date.now },
	},
	{ timestamps: true },
);

export const Address = model<IAddress>("Address", addressSchema);
