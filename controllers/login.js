const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const loginRouter = require('express').Router();
const User = require('../models/user');
const config = require('../utils/config');

loginRouter.post('/', async (request, response) => {
  const { body } = request;

  const user = await User.findOne({ username: body.username });

  const validPassword = user === null
    ? false
    : await bcrypt.compare(body.password, user.password);

  if (!user || !validPassword) {
    return response.status(401).send({ error: 'Invalid username or password' });
  }

  const userForToken = {
    username: user.username,
    id: user._id,
  };

  const token = jwt.sign(userForToken, config.SECRET);

  return response
    .status(200)
    .send({
      token,
      username: user.username,
      name: user.name,
      hours: user.hours,
      status: user.status,
      id: user.id,
    });
});

module.exports = loginRouter;
