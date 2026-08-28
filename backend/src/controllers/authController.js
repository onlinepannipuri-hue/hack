import { User } from '../models/User.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokens.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 'An account with this email already exists', 409);
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    return successResponse(
      res,
      {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return errorResponse(res, 'Invalid email or password credentials', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password credentials', 401);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Limit active refresh tokens to 10
    if (user.refreshTokens.length >= 10) {
      user.refreshTokens.shift();
    }
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    return successResponse(
      res,
      {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
      'Logged in successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return errorResponse(res, 'Refresh token is required', 400);
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return errorResponse(res, 'Invalid or expired refresh token', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return errorResponse(res, 'User not found', 401);
    }

    const tokenIndex = user.refreshTokens.findIndex((t) => t.token === token);
    if (tokenIndex === -1) {
      return errorResponse(res, 'Refresh token has been revoked', 401);
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);
    return successResponse(res, { accessToken: newAccessToken }, 'Token refreshed');
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (token && req.user) {
      req.user.refreshTokens = req.user.refreshTokens.filter((t) => t.token !== token);
      await req.user.save();
    }
    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) => {
  return successResponse(res, { user: req.user.toJSON() }, 'User profile retrieved');
};
