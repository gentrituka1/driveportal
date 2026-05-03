"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = requireRole;
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden." });
        }
        return next();
    };
}
