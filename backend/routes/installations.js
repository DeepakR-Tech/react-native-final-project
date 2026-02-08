const express = require('express');
const router = express.Router();
const Installation = require('../models/Installation');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');
const { isAdmin, isInstallationTeam } = require('../middleware/roleCheck');

// @route   GET /api/installations
// @desc    Get installations (All for admin, assigned for team, own for customer)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        let query = {};

        if (req.user.role === 'installation_team') {
            query.team = req.user._id;
        } else if (req.user.role === 'customer') {
            query.customer = req.user._id;
        }

        if (status) query.status = status;

        const installations = await Installation.find(query)
            .populate('order', 'orderNumber status')
            .populate('team', 'name phone email')
            .populate('customer', 'name phone email')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ scheduledDate: -1 });

        const count = await Installation.countDocuments(query);

        res.json({
            success: true,
            data: installations,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalInstallations: count
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

// @route   GET /api/installations/:id
// @desc    Get single installation
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const installation = await Installation.findById(req.params.id)
            .populate('order')
            .populate('team', 'name phone email')
            .populate('customer', 'name phone email address')
            .populate('equipmentList.equipment', 'name image');

        if (!installation) {
            return res.status(404).json({
                success: false,
                message: 'Installation not found'
            });
        }

        // Check authorization
        if (req.user.role === 'customer' &&
            installation.customer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this installation'
            });
        }

        if (req.user.role === 'installation_team' &&
            installation.team._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this installation'
            });
        }

        res.json({
            success: true,
            data: installation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   POST /api/installations
// @desc    Create installation (Admin only)
// @access  Private/Admin
router.post('/', protect, isAdmin, async (req, res) => {
    try {
        const {
            orderId,
            teamId,
            scheduledDate,
            scheduledTime,
            location,
            notes,
            estimatedDuration
        } = req.body;

        // Get order details
        const order = await Order.findById(orderId).populate('user');
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Create equipment list from order items
        const equipmentList = order.items.map(item => ({
            equipment: item.equipment,
            name: item.name,
            quantity: item.quantity,
            installationStatus: 'pending'
        }));

        const installation = await Installation.create({
            order: orderId,
            team: teamId,
            customer: order.user._id,
            scheduledDate,
            scheduledTime,
            location: location || {
                address: order.shippingAddress
            },
            equipmentList,
            notes,
            estimatedDuration,
            status: 'scheduled'
        });

        // Update order status
        order.status = 'installation_scheduled';
        await order.save();

        res.status(201).json({
            success: true,
            message: 'Installation scheduled successfully',
            data: installation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PUT /api/installations/:id/status
// @desc    Update installation status
// @access  Private (Admin or Installation Team)
router.put('/:id/status', protect, isInstallationTeam, async (req, res) => {
    try {
        const { status, note } = req.body;

        const installation = await Installation.findById(req.params.id);

        if (!installation) {
            return res.status(404).json({
                success: false,
                message: 'Installation not found'
            });
        }

        // If installation team, check if assigned
        if (req.user.role === 'installation_team' &&
            installation.team.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this installation'
            });
        }

        installation.status = status;
        installation.statusHistory.push({
            status,
            note,
            date: new Date(),
            updatedBy: req.user._id
        });

        await installation.save();

        // Update order status if installation is in progress or completed
        if (status === 'in_progress') {
            await Order.findByIdAndUpdate(installation.order, {
                status: 'installation_in_progress'
            });
        } else if (status === 'completed') {
            await Order.findByIdAndUpdate(installation.order, {
                status: 'completed'
            });
        }

        res.json({
            success: true,
            message: 'Installation status updated',
            data: installation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PUT /api/installations/:id/equipment-status
// @desc    Update equipment installation status
// @access  Private (Installation Team)
router.put('/:id/equipment-status', protect, isInstallationTeam, async (req, res) => {
    try {
        const { equipmentId, status } = req.body;

        const installation = await Installation.findById(req.params.id);

        if (!installation) {
            return res.status(404).json({
                success: false,
                message: 'Installation not found'
            });
        }

        // Find and update equipment status
        const equipment = installation.equipmentList.find(
            e => e.equipment.toString() === equipmentId
        );

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found in installation'
            });
        }

        equipment.installationStatus = status;
        await installation.save();

        // Check if all equipment is completed
        const allCompleted = installation.equipmentList.every(
            e => e.installationStatus === 'completed'
        );

        if (allCompleted) {
            installation.status = 'completed';
            await installation.save();
            await Order.findByIdAndUpdate(installation.order, { status: 'completed' });
        }

        res.json({
            success: true,
            message: 'Equipment status updated',
            data: installation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PUT /api/installations/:id/notes
// @desc    Add team notes
// @access  Private (Installation Team)
router.put('/:id/notes', protect, isInstallationTeam, async (req, res) => {
    try {
        const { teamNotes } = req.body;

        const installation = await Installation.findByIdAndUpdate(
            req.params.id,
            { teamNotes },
            { new: true }
        );

        if (!installation) {
            return res.status(404).json({
                success: false,
                message: 'Installation not found'
            });
        }

        res.json({
            success: true,
            message: 'Notes updated',
            data: installation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PUT /api/installations/:id/feedback
// @desc    Add customer feedback
// @access  Private (Customer)
router.put('/:id/feedback', protect, async (req, res) => {
    try {
        const { rating, comment } = req.body;

        const installation = await Installation.findById(req.params.id);

        if (!installation) {
            return res.status(404).json({
                success: false,
                message: 'Installation not found'
            });
        }

        if (installation.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to add feedback'
            });
        }

        if (installation.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Can only add feedback for completed installations'
            });
        }

        installation.customerFeedback = {
            rating,
            comment,
            date: new Date()
        };

        await installation.save();

        res.json({
            success: true,
            message: 'Feedback added successfully',
            data: installation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/installations/team/schedule
// @desc    Get installation team schedule
// @access  Private (Installation Team)
router.get('/team/schedule', protect, isInstallationTeam, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let query = { team: req.user._id };

        if (startDate && endDate) {
            query.scheduledDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const installations = await Installation.find(query)
            .populate('order', 'orderNumber')
            .populate('customer', 'name phone')
            .sort({ scheduledDate: 1 });

        res.json({
            success: true,
            data: installations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/installations/stats/overview
// @desc    Get installation statistics (Admin only)
// @access  Private/Admin
router.get('/stats/overview', protect, isAdmin, async (req, res) => {
    try {
        const total = await Installation.countDocuments();
        const scheduled = await Installation.countDocuments({ status: 'scheduled' });
        const inProgress = await Installation.countDocuments({ status: 'in_progress' });
        const completed = await Installation.countDocuments({ status: 'completed' });
        const onHold = await Installation.countDocuments({ status: 'on_hold' });

        res.json({
            success: true,
            data: {
                total,
                scheduled,
                inProgress,
                completed,
                onHold
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
