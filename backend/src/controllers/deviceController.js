import { Device } from '../models/Device.js';
import { SmsMessage } from '../models/SmsMessage.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { emitDeviceUpdateToUser } from '../sockets/socketManager.js';

export const registerDevice = async (req, res, next) => {
  try {
    const { deviceId, deviceName, platform = 'Android' } = req.body;
    const userId = req.user._id;

    // Upsert device record for the authenticated user
    const device = await Device.findOneAndUpdate(
      { userId, deviceId: deviceId.trim() },
      {
        deviceName: deviceName.trim(),
        platform,
        lastSeen: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    emitDeviceUpdateToUser(userId, device);

    return successResponse(res, { device }, 'Device registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getDevices = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const devices = await Device.find({ userId }).sort({ lastSeen: -1 });

    return successResponse(res, { devices }, 'Devices retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteDevice = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user._id;

    const device = await Device.findOneAndDelete({ userId, deviceId });
    if (!device) {
      return errorResponse(res, 'Device not found or not owned by your account', 404);
    }

    // Optional: Also clean up synced SMS from that revoked device if requested
    if (req.query.deleteSms === 'true') {
      await SmsMessage.deleteMany({ userId, deviceId });
    }

    emitDeviceUpdateToUser(userId, { deviceId, revoked: true });

    return successResponse(res, { deviceId }, 'Device revoked successfully');
  } catch (error) {
    next(error);
  }
};
