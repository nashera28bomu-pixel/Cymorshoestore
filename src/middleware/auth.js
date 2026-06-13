import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  const valid = password === process.env.ADMIN_PASSWORD ||
    await bcrypt.compare(password, process.env.ADMIN_PASSWORD || '');

  if (!valid) return res.status(401).json({ error: 'Invalid password' });

  const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

export default router;
