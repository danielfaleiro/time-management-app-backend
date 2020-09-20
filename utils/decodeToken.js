const jwt = require('jsonwebtoken');
const config = require('./config');

const decodeToken = (token, response) => {
  let decodedToken = null;
  try {
    decodedToken = jwt.verify(token, config.SECRET);
  } catch {
    response.status(401).json({ error: 'token invalid' });
  }

  return decodedToken;
};

module.exports = decodeToken;
