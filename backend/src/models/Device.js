import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: [true, 'Device ID is required'],
      trim: true,
    },
    deviceName: {
      type: String,
      required: [true, 'Device Name is required'],
      trim: true,
      default: 'Android Device',
    },
    platform: {
      type: String,
      default: 'Android',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring a user cannot have duplicate deviceId registrations
deviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

export const Device = mongoose.model('Device', deviceSchema);
