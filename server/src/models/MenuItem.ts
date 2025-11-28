import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMenuItem extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  available: boolean;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    imageUrl: {
      type: String,
      trim: true
    },
    available: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const MenuItem = mongoose.model<IMenuItem>("MenuItem", MenuItemSchema);


