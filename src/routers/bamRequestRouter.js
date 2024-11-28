const express = require('express');
const router = express.Router();
const BamRequest = require('../models/bamRequest');
const { auth, adminAuth } = require('../middleware/auth');
const User = require('../models/user'); 



router.post('/sendRequest', auth, async (req, res) => {
    try {
        const { requestType, description } = req.body;

        if (!requestType || !description) {
            return res.status(400).json({ error: 'Request type and description are required' });
        }

        if (!req.user) {
            return res.status(401).json({ error: 'User authentication failed' });
        }  
        
        console.log(req.user._id.toString());
        
        
        // Use `req.user._id` for the `user` field
        const bamRequest = new BamRequest({
            requestType,
            description,
            user: req.user._id,
        });

        await bamRequest.save();

        console.log('Request successfully saved:', bamRequest);

        return res.status(201).json({ message: 'Request successfully submitted', bamRequest });
    } catch (error) {
        console.error('Error processing request:', error.message);
        return res.status(500).json({ error: 'בעיה בשרת. נסה שנית מאוחר יותר.' });
    }
});


router.patch('/request/approve', adminAuth, async (req, res) => {
    try {
        const { id } = req.body;  

        if (!id) {
            return res.status(400).send({ error: 'Request ID is required' });
        }

        const bamRequest = await BamRequest.findById(id);

        if (!bamRequest) {
            return res.status(404).send({ error: 'Request not found' });
        }

        bamRequest.status = 'Approved';
        await bamRequest.save();

        res.status(200).send({ bamRequest });
    } catch (error) {
        console.error('Error approving request:', error.message);
        res.status(500).send({ error: 'Server error' });
    }
});

router.patch('/request/disapprove', adminAuth, async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).send({ error: 'Request ID is required' });
        }

        const bamRequest = await BamRequest.findById(id);

        if (!bamRequest) {
            return res.status(404).send('Request not found');
        }

        bamRequest.status = 'Disapproved';
        await bamRequest.save();

        res.status(200).send({ bamRequest });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/get/requests/:status', auth, async (req, res) => {
    try {
        const { status } = req.params;
        const userId = req.query.userId;
        
        const filters = {};
        if (status) {
            filters.status = new RegExp(`^${status}$`, 'i'); // Case-insensitive match
        }
        if (userId) {
            filters.user = userId; // Only filter by user if userId is provided
        }

        console.log('Filters applied:', filters);

        const bamRequests = await BamRequest.find(filters)
            .populate('user', 'name') 
            .sort({ createdAt: -1 });

        if (bamRequests.length === 0) {
            console.log('No requests found for filters:', filters);
        } else {
            console.log('Database Results:', bamRequests);
        }

        return res.status(200).json({ bamRequests });
    } catch (error) {
        console.error('Error fetching requests:', error.message);
        return res.status(500).json({ error: 'Internal server error. Please try again later.' });
    }
});

router.get('/get/requests', adminAuth, async (req, res) => {
    try {
        const { status, startDate, endDate, limit, username, requestType } = req.query;
        const filters = {};

        if (status) {
            filters.status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        }

        if (requestType) {
            filters.requestType = requestType;
        }

        if (startDate || endDate) {
            filters.createdAt = {};
            if (startDate) {
                const start = new Date(startDate);
                if (!isNaN(start)) {
                    filters.createdAt.$gte = new Date(start.setUTCHours(0, 0, 0, 0));
                }
            }
            if (endDate) {
                const end = new Date(endDate);
                if (!isNaN(end)) {
                    filters.createdAt.$lt = new Date(end.setUTCHours(23, 59, 59, 999)); 
                }
            }
        }

        if (username) {
            const trimmedUsername = username.trim();
            filters['user.name'] = { 
                $regex: trimmedUsername, 
                $options: 'i' 
            };
        }

        const maxLimit = 100;
        const requestLimit = limit ? Math.min(parseInt(limit, 10), maxLimit) : 10;

        const bamRequests = await BamRequest.find(filters)
            .populate('user', 'name') // Populate the user's name
            .sort({ createdAt: -1 }) // Default sort by createdAt (descending)
            .limit(requestLimit);

        res.status(200).send({ bamRequests });
    } catch (error) {
        console.error('Error fetching requests:', error.message);
        res.status(500).send({ error: 'Internal server error. Please try again later.' });
    }
});


module.exports = router;
