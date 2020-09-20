const usersRouter = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const userStatus = require('../utils/userStatus');
const config = require('../utils/config');
const decodeToken = require('../utils/decodeToken');

const saltRounds = 10;

usersRouter.get('/', async (request, response) => {
  const { token } = request;

  if (!token) {
    return response.status(401).json({ error: 'token missing' });
  }

  const decodedToken = decodeToken(token, response);
  const loggedUser = await User.findById(decodedToken.id);

  if (loggedUser.status === userStatus.USER) {
    return response.status(401).json({ error: 'access unauthorized' });
  }

  const users = await User.find({});
  return response.status(200).json(users.map((user) => user.toJSON()));
});

usersRouter.delete('/:id', async (request, response) => {
  const { token } = request;

  if (!token) {
    return response.status(401).json({ error: 'token missing' });
  }

  const decodedToken = decodeToken(token, response);
  const loggedUser = await User.findById(decodedToken.id);

  if (loggedUser.status === userStatus.USER) {
    return response.status(401).json({ error: 'access unauthorized' });
  }

  try {
    await User.findByIdAndDelete(request.params.id);
    return response.status(204).end();
  } catch {
    return response.status(400).json({ error: 'bad id request' });
  }
});

usersRouter.put('/:id', async (request, response) => {
  const {
    username, name, hours, password, status,
  } = request.body;
  const { token } = request;

  if (!token) {
    return response.status(401).json({ error: 'token missing' });
  }

  const decodedToken = decodeToken(token, response);

  const loggedUser = await User
    .findById(decodedToken.id);
  const oldUser = await User
    .findById(request.params.id);

  if (!loggedUser || !oldUser) {
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

  const newUser = {
    username: username || oldUser.username,
    name: name || oldUser.name,
    hours: hours || oldUser.hours,
    password: newPassword || oldUser.password,
    status: status || oldUser.status,
  };

  const updatedUser = await User.findByIdAndUpdate(oldUser.id, newUser, { new: true });

  let responseObject = {
    username: updatedUser.username,
    name: updatedUser.name,
    hours: updatedUser.hours,
    status: updatedUser.status,
    id: updatedUser.id,
  };

  if (loggedUser.id === oldUser.id) {
    const userForToken = {
      username: newUser.username,
      id: oldUser._id,
    };

    const newToken = jwt.sign(userForToken, config.SECRET);
    responseObject = { ...responseObject, token: newToken };
  } else if (loggedUser.status === userStatus.USER) {
    return response.status(401).json({ error: 'access unauthorized' });
  }

  return response.status(200).send(responseObject);
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

usersRouter.post('/manager', async (request, response) => {
  const { token } = request;

  if (!token) {
    return response.status(401).json({ error: 'token missing' });
  }

  const decodedToken = decodeToken(token, response);

  const loggedUser = await User
    .findById(decodedToken.id);

  if (!loggedUser) {
    return response.status(400).json({ error: 'bad id request' });
  }

  if (loggedUser.status === userStatus.USER) {
    return response.status(401).json({ error: 'access unauthorized' });
  }

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
    status: body.status,
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
