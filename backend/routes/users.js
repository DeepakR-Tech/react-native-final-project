const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { authorize, isAdmin } = require('../middleware/roleCheck');

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', protect, isAdmin, async (req, res) => {
    try {
        const { role, isActive, search, page = 1, limit = 10 } = req.query;

        let query = {};

        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const count = await User.countDocuments(query);

        res.json({
            success: true,
            data: users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalUsers: count
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

// @route   GET /api/users/installation-teams
// @desc    Get all installation team members (Admin only)
// @access  Private/Admin
router.get('/installation-teams', protect, isAdmin, async (req, res) => {
    try {
        const teams = await User.find({ role: 'installation_team', isActive: true })
            .select('name email phone');

        res.json({
            success: true,
            data: teams
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/users/:id
// @desc    Get single user (Admin only)
// @access  Private/Admin
router.get('/:id', protect, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private/Admin
router.put('/:id', protect, isAdmin, async (req, res) => {
    try {
        const { name, email, role, phone, address, isActive } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, role, phone, address, isActive },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Instead of deleting, deactivate the user
        user.isActive = false;
        await user.save();

        res.json({
            success: true,
            message: 'User deactivated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/users/stats/overview
// @desc    Get user statistics (Admin only)
// @access  Private/Admin
router.get('/stats/overview', protect, isAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const customers = await User.countDocuments({ role: 'customer' });
        const installationTeams = await User.countDocuments({ role: 'installation_team' });
        const admins = await User.countDocuments({ role: 'admin' });
        const activeUsers = await User.countDocuments({ isActive: true });

        res.json({
            success: true,
            data: {
                totalUsers,
                customers,
                installationTeams,
                admins,
                activeUsers,
                inactiveUsers: totalUsers - activeUsers
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
