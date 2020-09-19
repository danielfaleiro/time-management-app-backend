const notesRouter = require('express').Router();
const jwt = require('jsonwebtoken');
const Note = require('../models/note');
const User = require('../models/user');
const config = require('../utils/config');
const userStatus = require('../utils/userStatus');

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

  if (!user) {
    return response.status(400).json({ error: 'bad id request' });
  }

  if (user.status === userStatus.ADMIN) {
    const notes = await Note
      .find({})
      .populate('user', { username: 1 });
    return response.status(200).json(notes.map((note) => note.toJSON()));
  }

  return response.status(200).json(user.notes.map((note) => note.toJSON()));
});

notesRouter.post('/', async (request, response) => {
  if (!request.token) {
    return response.status(401).json({ error: 'token missing' });
  }

  let decodedToken = null;
  try {
    decodedToken = jwt.verify(request.token, config.SECRET);
  } catch {
    return response.status(401).json({ error: 'token invalid' });
  }

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' });
  }

  const loggedUser = await User.findById(decodedToken.id);

  const { body } = request;
  if (!body.task || !body.date || !body.hours) {
    return response.status(400).json({
      error: 'content missing',
    });
  }

  let ownerUser = null;
  if (loggedUser.status === userStatus.ADMIN && body.user) {
    ownerUser = await User.findOne({ username: body.user });
  }

  const newNote = new Note({
    task: body.task,
    date: body.date,
    hours: body.hours,
    user: ownerUser ? ownerUser.id : loggedUser.id,
  });

  const savedNote = await newNote
    .save();

  if (ownerUser) {
    ownerUser.notes = ownerUser.notes.concat(savedNote._id);
    await ownerUser.save();
  } else {
    loggedUser.notes = loggedUser.notes.concat(savedNote._id);
    await loggedUser.save();
  }

  const resNote = await Note
    .findById(savedNote.id)
    .populate('user', { username: 1 });

  return response.status(201).json(resNote.toJSON());
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

  const userId = decodedToken.id;
  const user = await User
    .findById(userId);

  if ((note.user.toString() === userId.toString()) || user.status === userStatus.ADMIN) {
    await Note.deleteOne(note);
    return response.status(204).end();
  }

  return response.status(401).json({ error: 'access unauthorized' });
});

notesRouter.put('/', async (request, response) => {
  const {
    date, hours, task, id, user,
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
    return response.status(400).json({ error: 'bad note id request' });
  }

  const userId = decodedToken.id;
  const loggedUser = await User
    .findById(userId);
  const isAdmin = loggedUser.status === userStatus.ADMIN;
  const ownerUser = await User
    .findOne({ username: user });

  if (!ownerUser) {
    return response.status(400).json({ error: 'bad user id request' });
  }

  if ((oldNote.user.toString() === userId.toString()) || isAdmin) {
    let newNote = {
      date: date || oldNote.date,
      hours: hours || oldNote.hours,
      task: task || oldNote.task,
    };

    if (isAdmin) {
      newNote = { ...newNote, user: ownerUser.id };
    }

    const updatedNote = await Note
      .findByIdAndUpdate(id, newNote, { new: true })
      .populate('user', { username: 1 });

    return response.json(updatedNote);
  }

  return response.status(401).json({ error: 'access unauthorized' });
});

module.exports = notesRouter;
