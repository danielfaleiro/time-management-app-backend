const notesRouter = require('express').Router();
const jwt = require('jsonwebtoken');
const Note = require('../models/note');
const User = require('../models/user');
const config = require('../utils/config');

notesRouter.get('/', async (request, response) => {
  if (!request.token) {
    return response.status(401).json({ error: 'token missing' });
  }

  let decodedToken = null;
  try {
    decodedToken = jwt.verify(request.token, config.SECRET);
  } catch {
    return response.status(401).json({ error: 'token invalid' });
  }

  const user = await User
    .findById(decodedToken.id)
    .populate('notes', { task: 1, date: 1, hours: 1 });

  return response.status(200).json(user.notes.map((note) => note.toJSON()));
});

notesRouter.post('/', async (request, response) => {
  if (!request.token) {
    return response.status(401).json({ error: 'token missing' });
  }

  const body = new Note(request.body);
  let decodedToken = null;

  try {
    decodedToken = jwt.verify(request.token, config.SECRET);
  } catch {
    return response.status(401).json({ error: 'token invalid' });
  }

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' });
  }

  if (!body.task || !body.date || !body.hours) {
    return response.status(400).json({
      error: 'content missing',
    });
  }

  const user = await User.findById(decodedToken.id);
  const newNote = new Note({
    task: body.task,
    date: body.date,
    hours: body.hours,
    user: user._id,
  });
  const savedNote = await newNote.save();

  user.notes = user.notes.concat(savedNote._id);
  await user.save();

  return response.json(savedNote.toJSON());
});

notesRouter.delete('/:id', async (request, response) => {
  if (!request.token) {
    return response.status(401).json({ error: 'token missing' });
  }

  let decodedToken = null;
  try {
    decodedToken = jwt.verify(request.token, config.SECRET);
  } catch {
    return response.status(401).json({ error: 'token invalid' });
  }

  const note = await Note
    .findById(request.params.id);

  if (!note) {
    return response.status(400).json({ error: 'bad id request' });
  }

  if (note.user.toString() === decodedToken.id.toString()) {
    await Note.deleteOne(note);
    return response.status(204).end();
  }

  return response.status(401).json({ error: 'access unauthorized' });
});

notesRouter.put('/', async (request, response) => {
  const {
    date, hours, task, id,
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

  const oldNote = await Note
    .findById(id);

  if (!oldNote) {
    return response.status(400).json({ error: 'bad id request' });
  }

  if (oldNote.user.toString() === decodedToken.id.toString()) {
    const newNote = {
      date: date || oldNote.date,
      hours: hours || oldNote.hours,
      task: task || oldNote.task,
    };

    const updatedNote = await Note.findByIdAndUpdate(id, newNote, { new: true });
    return response.json(updatedNote);
  }

  return response.status(401).json({ error: 'access unauthorized' });
});

module.exports = notesRouter;
