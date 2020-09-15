const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./utils/config');
const loginRouter = require('./controllers/login');
const usersRouter = require('./controllers/users');
const notesRouter = require('./controllers/notes');

const app = express();
const middleware = require('./utils/middleware');
const logger = require('./utils/logger');

app.use(cors());
app.use(express.json());
app.use(middleware.requestLogger);
app.use(middleware.tokenExtractor);

app.use('/api/login', loginRouter);
app.use('/api/users', usersRouter);
app.use('/api/notes', notesRouter);

app.use(middleware.unkownEndpoint);
app.use(middleware.errorHandler);

logger.info('Connecting to MongoDB...');

mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    logger.info('Connected to mongoDB');
  })
  .catch((error) => {
    logger.error('MongoDB connection error: ', error.message);
  });

module.exports = app;
