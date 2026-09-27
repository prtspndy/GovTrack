import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

export function authorizeRoles(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access is restricted to [${allowedRoles.join(', ')}].`
      });
    }

    next();
  };
}
