const userStatus = require('./userStatus');

const isString = (text) => typeof text === 'string' || text instanceof String;

const validateTask = (task) => {
  if (!isString(task) || !task.length) {
    throw new Error('Task is missing or invalid.');
  }
};

const validateDate = (date) => {
  if (!date || !Date(date)) {
    throw new Error('Date is missing or invalid.');
  }
};

const validateHours = (hours) => {
  const nHours = Number(hours);
  if (!Number.isInteger(nHours) || nHours < 1 || nHours > 24) {
    throw new Error('Hours is missing or invalid.');
  }
};

const validateUsername = (username) => {
  if (!isString(username) || username.length < 3) {
    throw new Error('Username is missing or too short.');
  }
};

const validatePassword = (password) => {
  if (!isString(password) || password.length < 3) {
    throw new Error('Password is missing or too short.');
  }
};

const validateName = (name) => {
  if (!isString(name)) {
    throw new Error('Name is invalid.');
  }
};

const validateStatus = (status) => {
  const nStatus = Number(status);
  if (!Object.values(userStatus).includes(nStatus)) {
    throw new Error('Status is invalid.');
  }
};

const validateUser = (user, isUpdate = true) => {
  const {
    username, name, password, hours, status,
  } = user;
  validateUsername(username);
  if (!isUpdate || password.length > 0) {
    validatePassword(password);
  }
  validateHours(hours);
  if (status) {
    validateStatus(status);
  }
  if (name) {
    validateName(name);
  }
};

const validateNote = (note) => {
  const {
    task, hours, date,
  } = note;
  validateDate(date);
  validateTask(task);
  validateHours(hours);
};

module.exports = {
  validateUser,
  validateNote,
};
