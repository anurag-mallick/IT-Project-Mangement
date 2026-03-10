const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !user.isActive || !(await comparePassword(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// Admin: List all users
router.get('/users', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin: Create staff user
router.post('/users', authenticate, authorize(['ADMIN']), async (req, res) => {
  const { username, password, name, role } = req.body;
  const hashedPassword = await hashPassword(password);

  try {
    const newUser = await prisma.user.create({
      data: { username, password: hashedPassword, name, role: role || 'STAFF' }
    });
    res.json({ message: 'User created', user: { id: newUser.id, username: newUser.username } });
  } catch (e) {
    res.status(400).json({ error: 'User already exists' });
  }
});

// Admin: Remove user access (Deactivate)
router.patch('/users/:id/deactivate', authenticate, authorize(['ADMIN']), async (req, res) => {
  const { id } = req.params;
  await prisma.user.update({
    where: { id: parseInt(id) },
    data: { isActive: false }
  });
  res.json({ message: 'User deactivated' });
});

module.exports = router;
