const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment',
        required: true
    },
    name: String,
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1']
    },
    price: {
        type: Number,
        required: true
    },
    image: String
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderNumber: {
        type: String,
        unique: true
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: [0, 'Total amount cannot be negative']
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    shippingAmount: {
        type: Number,
        default: 0
    },
    grandTotal: {
        type: Number,
        required: true
    },
    shippingAddress: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, default: 'India' }
    },
    status: {
        type: String,
        enum: [
            'pending',
            'confirmed',
            'processing',
            'shipped',
            'delivered',
            'installation_scheduled',
            'installation_in_progress',
            'completed',
            'cancelled'
        ],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'online', 'bank_transfer'],
        default: 'cod'
    },
    notes: String,
    installationLocation: {
        address: { type: String },
        coordinates: {
            latitude: { type: Number },
            longitude: { type: Number }
        }
    },
    layoutImage: { type: String },
    layoutNotes: { type: String },
    statusHistory: [{
        status: String,
        date: { type: Date, default: Date.now },
        note: String
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

// Generate order number before saving
orderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.orderNumber = `PG${year}${month}${random}`;
    }
    this.updatedAt = Date.now();
    next();
});

// Add to status history when status changes
orderSchema.pre('save', function (next) {
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            date: new Date()
        });
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
