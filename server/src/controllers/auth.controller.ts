// server/src/controllers/auth.controller.ts

import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { sendWelcomeEmail } from '../emails/emailHandlers.js'
import { generateToken } from '../lib/utils.js'
import { ENV } from '../lib/env.js'
import cloudinary from '../lib/cloudinary.js'
import User from '../models/user.model.js'
import { toUserResponse } from '../types/user.types.js'

export const signup = async (req: Request, res: Response): Promise<void> => {
  const { fullName, email, password } = req.body as {
    fullName?: string
    email?: string
    password?: string
  }

  try {
    if (!fullName || !email || !password) {
      res.status(400).json({ message: 'All fields are required.' })
      return
    }

    if (password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters long.' })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: 'Invalid email format.' })
      return
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      res.status(400).json({ message: 'Unable to create account with provided details.' })
      return
    }

    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newUser = new User({ fullName, email, password: hashedPassword })
    const savedUser = await newUser.save()
    generateToken(savedUser._id, res)

    try {
      await sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL)
    } catch (error) {
      console.error('Failed to send welcome email (non-blocking):', error)
    }

    res.status(201).json(toUserResponse(savedUser))
  } catch (error) {
    console.error('Error during signup:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string }

  try {
    if (!email || !password) {
      res.status(400).json({ message: 'All fields are required.' })
      return
    }

    const user = await User.findOne({ email })
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials provided.' })
      return
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials provided.' })
      return
    }

    generateToken(user._id, res)
    res.status(200).json(toUserResponse(user))
  } catch (error) {
    console.error('Error during login:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
}

export const logout = (_req: Request, res: Response): void => {
  res.cookie('jwt', '', { maxAge: 0 })
  res.status(200).json({ message: 'Logged out successfully.' })
}

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, profilePicture } = req.body as {
      fullName?: string
      profilePicture?: string
    }
    const userId = req.user!._id

    if (!fullName && !profilePicture) {
      res.status(400).json({ message: 'At least one field is required' })
      return
    }

    const updatedData: Record<string, unknown> = {}
    if (fullName) updatedData.fullName = fullName

    if (profilePicture) {
      const currentUser = await User.findById(userId)
      if (!currentUser) {
        res.status(404).json({ message: 'User not found.' })
        return
      }

      if (currentUser.profilePicture?.publicId) {
        try {
          await cloudinary.uploader.destroy(currentUser.profilePicture.publicId)
        } catch (destroyError) {
          console.error('Failed to delete old profile picture:', destroyError)
        }
      }

      const uploadResponse = await cloudinary.uploader.upload(profilePicture)
      updatedData.profilePicture = {
        url: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedData },
      { new: true },
    ).select('-password')

    if (!updatedUser) {
      res.status(404).json({ message: 'User not found.' })
      return
    }

    res.status(200).json(toUserResponse(updatedUser))
  } catch (error) {
    console.error('Error updating profile:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
}

export const checkAuth = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json(toUserResponse(req.user!))
}
