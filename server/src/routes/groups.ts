import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { Group } from '../models/Group';
import { Geofence } from '../models/Geofence';
import { MemberState } from '../models/MemberState';
import { authenticateRest, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all group routes
router.use(authenticateRest);

const CreateGroupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters').max(60),
});

const JoinGroupSchema = z.object({
  code: z.string().length(6, 'Invite code must be exactly 6 characters').toUpperCase(),
});

const CreateGeofenceSchema = z.object({
  name: z.string().min(2, 'Geofence name is required').max(50),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusM: z.number().min(20).max(20000),
});

function generateUniqueInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST /groups - Create a new group
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = CreateGroupSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { name } = parseResult.data;
    const userId = new Types.ObjectId(req.userId);

    // Generate unique 6-character invite code
    let inviteCode = generateUniqueInviteCode();
    let collisionCheck = await Group.findOne({ inviteCode });
    while (collisionCheck) {
      inviteCode = generateUniqueInviteCode();
      collisionCheck = await Group.findOne({ inviteCode });
    }

    const group = await Group.create({
      name: name.trim(),
      inviteCode,
      ownerId: userId,
      memberIds: [userId],
    });

    res.status(201).json({
      message: 'Group created successfully',
      group,
    });
  } catch (error) {
    console.error('[Create Group Error]:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// POST /groups/join - Join a group with 6-character code
router.post('/join', async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = JoinGroupSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const code = parseResult.data.code.trim().toUpperCase();
    const group = await Group.findOne({ inviteCode: code });

    if (!group) {
      res.status(404).json({ error: 'Group with this invite code was not found' });
      return;
    }

    const userId = new Types.ObjectId(req.userId);
    const isAlreadyMember = group.memberIds.some((id) => id.equals(userId));

    if (!isAlreadyMember) {
      group.memberIds.push(userId);
      await group.save();
    }

    res.json({
      message: isAlreadyMember ? 'Already a member of this group' : 'Joined group successfully',
      group,
    });
  } catch (error) {
    console.error('[Join Group Error]:', error);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// GET /groups - Get all groups for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.userId);
    const groups = await Group.find({ memberIds: userId })
      .populate('ownerId', 'name email')
      .sort({ updatedAt: -1 });

    const groupsWithCounts = groups.map((g) => ({
      _id: g._id,
      name: g.name,
      inviteCode: g.inviteCode,
      ownerId: g.ownerId,
      memberCount: g.memberIds.length,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }));

    res.json({ groups: groupsWithCounts });
  } catch (error) {
    console.error('[List Groups Error]:', error);
    res.status(500).json({ error: 'Failed to fetch user groups' });
  }
});

// GET /groups/:id - Get group details with members, geofences, and member states
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const groupIdStr = req.params.id;
    if (!Types.ObjectId.isValid(groupIdStr)) {
      res.status(400).json({ error: 'Invalid group identifier' });
      return;
    }

    const groupId = new Types.ObjectId(groupIdStr);
    const group = await Group.findById(groupId).populate('memberIds', 'name email expoPushToken');

    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    const isMember = group.memberIds.some((m: any) => m._id.toString() === req.userId);
    if (!isMember) {
      res.status(403).json({ error: 'You are not a member of this group' });
      return;
    }

    const [geofences, memberStates] = await Promise.all([
      Geofence.find({ groupId }).sort({ createdAt: -1 }),
      MemberState.find({ groupId }).populate('insideGeofenceIds', 'name'),
    ]);

    // Build map of member states
    const statesMap = new Map();
    memberStates.forEach((state) => {
      statesMap.set(state.userId.toString(), {
        lastLat: state.lastLat,
        lastLng: state.lastLng,
        lastTs: state.lastTs,
        insideGeofences: state.insideGeofenceIds,
      });
    });

    const membersWithState = (group.memberIds as any[]).map((member) => ({
      id: member._id.toString(),
      name: member.name,
      email: member.email,
      state: statesMap.get(member._id.toString()) || null,
    }));

    res.json({
      group: {
        _id: group._id,
        name: group.name,
        inviteCode: group.inviteCode,
        ownerId: group.ownerId,
        createdAt: group.createdAt,
      },
      members: membersWithState,
      geofences,
    });
  } catch (error) {
    console.error('[Get Group Detail Error]:', error);
    res.status(500).json({ error: 'Failed to fetch group details' });
  }
});

// POST /groups/:id/geofences - Add a geofence to group
router.post('/:id/geofences', async (req: AuthRequest, res: Response) => {
  try {
    const groupIdStr = req.params.id;
    if (!Types.ObjectId.isValid(groupIdStr)) {
      res.status(400).json({ error: 'Invalid group identifier' });
      return;
    }

    const groupId = new Types.ObjectId(groupIdStr);
    const group = await Group.findById(groupId);

    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    const isMember = group.memberIds.some((mId) => mId.toString() === req.userId);
    if (!isMember) {
      res.status(403).json({ error: 'You are not a member of this group' });
      return;
    }

    const parseResult = CreateGeofenceSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { name, lat, lng, radiusM } = parseResult.data;

    const geofence = await Geofence.create({
      groupId,
      name: name.trim(),
      lat,
      lng,
      radiusM,
    });

    res.status(201).json({
      message: 'Geofence created successfully',
      geofence,
    });
  } catch (error) {
    console.error('[Create Geofence Error]:', error);
    res.status(500).json({ error: 'Failed to create geofence' });
  }
});

// DELETE /groups/:id/geofences/:geofenceId - Delete geofence
router.delete('/:id/geofences/:geofenceId', async (req: AuthRequest, res: Response) => {
  try {
    const { id: groupIdStr, geofenceId: geofenceIdStr } = req.params;
    if (!Types.ObjectId.isValid(groupIdStr) || !Types.ObjectId.isValid(geofenceIdStr)) {
      res.status(400).json({ error: 'Invalid identifier' });
      return;
    }

    const geofence = await Geofence.findOneAndDelete({
      _id: new Types.ObjectId(geofenceIdStr),
      groupId: new Types.ObjectId(groupIdStr),
    });

    if (!geofence) {
      res.status(404).json({ error: 'Geofence not found' });
      return;
    }

    // Clean up insideGeofenceIds references in MemberState
    await MemberState.updateMany(
      { groupId: new Types.ObjectId(groupIdStr) },
      { $pull: { insideGeofenceIds: new Types.ObjectId(geofenceIdStr) } }
    );

    res.json({ message: 'Geofence deleted successfully', geofenceId: geofenceIdStr });
  } catch (error) {
    console.error('[Delete Geofence Error]:', error);
    res.status(500).json({ error: 'Failed to delete geofence' });
  }
});

export default router;
