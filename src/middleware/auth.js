const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '').trim();

        // Ensure token exists
        if (!token) {
            return res.status(400).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, 'finalprojectbam');  // Use environment variable for secret

        // Find user by the decoded _id and optionally verify the token in the user's document
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!user) {
            throw new Error('User not found or token not associated with user');
        }

        req.token = token;
        req.user = user;

        next(); // Proceed to next middleware or route handler
    } catch (e) {
        console.error('Authentication error:', e.message);
        res.status(401).send({ error: 'Please authenticate' });
    }
};

const adminAuth = async (req, res, next) => {
    try {
        await auth(req, res, () => {
            if (!req.user.isAdmin) {
                return res.status(403).send({ error: 'Access denied' });
            }
            next();
        });
    } catch (error) {
        console.error('Admin authentication error:', error.message);
        res.status(403).send({ error: 'Access denied' });
    }
};

module.exports = { auth, adminAuth };
