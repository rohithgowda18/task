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
        const { item } = req.body;
        if (!item || String(item).trim().length === 0) {
            return res.status(400).json({ error: 'Item text is required' });
        }
        const newItem = new todoItemsModel({ item, userId: req.user.id });
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

        const [items, total] = await Promise.all([
            todoItemsModel.find({ userId: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
            todoItemsModel.countDocuments({ userId: req.user.id })
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
        const { item } = req.body;
        if (!item || String(item).trim().length === 0) {
            return res.status(400).json({ error: 'Item text is required' });
        }
        const updateItem = await todoItemsModel.findOneAndUpdate(
            { _id: id, userId: req.user.id },
            { $set: { item } },
            { new: true }
        );
        if (!updateItem) return res.status(404).json({ error: 'Item not found' });
        return res.status(200).json(updateItem);
    } catch (error) {
        return sendServerError(res, error);
    }
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