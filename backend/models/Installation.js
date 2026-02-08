const mongoose = require('mongoose');

const installationSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    scheduledDate: {
        type: Date,
        required: [true, 'Please add a scheduled date']
    },
    scheduledTime: {
        start: String,
        end: String
    },
    status: {
        type: String,
        enum: [
            'scheduled',
            'in_progress',
            'on_hold',
            'completed',
            'cancelled'
        ],
        default: 'scheduled'
    },
    location: {
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: { type: String, default: 'India' }
        },
        coordinates: {
            latitude: Number,
            longitude: Number
        },
        landmark: String,
        accessInstructions: String
    },
    equipmentList: [{
        equipment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Equipment'
        },
        name: String,
        quantity: Number,
        installationStatus: {
            type: String,
            enum: ['pending', 'in_progress', 'completed'],
            default: 'pending'
        }
    }],
    notes: String,
    teamNotes: String,
    customerFeedback: {
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        date: Date
    },
    photos: {
        before: [String],
        during: [String],
        after: [String]
    },
    startTime: Date,
    completedDate: Date,
    estimatedDuration: {
        type: Number,
        description: 'Duration in hours'
    },
    actualDuration: {
        type: Number,
        description: 'Actual time taken in hours'
    },
    statusHistory: [{
        status: String,
        date: { type: Date, default: Date.now },
        note: String,
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp
installationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            date: new Date()
        });
        if (this.status === 'completed') {
            this.completedDate = new Date();
        }
        if (this.status === 'in_progress' && !this.startTime) {
            this.startTime = new Date();
        }
    }
    next();
});

module.exports = mongoose.model('Installation', installationSchema);
