import { verifyToken as verifyJwtToken } from '../utils/jwt.js';
import { resolveAccountFromToken } from '../services/portalAuthService.js';

export const verifyToken = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided',
      });
    }

    const decoded = verifyJwtToken(token);
    const account = await resolveAccountFromToken(decoded);

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists',
      });
    }

    const role = account.role || account.accountType;

    req.user = {
      ...account,
      _id: account._id,
      id: account.id || account._id?.toString?.(),
      role,
      accountType: account.accountType || role,
    };

    next();
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized, invalid token',
    });
  }
};

export default verifyToken;
