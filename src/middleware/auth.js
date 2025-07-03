// src/middleware/auth.js
function authMiddleware(req, res, next) {
  const publicPaths = [
    '/login.html',
    '/api/login',
    '/css/',
    '/js/',
    '/img/',
    '/favicon.ico'
  ];

  const isPublic = publicPaths.some(path => req.path.startsWith(path));
  const isAuthenticated = req.session && req.session.referee;

  if (isPublic || isAuthenticated) {
    next();
  } else {
    res.redirect('/login.html');
  }
}

module.exports = authMiddleware;
