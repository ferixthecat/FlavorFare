function ensureAuthenticatedAndRole(roleRequired) {
    return function(req, res, next) {
        if (!req.session.user) {
            return res.status(401).render("general/error", { title: "401", message: "You are not authorized to view this page." });
        }

        if (roleRequired && req.session.user.role !== roleRequired) {
            return res.status(401).render("general/error", { title: "401", message: "You are not authorized to view this page." });
        }

        next();
    };
}

module.exports = { ensureAuthenticatedAndRole };
