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
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/todo-list-app';

    try {
        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log(`Database Connected (${mongoUri})`);
    } catch (err) {
        console.error('Database connection error:', err.message || err);
        process.exit(1);
    }

    app.use('/', todoItemsRoute);

    app.listen(port, () => console.log(`Example app listening on port ${port}!`));
}

start();
