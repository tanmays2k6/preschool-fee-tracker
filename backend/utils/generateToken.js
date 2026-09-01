import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
  const secret = process.env.JWT_SECRET || 'fnl_preschool_jwt_fallback_secret_key_2026';
  const token = jwt.sign({ userId }, secret, {
    expiresIn: '30d',
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Compatible across modern browsers on HTTPS
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

export default generateToken;
