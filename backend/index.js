const express = require('express')
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const cors = require('cors')
const bodyParser = require('body-parser');


const app = express()
app.use(express.json());


const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const todoItemsRoute = require('./routes/todoItems')



mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Database Connected'))
    .catch(err => console.log(err));



app.use('/', todoItemsRoute);


// app.get('/', (req, res) => res.send('Hello World!'))
app.listen(port, () => console.log(`Example app listening on port ${port}!`));