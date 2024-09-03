const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost/movie_app', { useNewUrlParser: true, useUnifiedTopology: true });

// User Model
const User = mongoose.model('User', {
  username: String,
  password: String,
  preferences: [String],
  swipedMovies: [{ movieId: String, liked: Boolean }]
});

// Movie Model
const Movie = mongoose.model('Movie', {
  title: String,
  genre: [String],
  actors: [String],
  director: String,
  // Add more attributes as needed
});

// Authentication Middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, 'your_jwt_secret');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Register User
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({ username, password: hashedPassword });
  await user.save();

  res.json({ message: 'User registered successfully' });
});

// Login User
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ _id: user._id }, 'your_jwt_secret');
  res.json({ token });
});

// Get Movie Recommendations
app.get('/recommendations', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user._id);
  const swipedMovieIds = user.swipedMovies.map(swipe => swipe.movieId);

  // Simple content-based filtering
  const recommendations = await Movie.find({
    _id: { $nin: swipedMovieIds },
    genre: { $in: user.preferences }
  }).limit(10);

  res.json(recommendations);
});

// Record Swipe
app.post('/swipe', authMiddleware, async (req, res) => {
  const { movieId, liked } = req.body;
  const user = await User.findById(req.user._id);

  user.swipedMovies.push({ movieId, liked });
  await user.save();

  res.json({ message: 'Swipe recorded' });
});

// Update User Preferences
app.put('/preferences', authMiddleware, async (req, res) => {
  const { preferences } = req.body;
  await User.findByIdAndUpdate(req.user._id, { preferences });

  res.json({ message: 'Preferences updated' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));