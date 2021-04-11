const notesRouter = require('express').Router();
const Note = require('../models/note');
const User = require('../models/user');
const decodeToken = require('../utils/decodeToken');
const userStatus = require('../utils/userStatus');
const { validateNote } = require('../utils/validation');

notesRouter.get('/', async (request, response) => {
  const { token } = request;

  if (!token) {
    return response.status(401).json({ error: 'token missing' });
  }

  const decodedToken = decodeToken(token, response);
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
  const { token } = request;

  if (!token) {
    return response.status(401).json({ error: 'Token missing' });
  }

  const decodedToken = decodeToken(token, response);

  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'Token invalid' });
  }

  const { body } = request;
  try {
    validateNote(body);
  } catch (e) {
    return response.status(400).json({ error: e.message });
  }

  const loggedUser = await User.findById(decodedToken.id);
  let ownerUser = null;

  if (!loggedUser) {
    return response.status(400).json({ error: 'Bad id request' });
  }

  if (loggedUser.status === userStatus.ADMIN) {
    ownerUser = await User.findOne({ username: body.user });
    if (!ownerUser) {
      return response.status(400).json({ error: 'Username is missing or invalid.' });
    }
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
  const { token, params } = request;

  if (!token) {
    return response.status(401).json({ error: 'Token missing' });
  }

  const decodedToken = decodeToken(token, response);

  const userId = decodedToken.id;
  const user = await User
    .findById(userId);

  if ((params.id.toString() === userId.toString()) || user.status === userStatus.ADMIN) {
    try {
      await Note.findOneAndRemove({ _id: params.id });
      return response.status(204).end();
    } catch {
      return response.status(400).json({ error: 'Bad note id request.' });
    }
  }

  return response.status(401).json({ error: 'Access unauthorized' });
});

notesRouter.put('/', async (request, response) => {
  const {
    date, hours, task, id, user,
  } = request.body;
  const { token } = request;

  if (!token) {
    return response.status(401).json({ error: 'Token missing' });
  }

  try {
    validateNote({ task, hours, date });
  } catch (e) {
    return response.status(400).json({ error: e.message });
  }

  const decodedToken = decodeToken(token, response);

  const oldNote = await Note
    .findById(id);

  if (!oldNote) {
    return response.status(400).json({ error: 'Bad note id request' });
  }

  const userId = decodedToken.id;
  const loggedUser = await User
    .findById(userId);
  const ownerUser = await User
    .findOne({ username: user });

  if (!ownerUser || !loggedUser) {
    return response.status(400).json({ error: 'Bad user id request' });
  }

  const isAdmin = loggedUser.status === userStatus.ADMIN;

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

  return response.status(401).json({ error: 'Access unauthorized' });
});

module.exports = notesRouter;
