const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { body, validationResult } = require('express-validator');

// @route   GET /api/equipment
// @desc    Get all equipment
// @access  Public
router.get('/', async (req, res) => {
    try {
        const {
            category,
            minPrice,
            maxPrice,
            search,
            isAvailable,
            sortBy = 'createdAt',
            order = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        let query = {};

        // Filter by category
        if (category) query.category = category;

        // Filter by availability
        if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

        // Filter by price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        // Search by name or description
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = order === 'asc' ? 1 : -1;

        const equipment = await Equipment.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort(sortOptions);

        const count = await Equipment.countDocuments(query);

        res.json({
            success: true,
            data: equipment,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalItems: count
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

// @route   GET /api/equipment/categories
// @desc    Get all equipment categories
// @access  Public
router.get('/categories', async (req, res) => {
    try {
        const categories = [
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
        ];

        // Get count for each category
        const categoryCounts = await Equipment.aggregate([
            { $match: { isAvailable: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        const categoryData = categories.map(cat => {
            const found = categoryCounts.find(c => c._id === cat);
            return {
                name: cat,
                count: found ? found.count : 0
            };
        });

        res.json({
            success: true,
            data: categoryData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/equipment/:id
// @desc    Get single equipment
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const equipment = await Equipment.findById(req.params.id);

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        res.json({
            success: true,
            data: equipment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   POST /api/equipment
// @desc    Create new equipment (Admin only)
// @access  Private/Admin
router.post('/', protect, isAdmin, [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('price').isNumeric().withMessage('Price must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const equipment = await Equipment.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Equipment created successfully',
            data: equipment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PUT /api/equipment/:id
// @desc    Update equipment (Admin only)
// @access  Private/Admin
router.put('/:id', protect, isAdmin, async (req, res) => {
    try {
        const equipment = await Equipment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        res.json({
            success: true,
            message: 'Equipment updated successfully',
            data: equipment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   DELETE /api/equipment/:id
// @desc    Delete equipment (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, isAdmin, async (req, res) => {
    try {
        const equipment = await Equipment.findById(req.params.id);

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        await equipment.deleteOne();

        res.json({
            success: true,
            message: 'Equipment deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PUT /api/equipment/:id/stock
// @desc    Update equipment stock (Admin only)
// @access  Private/Admin
router.put('/:id/stock', protect, isAdmin, async (req, res) => {
    try {
        const { stock } = req.body;

        if (stock === undefined || stock < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid stock value is required'
            });
        }

        const equipment = await Equipment.findByIdAndUpdate(
            req.params.id,
            { stock, isAvailable: stock > 0 },
            { new: true }
        );

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        res.json({
            success: true,
            message: 'Stock updated successfully',
            data: equipment
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
