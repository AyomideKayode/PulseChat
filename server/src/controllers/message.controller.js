// server/src/controllers/message.controller.js
import Message from '../models/message.model.js';
import User from '../models/user.model.js';

// Get all contacts for the authenticated user
export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id; // get logged in user ID from auth middleware
    // filter users to get all except the logged in user
    const filteredContacts = await User.find(
      { _id: { $ne: loggedInUserId } },
      'username',
    ).select('-password');

    res.status(200).json(filteredContacts);

    // Find all messages where the user is either the sender or receiver
    const messages = await Message.find({
      $or: [{ sender: loggedInUserId }, { receiver: loggedInUserId }],
    })
      .populate('sender', 'username')
      .populate('receiver', 'username');

    // Extract unique contacts from messages
    const contactsMap = new Map();
    messages.forEach((msg) => {
      const contactId =
        msg.sender._id.toString() === userId.toString()
          ? msg.receiver._id.toString()
          : msg.sender._id.toString();
      if (!contactsMap.has(contactId)) {
        contactsMap.set(contactId, {
          _id: contactId,
          username:
            msg.sender._id.toString() === userId.toString()
              ? msg.receiver.username
              : msg.sender.username,
        });
      }
    });

    const contacts = Array.from(contactsMap.values());
    res.status(200).json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
