const mongoose = require('mongoose');

const bamRequestSchema = new mongoose.Schema({
    requestType: {
        type: String,
        required: true,
        enum: ['השחרה', 'כניסה רגלי / רכוב', 'קידוד חוגר', 'חתימה על שו"ס'],
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Disapproved'],
        default: 'Pending'
    },
}, {
    timestamps: true
});

bamRequestSchema.pre('save', async function(next) {
    if (this.isNew) {
        try {
            const user = await User.findById(this.user);
            if (user) {
                this.name = user.name;  
            }
        } catch (error) {
            next(error); 
        }
    }
    next();  
});

const BamRequest = mongoose.model('BamRequest', bamRequestSchema);

module.exports = BamRequest;
