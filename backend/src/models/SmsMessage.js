import mongoose from 'mongoose';

const smsMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    deviceMessageId: {
      type: String,
      required: true,
    },
    sender: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    body: {
      type: String,
      required: true,
      default: '',
    },
    timestamp: {
      type: Number, // Unix timestamp in milliseconds
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['inbox', 'sent', 'draft', 'outbox'],
      default: 'inbox',
      required: true,
    },
    threadId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// CRITICAL: Compound unique index prevents duplicate messages per user per device
smsMessageSchema.index(
  { userId: 1, deviceId: 1, deviceMessageId: 1 },
  { unique: true }
);

// High-performance compound indexes for dashboard queries
smsMessageSchema.index({ userId: 1, timestamp: -1 });
smsMessageSchema.index({ userId: 1, sender: 1, timestamp: -1 });
smsMessageSchema.index({ userId: 1, threadId: 1, timestamp: -1 });

export const SmsMessage = mongoose.model('SmsMessage', smsMessageSchema);
