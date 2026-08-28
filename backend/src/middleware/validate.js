import { errorResponse } from '../utils/response.js';

export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return errorResponse(res, errors.join(', '), 400, errors);
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return errorResponse(res, 'Email and password are required', 400);
  }
  next();
};

export const validateDeviceRegister = (req, res, next) => {
  const { deviceId, deviceName } = req.body;
  if (!deviceId || typeof deviceId !== 'string' || !deviceId.trim()) {
    return errorResponse(res, 'Valid deviceId is required', 400);
  }
  if (!deviceName || typeof deviceName !== 'string' || !deviceName.trim()) {
    return errorResponse(res, 'Valid deviceName is required', 400);
  }
  next();
};

export const validateSmsSync = (req, res, next) => {
  const { deviceId, messages } = req.body;

  if (!deviceId || typeof deviceId !== 'string' || !deviceId.trim()) {
    return errorResponse(res, 'Valid deviceId is required', 400);
  }

  if (!Array.isArray(messages)) {
    return errorResponse(res, 'Messages must be provided as an array', 400);
  }

  // Validate each message structure
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg.deviceMessageId || !msg.sender || msg.timestamp === undefined) {
      return errorResponse(
        res,
        `Message at index ${i} is missing required fields (deviceMessageId, sender, timestamp)`,
        400
      );
    }
  }

  next();
};
