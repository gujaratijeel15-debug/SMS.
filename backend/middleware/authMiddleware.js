const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

exports.verifyToken = (req, res, next) => {
  try {
    let token;

    // 1. Check the Authorization Header (This is what your Frontend sends)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // The header looks like "Bearer eyJhbGci...", so we split it to get just the token
      token = req.headers.authorization.split(' ')[1];
    } 
    // 2. Fallback: Check Cookies (If you still use cookies for something else)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // console.log('Checking Token:', token ? 'Found' : 'Not Found'); // Debug log

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();

  } catch (err) {
    console.error('JWT ERROR:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

exports.requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};
