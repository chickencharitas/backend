import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, getUserByEmail, getUserById, setPhoneVerified, updatePassword } from '../models/userModel.js';
import { sendOTP, verifyOTP } from '../utils/otpUtils.js';
const jwtSecret = process.env.JWT_SECRET || 'supersecret';

export const register = async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) return res.status(400).json({ message: 'Missing fields' });
  const existing = await getUserByEmail(email);
  if (existing) return res.status(400).json({ message: 'User exists' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser({ name, email, phone, passwordHash });
  await sendOTP(user.id, phone);
  res.status(201).json({ id: user.id, email: user.email, phone: user.phone });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await getUserByEmail(email);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '2h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone_verified: user.phone_verified } });
};

export const forgotPassword = async (req, res) => {
  // ... create reset token, email to user
  res.json({ message: 'Reset link sent (not implemented)' });
};

export const resetPassword = async (req, res) => {
  // ... validate token, update password
  res.json({ message: 'Password reset (not implemented)' });
};

export const phoneVerify = async (req, res) => {
  const { userId, code } = req.body;
  const valid = await verifyOTP(userId, code);
  if (!valid) return res.status(400).json({ message: 'Invalid OTP' });
  await setPhoneVerified(userId, true);
  res.json({ message: 'Phone verified' });
};