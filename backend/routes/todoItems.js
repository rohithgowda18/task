const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const todoItemsModel = require('../models/todoItems');
const User = require('../models/user');
const { authRequired, JWT_SECRET } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

function sendServerError(res, err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
}

// Tighter rate limit for auth endpoints (default: 10 req/15m)
const authLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_AUTH_MAX || 10),
    standardHeaders: true,
    legacyHeaders: false,
});

// Register new user
router.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
        if (String(username).trim().length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
        if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

        const existing = await User.findOne({ username: username.trim() });
        if (existing) return res.status(409).json({ error: 'Username already taken' });

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ username: username.trim(), password: hashed });
        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '12h' });
        return res.status(201).json({ token, user: { id: user._id, username: user.username } });
    } catch (error) {
        return sendServerError(res, error);
    }
});

// Login
router.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

        const user = await User.findOne({ username: username.trim() });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '12h' });
        return res.status(200).json({ token, user: { id: user._id, username: user.username } });
    } catch (error) {
        return sendServerError(res, error);
    }
});

// Protect routes
router.use(authRequired);

router.post('/api/item', async (req, res) => {
    try {
        const { item, category, label, priority, deadline, completed, notes } = req.body;
        if (!item || String(item).trim().length === 0) {
            return res.status(400).json({ error: 'Item text is required' });
        }
        const newItem = new todoItemsModel({
            item,
            userId: req.user.id,
            category: category || '',
            label: label || '',
            priority: priority || 'medium',
            deadline: deadline ? new Date(deadline) : null,
            completed: completed === true,
            notes: notes || ''
        });
        const saveItem = await newItem.save();
        return res.status(201).json(saveItem);
    } catch (error) {
        return sendServerError(res, error);
    }
});

router.get('/api/items', async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limitRaw = parseInt(req.query.limit, 10) || 10;
        const limit = Math.min(Math.max(limitRaw, 1), 100);
        const skip = (page - 1) * limit;

        // Filtering by category, label, priority, deadline, completed
        const filter = { userId: req.user.id };
        if (req.query.category) filter.category = { $regex: req.query.category, $options: 'i' };
        if (req.query.label) filter.label = { $regex: req.query.label, $options: 'i' };
        if (req.query.priority) filter.priority = req.query.priority;
        if (req.query.completed !== undefined) filter.completed = req.query.completed === 'true';
        if (req.query.deadlineBefore) filter.deadline = { $lte: new Date(req.query.deadlineBefore) };
        if (req.query.deadlineAfter) filter.deadline = { ...(filter.deadline || {}), $gte: new Date(req.query.deadlineAfter) };

        const [items, total] = await Promise.all([
            todoItemsModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            todoItemsModel.countDocuments(filter)
        ]);

        const totalPages = Math.max(Math.ceil(total / limit), 1);

        return res.status(200).json({
            items,
            meta: { page, limit, total, totalPages }
        });
    } catch (error) {
        return sendServerError(res, error);
    }
});

router.put('/api/item/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { item, category, label, priority, deadline, completed, notes } = req.body;
        if (!item || String(item).trim().length === 0) {
            return res.status(400).json({ error: 'Item text is required' });
        }
        const updateFields = { item };
        if (category !== undefined) updateFields.category = category;
        if (label !== undefined) updateFields.label = label;
        if (priority !== undefined) updateFields.priority = priority;
        if (deadline !== undefined) updateFields.deadline = deadline ? new Date(deadline) : null;
        if (completed !== undefined) updateFields.completed = completed;
        if (notes !== undefined) updateFields.notes = notes;
        const updateItem = await todoItemsModel.findOneAndUpdate(
            { _id: id, userId: req.user.id },
            { $set: updateFields },
            { new: true }
        );
        if (!updateItem) return res.status(404).json({ error: 'Item not found' });
        return res.status(200).json(updateItem);
    } catch (error) {
        return sendServerError(res, error);
    }
// Mark task as completed/uncompleted
router.patch('/api/item/:id/completed', async (req, res) => {
    try {
        const { id } = req.params;
        const { completed } = req.body;
        if (typeof completed !== 'boolean') {
            return res.status(400).json({ error: 'Completed must be a boolean' });
        }
        const updateItem = await todoItemsModel.findOneAndUpdate(
            { _id: id, userId: req.user.id },
            { $set: { completed } },
            { new: true }
        );
        if (!updateItem) return res.status(404).json({ error: 'Item not found' });
        return res.status(200).json(updateItem);
    } catch (error) {
        return sendServerError(res, error);
    }
});
});

router.delete('/api/item/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteItem = await todoItemsModel.findOneAndDelete({ _id: id, userId: req.user.id });
        if (!deleteItem) return res.status(404).json({ error: 'Item not found' });
        return res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        return sendServerError(res, error);
    }
});

module.exports = router;