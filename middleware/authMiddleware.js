import jwt from 'jsonwebtoken';
const jwtSecret = process.env.JWT_SECRET || 'supersecret';
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token missing' });
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;
    next();
  } catch {
    res.status(403).json({ message: 'Token invalid or expired' });
  }
};