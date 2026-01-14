import jwt from 'jsonwebtoken';

export const generateToken = (userId, res) => {
  // Create the token
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Token valid for 7 days
  });

  // Set the cookie
  res.cookie('jwt', token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true, // Prevent XSS attacks
    sameSite: 'strict', // Prevent CSRF attacks
    secure: process.env.NODE_ENV !== 'development', // Only use HTTPS in production
  });

  return token;
};
