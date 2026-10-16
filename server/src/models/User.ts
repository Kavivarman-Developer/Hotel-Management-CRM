import mongoose, { Document, Schema } from 'mongoose';
import { UserRole, Permission, DEFAULT_ROLE_PERMISSIONS } from '../types';

export interface IUser extends Document {
  name: string;
  email: string;
  mobile: string;
  passwordHash: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt?: Date;
  refreshTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'User email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    mobile: {
      type: String,
      required: [true, 'User mobile number is required'],
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.FRONT_DESK,
      required: true,
      index: true,
    },
    permissions: {
      type: [String],
      default: function (this: IUser) {
        return DEFAULT_ROLE_PERMISSIONS[this.role] || [];
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLoginAt: {
      type: Date,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ role: 1, isActive: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
