const jwt = require('jsonwebtoken');

// Define public routes that shouldn't require JWT verification
// const publicRoutes = ['/auth/login', '/auth/register', '/health'];

const verifyToken = (req, res, next) => {
  // if (publicRoutes.includes(req.path)) {
  //   return next(); // Skip JWT verification for public routes
  // }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach decoded payload to request
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
  }
};

module.exports = verifyToken;
