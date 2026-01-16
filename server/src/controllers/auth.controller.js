import { sendWelcomeEmail } from '../emails/emailHandlers.js';
import { generateToken } from '../lib/utils.js';
import { ENV } from '../lib/env.js';
import cloudinary from '../lib/cloudinary.js';
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
      return res
        .status(400)
        .json({ message: 'Unable to create account with provided details.' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save(); // Ensure User exists in the DB
    generateToken(savedUser._id, res); // Give them the keys to the kingdom

    // send welcome email to new users
    try {
      await sendWelcomeEmail(
        savedUser.email,
        savedUser.fullName,
        ENV.CLIENT_URL
      );
    } catch (error) {
      // We catch this separately so that if the email fails,
      // the user still gets their "Account Created" success response.
      console.error('Failed to send welcome email (non-blocking):', error);
    }

    return res.status(201).json({
      _id: savedUser._id,
      fullName: savedUser.fullName,
      email: savedUser.email,
      profilePicture: savedUser.profilePicture,
    });
  } catch (error) {
    console.error('Error during signup:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'Invalid credentials provided.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid credentials provided.' });

    generateToken(user._id, res); // Issue new token on login

    return res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const logout = (_, res) => {
  res.cookie('jwt', '', { maxAge: 0 });
  return res.status(200).json({ message: 'Logged out successfully.' });
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, profilePicture } = req.body;
    const userId = req.user._id;

    if (!fullName && !profilePicture) {
      return res.status(400).json({
        message: 'At least one field is required',
      });
    }

    const updatedData = {}; // Prepare an object to hold updated fields
    if (fullName) updatedData.fullName = fullName;
    // only upload if a new profile picture is provided
    if (profilePicture) {
      const uploadResponse = await cloudinary.uploader.upload(profilePicture);
      updatedData.profilePicture = uploadResponse.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedData },
      { new: true }
    ).select('-password');

    if (!updatedUser)
      return res.status(404).json({ message: 'User not found.' });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
