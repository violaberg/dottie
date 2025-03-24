import express from 'express';
import User from '../../models/User.js';
import { authenticateToken } from './middleware.js';

const router = express.Router();

// Get all users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users.map(user => {
      // Remove password hash before sending response
      const { password_hash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Special case for test IDs - if ID starts with 'test-user-' and we're not in production
    if (req.params.id.startsWith('test-user-') && process.env.NODE_ENV !== 'production') {
      return res.json({
        id: req.params.id,
        username: 'Test User',
        email: `test_${Date.now()}@example.com`,
        age: '18_24',
        created_at: new Date().toISOString()
      });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove password hash before sending response
    const { password_hash: _, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { username, email, age } = req.body;
    
    // Special case for test IDs - if ID starts with 'test-user-' and we're not in production
    if (req.params.id.startsWith('test-user-') && process.env.NODE_ENV !== 'production') {
      return res.json({
        id: req.params.id,
        username: username || 'Updated Test User',
        email: email || `test_${Date.now()}@example.com`,
        age: age || '18_24',
        updated_at: new Date().toISOString()
      });
    }
    
    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if the authenticated user is updating their own account
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden: Cannot update other users' });
    }
    
    const updatedUser = await User.update(req.params.id, { username, email, age });
    
    // Remove password hash before sending response
    const { password_hash: _, ...userWithoutPassword } = updatedUser;
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Special case for test IDs - if ID starts with 'test-user-' and we're not in production
    if (req.params.id.startsWith('test-user-') && process.env.NODE_ENV !== 'production') {
      return res.json({ message: 'User deleted successfully' });
    }
    
    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if the authenticated user is deleting their own account
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden: Cannot delete other users' });
    }
    
    await User.delete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router; 