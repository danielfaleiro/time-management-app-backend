/* eslint-disable no-param-reassign */
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const userStatus = require('../utils/userStatus');

/* userSchema status:
    0 - regular user
    1 - user manager
    2 - admin
*/

const userSchema = mongoose.Schema({
  username: {
    type: String,
    minlength: 3,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    minlength: 3,
    required: true,
  },
  name: String,
  status: {
    type: Number,
    min: userStatus.USER,
    max: userStatus.ADMIN,
    required: true,
  },
  hours: {
    type: Number,
    min: 1,
    max: 24,
    required: true,
  },
  notes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
    },
  ],
});

userSchema.plugin(uniqueValidator);

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.password;
  },
});

module.exports = mongoose.model('User', userSchema);
