const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Equipment = require('../models/Equipment');
const { protect } = require('../middleware/auth');
const { isAdmin, authorize } = require('../middleware/roleCheck');

// @route   GET /api/orders/my-orders
// @desc    Get current user's orders
// @access  Private
router.get('/my-orders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('items.equipment', 'name image price')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Error in my-orders:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/orders
// @desc    Get orders (All for admin, own for customer)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { status, paymentStatus, page = 1, limit = 10 } = req.query;

        let query = {};

        // If not admin, only show user's own orders
        if (req.user.role !== 'admin') {
            query.user = req.user._id;
        }

        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        const orders = await Order.find(query)
            .populate('user', 'name email phone')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const count = await Order.countDocuments(query);

        res.json({
            success: true,
            data: orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalOrders: count
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email phone')
            .populate('items.equipment', 'name image');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user owns the order or is admin
        if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod, notes, installationLocation, layoutImage, layoutNotes } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items in order'
            });
        }

        // Calculate total and validate items
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const equipment = await Equipment.findById(item.equipment);

            if (!equipment) {
                return res.status(404).json({
                    success: false,
                    message: `Equipment not found: ${item.equipment}`
                });
            }

            if (!equipment.isAvailable || equipment.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `${equipment.name} is not available in requested quantity`
                });
            }

            orderItems.push({
                equipment: equipment._id,
                name: equipment.name,
                quantity: item.quantity,
                price: equipment.price,
                image: equipment.image
            });

            totalAmount += equipment.price * item.quantity;

            // Update stock
            equipment.stock -= item.quantity;
            if (equipment.stock === 0) {
                equipment.isAvailable = false;
            }
            await equipment.save();
        }

        // Calculate tax and shipping
        const taxAmount = totalAmount * 0.18; // 18% GST
        const shippingAmount = totalAmount > 50000 ? 0 : 2000; // Free shipping above 50000
        const grandTotal = totalAmount + taxAmount + shippingAmount;

        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            totalAmount,
            taxAmount,
            shippingAmount,
            grandTotal,
            shippingAddress,
            paymentMethod: paymentMethod || 'cod',
            notes,
            installationLocation,
            layoutImage,
            layoutNotes,
            status: 'pending',
            paymentStatus: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private/Admin
router.put('/:id/status', protect, isAdmin, async (req, res) => {
    try {
        const { status, note } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.status = status;
        if (note) {
            order.statusHistory.push({ status, note, date: new Date() });
        }

        await order.save();

        res.json({
            success: true,
            message: 'Order status updated',
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PUT /api/orders/:id/payment
// @desc    Update payment status (Admin only)
// @access  Private/Admin
router.put('/:id/payment', protect, isAdmin, async (req, res) => {
    try {
        const { paymentStatus } = req.body;

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { paymentStatus },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            message: 'Payment status updated',
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user owns the order or is admin
        if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this order'
            });
        }

        // Can only cancel pending or confirmed orders
        if (!['pending', 'confirmed'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel order at this stage'
            });
        }

        // Restore stock
        for (const item of order.items) {
            await Equipment.findByIdAndUpdate(item.equipment, {
                $inc: { stock: item.quantity },
                isAvailable: true
            });
        }

        order.status = 'cancelled';
        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/orders/stats/overview
// @desc    Get order statistics (Admin only)
// @access  Private/Admin
router.get('/stats/overview', protect, isAdmin, async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'pending' });
        const completedOrders = await Order.countDocuments({ status: 'completed' });
        const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

        const revenueData = await Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' } } }
        ]);

        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        res.json({
            success: true,
            data: {
                totalOrders,
                pendingOrders,
                completedOrders,
                cancelledOrders,
                totalRevenue
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;
