const usersRouter = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const userStatus = require('../utils/userStatus');
const config = require('../utils/config');

const saltRounds = 10;

usersRouter.get('/', async (request, response) => {
  const users = await User
    .find({})
    .populate('notes', { date: 1, hours: 1, task: 1 });
  response.status(200).json(users.map((user) => user.toJSON()));
});

usersRouter.get('/:id', async (request, response) => {
  const users = await User
    .findById(request.params.id)
    .populate('Notes', { task: 1, date: 1, hours: 1 });

  response.status(200).json(users.map((user) => user.toJSON()));
});

usersRouter.put('/', async (request, response) => {
  const {
    username, name, hours, password,
  } = request.body;

  if (!request.token) {
    return response.status(401).json({ error: 'token missing' });
  }

  let decodedToken = null;
  try {
    decodedToken = jwt.verify(request.token, config.SECRET);
  } catch {
    return response.status(401).json({ error: 'token invalid' });
  }

  const oldUser = await User
    .findById(decodedToken.id);

  if (!oldUser) {
    return response.status(400).json({ error: 'bad id request' });
  }

  let newPassword = null;
  if (password) {
    if (password >= 3) {
      newPassword = await bcrypt.hash(password, saltRounds);
    } else {
      return response.status(400).json({ error: 'password too short' });
    }
  }

  if (oldUser.id.toString() === decodedToken.id.toString()) {
    const newUser = {
      username: username || oldUser.username,
      name: name || oldUser.name,
      hours: hours || oldUser.hours,
      password: newPassword || oldUser.password,
    };

    const userForToken = {
      username: newUser.username,
      id: oldUser._id,
    };

    const token = jwt.sign(userForToken, config.SECRET);

    const updatedUser = await User.findByIdAndUpdate(decodedToken.id, newUser, { new: true });
    return response.status(200).send({
      token,
      username: updatedUser.username,
      name: updatedUser.name,
      hours: updatedUser.hours,
      status: updatedUser.hours,
    });
  }

  return response.status(401).json({ error: 'access unauthorized' });
});

usersRouter.post('/', async (request, response) => {
  const { body } = request;

  if (!body.username || !body.password) {
    return response.status(400).json({
      error: 'content missing',
    });
  }

  if (body.password.length < 3) {
    return response.status(400).json({
      error: 'password too short',
    });
  }

  if (body.username.length < 3) {
    return response.status(400).json({
      error: 'username too short',
    });
  }

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
