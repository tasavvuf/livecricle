import { Router, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { authenticateRest, AuthRequest } from '../middleware/auth';

const router = Router();

const PushTokenSchema = z.object({
  expoPushToken: z.string().trim(),
});

// PUT /me/push-token
router.put('/push-token', authenticateRest, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = PushTokenSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { expoPushToken } = parseResult.data;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { expoPushToken },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      message: 'Push token updated successfully',
      expoPushToken: user.expoPushToken,
    });
  } catch (error) {
    console.error('[Update Push Token Error]:', error);
    res.status(500).json({ error: 'Failed to update push notification token' });
  }
});

export default router;
