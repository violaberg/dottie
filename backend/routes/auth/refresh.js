import express from 'express';
import jwt from 'jsonwebtoken';
import { refreshTokens } from './middleware.js';

const router = express.Router();

// Refresh token endpoint
router.post('/', async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }
  
  // Check if refresh token exists in our store
  if (!refreshTokens.has(refreshToken)) {
    return res.status(403).json({ error: 'Invalid refresh token' });
  }
  
  jwt.verify(refreshToken, process.env.REFRESH_SECRET || 'your-refresh-secret-key', (err, user) => {
    if (err) {
      // Remove invalid token
      refreshTokens.delete(refreshToken);
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    
    // Generate new access token with a unique jti (JWT ID) to ensure it's different
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        jti: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Add unique JWT ID
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({ token });
  });
});

export default router; 