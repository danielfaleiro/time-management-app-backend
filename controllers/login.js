const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const loginRouter = require('express').Router();
const User = require('../models/user');

loginRouter.post('/', async (request, response) => {
  const { body } = request;

  const user = await User.findOne({ username: body.username });

  const validPassword = user === null
    ? false
    : await bcrypt.compare(body.password, user.password);

  if (!user || !validPassword) {
    return response.status(401).json({
      error: 'invalid username or password',
    });
  }

  const userForToken = {
    username: user.username,
    id: user._id,
  };

  const token = jwt.sign(userForToken, process.env.SECRET);

  return response
    .status(200)
    .send({
      token,
      username: user.username,
      name: user.name,
      status: user.status,
    });
});

module.exports = loginRouter;
