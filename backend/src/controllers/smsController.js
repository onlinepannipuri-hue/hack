import { SmsMessage } from '../models/SmsMessage.js';
import { Device } from '../models/Device.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { emitNewSmsToUser, emitSyncCompleteToUser } from '../sockets/socketManager.js';

/**
 * Synchronize batch of SMS messages from an authenticated user's device
 * Implements bulk upsert with duplicate prevention based on { userId, deviceId, deviceMessageId }
 */
export const syncSms = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { deviceId, messages } = req.body;

    // Verify or register device
    let device = await Device.findOne({ userId, deviceId });
    if (!device) {
      device = await Device.create({
        userId,
        deviceId,
        deviceName: req.body.deviceName || 'Android Device',
        lastSeen: new Date(),
      });
    } else {
      device.lastSeen = new Date();
      await device.save();
    }

    if (!messages || messages.length === 0) {
      return successResponse(res, { syncedCount: 0, newCount: 0 }, 'Sync completed (0 messages)');
    }

    // Prepare bulk operations for idempotent upsert
    const bulkOps = messages.map((msg) => ({
      updateOne: {
        filter: {
          userId,
          deviceId,
          deviceMessageId: String(msg.deviceMessageId),
        },
        update: {
          $setOnInsert: {
            userId,
            deviceId,
            deviceMessageId: String(msg.deviceMessageId),
            sender: String(msg.sender).trim(),
            body: String(msg.body || ''),
            timestamp: Number(msg.timestamp),
            type: msg.type || 'inbox',
            threadId: msg.threadId ? String(msg.threadId) : null,
          },
        },
        upsert: true,
      },
    }));

    const result = await SmsMessage.bulkWrite(bulkOps, { ordered: false });
    const newInsertedCount = result.upsertedCount || 0;

    // Emit real-time updates for recently synced messages if any are new
    if (newInsertedCount > 0) {
      // Find the most recent inserted message to broadcast
      const latestMessage = messages.sort((a, b) => b.timestamp - a.timestamp)[0];
      emitNewSmsToUser(userId, {
        deviceId,
        sender: latestMessage.sender,
        body: latestMessage.body,
        timestamp: latestMessage.timestamp,
        type: latestMessage.type || 'inbox',
        threadId: latestMessage.threadId,
      });
    }

    const summary = {
      totalReceived: messages.length,
      newInserted: newInsertedCount,
      matchedExisting: result.matchedCount || 0,
      deviceId,
    };

    emitSyncCompleteToUser(userId, summary);

    return successResponse(res, summary, 'SMS synchronized successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get paginated list of SMS messages for authenticated user
 */
export const getSms = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { deviceId, sender, type, page = 1, limit = 50 } = req.query;

    const query = { userId };
    if (deviceId) query.deviceId = deviceId;
    if (sender) query.sender = sender;
    if (type) query.type = type;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [messages, total] = await Promise.all([
      SmsMessage.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      SmsMessage.countDocuments(query),
    ]);

    return successResponse(
      res,
      {
        messages,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: Math.ceil(total / limit),
        },
      },
      'Messages retrieved'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get distinct conversations grouped by sender with latest message preview
 */
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { deviceId } = req.query;

    const matchStage = { userId };
    if (deviceId) matchStage.deviceId = deviceId;

    const conversations = await SmsMessage.aggregate([
      { $match: matchStage },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$sender',
          sender: { $first: '$sender' },
          lastMessage: { $first: '$body' },
          lastTimestamp: { $first: '$timestamp' },
          lastType: { $first: '$type' },
          threadId: { $first: '$threadId' },
          deviceId: { $first: '$deviceId' },
          messageCount: { $sum: 1 },
        },
      },
      { $sort: { lastTimestamp: -1 } },
    ]);

    return successResponse(res, { conversations }, 'Conversations retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all messages for a specific conversation / sender in chronological order
 */
export const getConversationMessages = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { sender } = req.params;
    const { deviceId } = req.query;

    if (!sender) {
      return errorResponse(res, 'Sender parameter is required', 400);
    }

    const query = {
      userId,
      sender: decodeURIComponent(sender),
    };
    if (deviceId) query.deviceId = deviceId;

    const messages = await SmsMessage.find(query).sort({ timestamp: 1 }).lean();

    return successResponse(res, { sender: decodeURIComponent(sender), messages }, 'Conversation messages retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * Global search across sender phone/name and SMS body
 */
export const searchSms = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { q, limit = 50 } = req.query;

    if (!q || !q.trim()) {
      return successResponse(res, { results: [] }, 'Empty search query');
    }

    const searchRegex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const results = await SmsMessage.find({
      userId,
      $or: [{ sender: searchRegex }, { body: searchRegex }],
    })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10))
      .lean();

    return successResponse(res, { query: q, count: results.length, results }, 'Search results');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete synchronized server copies of SMS messages (Does not touch Android phone)
 */
export const deleteSms = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { deviceId, sender } = req.query;

    const filter = { userId };
    if (deviceId) filter.deviceId = deviceId;
    if (sender) filter.sender = decodeURIComponent(sender);

    const result = await SmsMessage.deleteMany(filter);

    return successResponse(
      res,
      { deletedCount: result.deletedCount },
      'Synchronized server-side SMS records deleted'
    );
  } catch (error) {
    next(error);
  }
};
