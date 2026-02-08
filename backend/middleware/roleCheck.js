// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }
};

// Check if user is installation team
exports.isInstallationTeam = (req, res, next) => {
    if (req.user && (req.user.role === 'installation_team' || req.user.role === 'admin')) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Installation team only.'
        });
    }
};

// Check if user owns the resource or is admin
exports.isOwnerOrAdmin = (resourceUserIdField = 'user') => {
    return (req, res, next) => {
        const resourceUserId = req.resource ? req.resource[resourceUserIdField] : null;

        if (req.user.role === 'admin') {
            return next();
        }

        if (resourceUserId && resourceUserId.toString() === req.user._id.toString()) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Not authorized to access this resource'
        });
    };
};
