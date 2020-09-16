/* eslint-disable no-param-reassign */
const mongoose = require('mongoose');

const noteSchema = mongoose.Schema({
  task: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  hours: {
    type: Number,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

noteSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model('Note', noteSchema);
