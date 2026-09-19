const authorize = (...roles) => {
  return (req, res, next) => {
    const isSuperAdmin = req.userRole === 'super_admin';
    const isAllowed = isSuperAdmin
      ? roles.includes('super_admin')
      : roles.includes(req.userRole);

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    next();
  };
};

export default authorize;