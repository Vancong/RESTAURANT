import mongoose, { Schema, Document, Types } from "mongoose";

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  RESTAURANT_ADMIN = "RESTAURANT_ADMIN"
}

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: UserRole;
  restaurantId?: Types.ObjectId;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordResetOtp?: string;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant"
    },
    passwordResetToken: {
      type: String,
      index: true
    },
    passwordResetExpires: Date,
    passwordResetOtp: String
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);

