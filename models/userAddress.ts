import { Document, Schema, model, Types } from "mongoose";

export interface IUserAddress extends Document {
	telegram_id: number;
	address_id: Types.ObjectId;
	createdAt?: Date;
	updatedAt?: Date;
}


const userAddressSchema = new Schema<IUserAddress>(
	{
		telegram_id: { type: Schema.Types.Number, required: true },
		address_id: { type: Schema.Types.ObjectId, ref: "Address", required: true },
		createdAt: { type: Schema.Types.Date, default: Date.now },
	},
	{ timestamps: true },
);

export const UserAddress = model<IUserAddress>("UserAddress", userAddressSchema);
