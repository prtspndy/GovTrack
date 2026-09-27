import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { UserModel, IUser } from '../models/index.js';

export interface AuthRequest extends Request {
  user?: IUser;
  tokenPayload?: TokenPayload;
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required. Please login.'
      });
    }

    const decoded = verifyToken(token);
    req.tokenPayload = decoded;

    const user = await UserModel.findById(decoded.userId).exec();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    req.user = user;
    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
}
