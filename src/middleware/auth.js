import jwt from 'jsonwebtoken';

export function signTokens(payload) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d' });
  return { accessToken, refreshToken };
}

export function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return required ? res.status(401).json({ success: false, message: 'Unauthorized' }) : next();
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
  };
}
