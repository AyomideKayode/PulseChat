// server/src/controllers/message.controller.ts

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Message from '../models/message.model.js';
import User from '../models/user.model.js';
import Conversation from '../models/conversation.model.js';

export const getAllContacts = async (req: Request, res: Response): Promise<void> => {
  try {
    const loggedInUserId = req.user!._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select(
      'fullName email profilePicture',
    );

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const loggedInUserId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    const { before } = req.query as { before?: string };
    const limit = 50;

    const filter: Record<string, unknown> = {
      $or: [
        { senderId: loggedInUserId, receiverId: userId },
        { senderId: userId, receiverId: loggedInUserId },
      ],
    };

    if (before && mongoose.Types.ObjectId.isValid(before)) {
      filter._id = { $lt: new mongoose.Types.ObjectId(before) };
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('senderId', 'fullName email profilePicture')
      .populate('receiverId', 'fullName email profilePicture');

    res.status(200).json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .sort({ 'lastMessage.createdAt': -1 })
      .populate('participants', 'fullName email profilePicture');

    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
