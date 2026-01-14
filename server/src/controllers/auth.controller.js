import { generateToken } from '../lib/utils.js';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 8 characters long.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      await newUser.save(); // Ensure User exists in the DB
      generateToken(newUser._id, res); // Give them the keys to the kingdom

      return res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePicture: newUser.profilePicture,
      });
    } else {
      return res.status(400).json({ message: 'Invalid user data.' });
    }
  } catch (error) {
    console.error('Error during signup:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
