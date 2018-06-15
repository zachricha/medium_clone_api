require('dotenv').load();
require('./config/config');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const { homeRoutes, userRoutes, postRoutes } = require('./routes');

const port = process.env.PORT;

const app = express();

app.use(bodyParser.json());

app.use(homeRoutes, userRoutes, postRoutes);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

module.exports = app;
