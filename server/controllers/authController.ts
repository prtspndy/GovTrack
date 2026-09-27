import { Request, Response } from 'express';
import { UserModel, AuditLogModel } from '../models/index.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { AuthRequest } from '../middleware/auth.js';

export async function register(req: Request, res: Response) {
  try {
    const { firstName, lastName, email, mobileNumber, password, address, city, district, state, pincode } = req.body;

    if (!firstName || !lastName || !email || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: firstName, lastName, email, mobileNumber, and password.'
      });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const existing = await UserModel.findOne({ email: emailNorm }).exec();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const hashedPassword = await hashPassword(password);
    const user = await UserModel.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: emailNorm,
      mobileNumber: mobileNumber.trim(),
      password: hashedPassword,
      role: 'citizen',
      address: address?.trim() || '',
      city: city?.trim() || '',
      district: district?.trim() || '',
      state: state?.trim() || '',
      pincode: pincode?.trim() || '',
      isActive: true,
      isVerified: true
    });

    const token = generateToken({
      userId: user._id,
      role: user.role,
      email: user.email
    });

    await AuditLogModel.create({
      user: user._id,
      action: 'CITIZEN_REGISTERED',
      description: `New citizen registration for ${user.firstName} ${user.lastName} (${user.email})`,
      ipAddress: req.ip || '127.0.0.1'
    });

    const { password: _, ...safeUser } = user;

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        user: safeUser,
        token
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed.'
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const user = await UserModel.findOne({ email: emailNorm }).exec();

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact an administrator.'
      });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken({
      userId: user._id,
      role: user.role,
      email: user.email
    });

    await AuditLogModel.create({
      user: user._id,
      action: user.role === 'admin' ? 'ADMIN_LOGIN' : 'CITIZEN_LOGIN',
      description: `${user.role.toUpperCase()} logged in: ${user.email}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        user: safeUser,
        token
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed.'
    });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { password: _, ...safeUser } = req.user;
    res.json({
      success: true,
      data: safeUser
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { firstName, lastName, mobileNumber, address, city, district, state, pincode, profilePhoto } = req.body;

    const updated = await UserModel.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          ...(firstName && { firstName: firstName.trim() }),
          ...(lastName && { lastName: lastName.trim() }),
          ...(mobileNumber && { mobileNumber: mobileNumber.trim() }),
          ...(address !== undefined && { address: address.trim() }),
          ...(city !== undefined && { city: city.trim() }),
          ...(district !== undefined && { district: district.trim() }),
          ...(state !== undefined && { state: state.trim() }),
          ...(pincode !== undefined && { pincode: pincode.trim() }),
          ...(profilePhoto !== undefined && { profilePhoto })
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { password: _, ...safeUser } = updated;

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: safeUser
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function logout(_req: Request, res: Response) {
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
}
