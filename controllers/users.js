const usersRouter = require('express').Router();
const bcrypt = require('bcrypt');
const User = require('../models/user');
const userStatus = require('../utils/userStatus');

usersRouter.get('/', async (request, response) => {
  const users = await User
    .find({})
    .populate('notes', { date: 1, hours: 1, task: 1 });
  response.status(200).json(users.map((user) => user.toJSON()));
});

usersRouter.get('/:id', async (request, response) => {
  const users = await User
    .findById(request.params.id)
    .populate('notes', { task: 1, date: 1, hours: 1 });

  response.status(200).json(users.map((user) => user.toJSON()));
});

usersRouter.post('/', async (request, response) => {
  const { body } = request;

  if (!body.username || !body.password) {
    return response.status(400).json({
      error: 'content missing',
    });
  }

  if (body.password.length <= 3) {
    return response.status(400).json({
      error: 'password too short',
    });
  }

  if (body.username.length <= 3) {
    return response.status(400).json({
      error: 'username too short',
    });
  }

  const saltRounds = 10;
  const password = await bcrypt.hash(body.password, saltRounds);

  const newUser = new User({
    username: body.username,
    name: body.name,
    hours: body.hours,
    status: userStatus.USER,
    password,
  });

  try {
    const result = await newUser.save();
    return response.status(201).json(result);
  } catch (err) {
    return response.status(400).json({ name: err.name, message: err.message });
  }
});

module.exports = usersRouter;
