import { verifyAccessToken } from '../utils/tokens.js';
import { User } from '../models/User.js';
import { errorResponse } from '../utils/response.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication token required', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return errorResponse(res, 'Authentication token malformed', 401);
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token has expired. Please refresh your session.', 401);
      }
      return errorResponse(res, 'Invalid authentication token', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return errorResponse(res, 'User account no longer exists', 401);
    }

    // Attach verified user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error.message);
    return errorResponse(res, 'Internal authentication error', 500);
  }
};
