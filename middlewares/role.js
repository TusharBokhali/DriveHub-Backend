exports.requireRole = (role) => (req,res,next) => {
  if(!req.user) return res.status(401).json({ 
    success: false, 
    data: null, 
    message: 'Not authenticated' 
  });
  if(req.user.role !== role) return res.status(403).json({ 
    success: false, 
    data: null, 
    message: `Forbidden: ${role} role required` 
  });
  next();
};
