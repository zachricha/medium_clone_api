require('dotenv').load();
require('./config/config');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const { authRoutes, userRoutes, postRoutes } = require('./routes');

const port = process.env.PORT;

const app = express();

app.use(bodyParser.json());

app.use(authRoutes, userRoutes, postRoutes);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

module.exports = app;
