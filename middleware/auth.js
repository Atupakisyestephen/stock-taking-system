function auth(req, res, next) {

    if (!req.session || !req.session.user) {

        return res.status(401).json({
            success: false,
            message: "Unauthorized. Please login."
        });

    }

    next();
}

module.exports = auth;