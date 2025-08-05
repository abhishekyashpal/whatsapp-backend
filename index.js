require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sequelize = require('./config/sequelize');
const initSocket = require('./sockets/init');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());

// Initialize DB
sequelize.sync().then(() => console.log('MySQL DB connected'));

// Initialize WebSockets
initSocket(io);

// Routes
app.get('/', (req, res) => res.send('WhatsApp backend running 🚀'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
