const User = require('../models/User');

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'admin' || !user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error while checking admin privileges' 
    });
  }
};

module.exports = isAdmin;
