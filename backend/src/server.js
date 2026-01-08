require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { login } = require('./controllers/authController');
const { getAssets, createAsset } = require('./controllers/assetController');
const authenticate = require('./middleware/auth'); // PATH FIXED

const app = express();
app.use(cors());
app.use(express.json());

// Public
app.post('/api/auth/login', login);

// Protected
app.get('/api/assets', authenticate, getAssets);
app.post('/api/assets', authenticate, createAsset);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));