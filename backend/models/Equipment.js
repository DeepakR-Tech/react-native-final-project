const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add equipment name'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    category: {
        type: String,
        required: [true, 'Please add a category'],
        enum: [
            'Swings',
            'Slides',
            'Climbing Equipment',
            'Seesaws',
            'Merry-Go-Rounds',
            'Spring Riders',
            'Playhouses',
            'Sand Play',
            'Water Play',
            'Sports Equipment',
            'Fitness Equipment',
            'Inclusive Play',
            'Other'
        ]
    },
    price: {
        type: Number,
        required: [true, 'Please add a price'],
        min: [0, 'Price cannot be negative']
    },
    image: {
        type: String,
        default: 'no-image.jpg'
    },
    images: [{
        type: String
    }],
    specifications: {
        dimensions: {
            length: Number,
            width: Number,
            height: Number,
            unit: { type: String, default: 'meters' }
        },
        material: String,
        ageGroup: {
            min: { type: Number, default: 3 },
            max: { type: Number, default: 12 }
        },
        capacity: Number,
        weight: Number,
        color: [String],
        safetyFeatures: [String]
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Stock cannot be negative']
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    installationRequired: {
        type: Boolean,
        default: true
    },
    installationTime: {
        type: Number,
        default: 1,
        description: 'Installation time in days'
    },
    warranty: {
        duration: { type: Number, default: 12 },
        unit: { type: String, default: 'months' }
    },
    rating: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0 }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
equipmentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Index for search
equipmentSchema.index({ name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Equipment', equipmentSchema);
