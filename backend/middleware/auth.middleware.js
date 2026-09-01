import jwt from 'jsonwebtoken';
import userService from '../services/userService.js';

const protect = async (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || 'fnl_preschool_jwt_fallback_secret_key_2026';
      const decoded = jwt.verify(token, secret);
      const user = await userService.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth protect error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

export { protect, admin };
