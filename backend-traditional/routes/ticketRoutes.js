const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authenticate } = require('../middleware/authMiddleware');

// Internal: Professional Ticket Management
router.get('/tickets', authenticate, async (req, res) => {
  const tickets = await prisma.ticket.findMany({
    include: { 
      assignedTo: { select: { id: true, username: true, name: true } },
      comments: { include: { author: { select: { name: true } } }, orderBy: { createdAt: 'asc' } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(tickets);
});

// Internal: Create a new ticket
router.post('/tickets', authenticate, async (req, res) => {
  const { title, description, priority, status, assignedToId } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }
  try {
    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        status: status || 'TODO',
        assignedToId: assignedToId ? parseInt(assignedToId) : undefined,
      },
      include: { assignedTo: { select: { id: true, username: true, name: true } } }
    });
    res.json(ticket);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'Failed to create ticket' });
  }
});

// External: Anonymous Ticket Submission
router.post('/public/tickets', async (req, res) => {
  const { title, description, requesterName, priority } = req.body;
  
  try {
    const newTicket = await prisma.ticket.create({
      data: {
        title,
        description,
        requesterName: requesterName || 'Anonymous',
        priority: priority || 'MEDIUM',
        status: 'TODO'
      }
    });

    // Handle initial SLA calculation here or via worker
    res.json({ message: 'Ticket submitted successfully', ticketId: newTicket.id });
  } catch (e) {
    res.status(400).json({ error: 'Failed to submit ticket' });
  }
});

// Update ticket
router.patch('/tickets/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { status, priority, title, description, assignedToId } = req.body;

  try {
    // 1. Fetch current state to detect transitions
    const currentTicket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currentTicket) return res.status(404).json({ error: 'Ticket not found' });

    const data = {};
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if ('assignedToId' in req.body) {
      data.assignedToId = assignedToId ? parseInt(assignedToId) : null;
    }

    // 2. Perform the update
    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data,
      include: { assignedTo: { select: { id: true, username: true, name: true } } }
    });

    // 3. Generate automated comments for transitions
    const changes = [];
    if (status && status !== currentTicket.status) {
      changes.push(`status from **${currentTicket.status}** to **${status}**`);
    }
    if (priority && priority !== currentTicket.priority) {
      changes.push(`priority from **${currentTicket.priority}** to **${priority}**`);
    }

    if (changes.length > 0) {
      await prisma.comment.create({
        data: {
          content: `System: Updated ${changes.join(' and ')}`,
          ticketId: parseInt(id),
          authorId: req.user.id
        }
      });
    }

    res.json(updatedTicket);
  } catch (e) {
    res.status(400).json({ error: 'Failed to update ticket' });
  }
});

// Get comments for a ticket
router.get('/tickets/:id/comments', authenticate, async (req, res) => {
  const { id } = req.params;
  const comments = await prisma.comment.findMany({
    where: { ticketId: parseInt(id) },
    include: { author: { select: { name: true, username: true } } },
    orderBy: { createdAt: 'asc' }
  });
  res.json(comments);
});

// Add a comment to a ticket
router.post('/tickets/:id/comments', authenticate, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const authorId = req.user.id; // From authMiddleware

  try {
    const comment = await prisma.comment.create({
      data: {
        content,
        ticketId: parseInt(id),
        authorId
      },
      include: { author: { select: { name: true, username: true } } }
    });
    res.json(comment);
  } catch (e) {
    res.status(400).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
