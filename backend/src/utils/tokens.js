import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    ENV.JWT_SECRET,
    { expiresIn: ENV.ACCESS_TOKEN_EXPIRY }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
    },
    ENV.JWT_REFRESH_SECRET,
    { expiresIn: ENV.REFRESH_TOKEN_EXPIRY }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, ENV.JWT_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, ENV.JWT_REFRESH_SECRET);
};
