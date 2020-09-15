const notesRouter = require('express').Router();
const jwt = require('jsonwebtoken');
const Note = require('../models/note');
const User = require('../models/user');

notesRouter.get('/', async (request, response) => {
  const notes = await Note
    .find({})
    .populate('user', { username: 1, name: 1 });

  response.status(200).json(notes.map((note) => note.toJSON()));
});

notesRouter.post('/', async (request, response) => {
  if (!request.token) {
    return response.status(401).json({ error: 'token missing' });
  }

  const body = new Note(request.body);
  let decodedToken = null;

  try {
    decodedToken = jwt.verify(request.token, process.env.SECRET);
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

// WIP:
/*
notesRouter.delete('/:id', async (request, response) => {
  if (!request.token) {
    return response.status(401).json({ error: 'token missing' });
  }

  let decodedToken = null;
  try {
    decodedToken = jwt.verify(request.token, process.env.SECRET);
  } catch {
    return response.status(401).json({ error: 'token invalid' });
  }

  const note = await Note.findById(request.params.id);

  if (!note) {
    return response.status(400).json({ error: 'bad id request' });
  }

  if (note && (note.user.toString() === decodedToken.id.toString())) {
    await Note.deleteOne(note);
    return response.status(204).end();
  }

  return response.status(401).json({ error: 'access unauthorized' });
});

notesRouter.put('/:id', async (request, response) => {
  const { body } = request;

  const note = {
    likes: body.likes,
  };

  const updatedNote = await Note.findByIdAndUpdate(request.params.id, note, { new: true });
  response.json(updatedNote);
});
*/

module.exports = notesRouter;
