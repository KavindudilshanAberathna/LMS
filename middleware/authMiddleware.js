// Check if the user is authenticated
exports.isAuthenticated = (req, res, next) => {
    if (req.session.user) {
      res.locals.user = req.session.user; 
      return next();
    }
    res.redirect('/login'); // Redirect to login if not authenticated
  };
  
  // Check if the user has the required role
  exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
      if (!req.session.user || !roles.includes(req.session.user.role)) {
        return res.status(403).send('Access Denied'); // Access Denied for unauthorized users
      }
      next(); // User is authorized, proceed to the route
    };
  };
  