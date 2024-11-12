const jwt = require('jsonwebtoken');


const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }

        req.user = decoded;  // Attach decoded token (including StoreIDs) to req.user
        // console.log('decoded',decoded)
        next();
    });
};

// Middleware to check if user is Admin
const isAdmin = (req, res, next) => {
    if (req.user.RoleID !== 1) {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
};

// Middleware to check if user is either Admin or a regular user
const isUser = (req, res, next) => {
    if (req.user.RoleID !== 1 && req.user.RoleID !== 3) {
        return res.status(403).json({ message: 'Access denied. Users only.' });
    }
    next();
};

module.exports = { verifyToken, isAdmin, isUser };
