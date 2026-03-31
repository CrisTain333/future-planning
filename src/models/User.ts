import mongoose, { Schema, Document } from "mongoose";

export interface IUserDocument extends Document {
  fullName: string;
  username: string;
  email?: string;
  password: string;
  phone?: string;
  address?: string;
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";
  profilePicture?: string;
  role: "admin" | "user";
  isDisabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true, lowercase: true },
    email: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    profilePicture: { type: String },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    isDisabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
export default User;
