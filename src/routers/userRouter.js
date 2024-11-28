const express = require('express')
const User = require('../models/user')
const { auth, adminAuth } = require('../middleware/auth'); 
const jwt = require('jsonwebtoken');
const router = new express.Router()

router.post('/users/signup', async (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        motherMaidenName: req.body.motherMaidenName,  
        idNumber: req.body.idNumber,
        isAdmin: req.body.isAdmin,   
    });

    try {
        await user.save();
        res.status(201).send({ user });
    } catch (error) {
        res.status(400).send(error);    
    }
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        
        res.send({ user, token })
    } catch (e) {
        console.error('Login error:', e.message);
        res.status(400).send()
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdate = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdate.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'invalid updates'})
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/forgot-password', async (req, res) => {
    try {
        const { email, motherMaidenName, idNumber } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send({ error: 'User not found!' });
        }

        if (user.motherMaidenName !== motherMaidenName || user.idNumber !== idNumber) {
            return res.status(400).send({ error: 'Incorrect answers to security questions' });
        }

        const resetToken = jwt.sign({ _id: user._id.toString() }, 'finalprojectbam', { expiresIn: '2h' });
        console.log("Incoming reset token:", resetToken);

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 7200000; 

        await user.save();

        res.send({ message: 'Security questions answered correctly. You can now reset your password.', resetToken });

    } catch (e) {
        console.error("Error in forgot-password route:", e);
        res.status(500).send({ error: `Internal Server Error: ${e.message}` });
    }
});

router.post('/users/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        console.log("Incoming reset token:", resetToken);

        let decoded;
        try {
            decoded = jwt.verify(resetToken, 'finalprojectbam'); 
        } catch (e) {
            console.error('Error verifying token:', e.message);
            return res.status(400).send({
                error: 'Invalid reset token. The token may be malformed, tampered with, or expired.'
            });
        }

        console.log("Decoded token:", decoded);

        const user = await User.findOne({
            _id: decoded._id,  
        });

        console.log("User found:", user);
        console.log(decoded._id);
        

        if (!user) {
            console.error('Token is either invalid or expired.');
            return res.status(400).send({
                error: 'Invalid or expired reset token. It might have already been used or is no longer valid.'
            });
        }

        console.log("Token expiry date:", new Date(user.resetPasswordExpires));

        user.password = newPassword;
        user.resetPasswordToken = undefined; 
        user.resetPasswordExpires = undefined;
        await user.save();

        console.log("Password reset successful for user:", user._id);

        res.send({ message: 'Password has been reset successfully!' });
    } catch (e) {
        console.error('Error during password reset:', e.message);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});


module.exports = router