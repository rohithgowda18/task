const express = require('express')
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors')
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');


const app = express()
app.use(express.json());


const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 100),
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);


const todoItemsRoute = require('./routes/todoItems')

async function start() {
    let mongoUri = process.env.MONGO_URI;
    const allowInMemory = process.env.ALLOW_INMEMORY_MONGO === 'true';

    // If no MONGO_URI provided, optionally fall back to in-memory only when explicitly allowed
    if (!mongoUri) {
        if (!allowInMemory) {
            console.error('MONGO_URI is missing. Set MONGO_URI to a persistent MongoDB connection string to keep data across restarts.');
            process.exit(1);
        }
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            mongoUri = mongod.getUri();
            console.log('Started in-memory MongoDB (data is ephemeral).');
        } catch (err) {
            console.error('Failed to start in-memory MongoDB:', err);
            process.exit(1);
        }
    }

    const connectWithUri = async (uri, label) => {
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log(`Database Connected (${label})`);
    };

    try {
        await connectWithUri(mongoUri, 'primary');
    } catch (err) {
        console.error('Database connection error:', err.message || err);

        // If persistent DB is unreachable and in-memory is explicitly allowed, fall back
        if (allowInMemory) {
            try {
                const { MongoMemoryServer } = require('mongodb-memory-server');
                const mongod = await MongoMemoryServer.create();
                const memoryUri = mongod.getUri();
                await connectWithUri(memoryUri, 'in-memory fallback (ephemeral)');
            } catch (memErr) {
                console.error('Failed to start in-memory MongoDB after primary connection failure:', memErr);
                process.exit(1);
            }
        } else {
            // Hard fail when no fallback is permitted
            process.exit(1);
        }
    }

    app.use('/', todoItemsRoute);

    app.listen(port, () => console.log(`Example app listening on port ${port}!`));
}

start();
