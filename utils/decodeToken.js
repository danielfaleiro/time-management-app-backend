const jwt = require('jsonwebtoken');
const config = require('./config');

const decodeToken = (token, response) => {
  try {
    const decodedToken = jwt.verify(token, config.SECRET);
    return decodedToken;
  } catch {
    return response.status(401).json({ error: 'token invalid' });
  }
};

module.exports = decodeToken;
