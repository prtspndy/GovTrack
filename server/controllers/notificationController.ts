import { Response } from 'express';
import { NotificationModel } from '../models/index.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notifications = await NotificationModel.find({ user: req.user._id })
      .populate(['request'])
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    const unreadCount = await NotificationModel.countDocuments({
      user: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const notification = await NotificationModel.findById(id).exec();
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    const notifUserId = (notification.user as any)?._id || notification.user;
    if (String(notifUserId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const updated = await NotificationModel.findByIdAndUpdate(
      id,
      { $set: { isRead: true } },
      { new: true }
    );

    res.json({
      success: true,
      data: updated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const allNotifs = await NotificationModel.find({ user: req.user._id, isRead: false }).exec();
    for (const notif of allNotifs) {
      await NotificationModel.findByIdAndUpdate(notif._id, { $set: { isRead: true } });
    }

    res.json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
