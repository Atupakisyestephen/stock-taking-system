function adminOnly(req, res, next) {

    if (!req.session || !req.session.user) {

        return res.status(401).json({
            success: false,
            message: "Unauthorized. Please login."
        });

    }

    if (req.session.user.role !== "admin") {

        return res.status(403).json({
            success: false,
            message: "Access denied. Administrator privileges required."
        });

    }

    next();

}

module.exports = adminOnly;