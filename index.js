const express = require('express');
const app = express();
const http = require('http');
require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');

const { initWebSocket } = require('./src/sockets/socket');
const { connectProducer } = require('./src/kafka/producer');
const { connectConsumer } = require('./src/kafka/consumer');

const authRoutes = require('./src/routes/auth.route');
const messageRoutes = require('./src/routes/messages.route');
const chatRoutes = require('./src/routes/chat.route');
// const verifyToken = require('./src/middlewares/auth.middleware');

const server = http.createServer(app);

initWebSocket(server);

const PORT = process.env.PORT || 5000;



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
// app.use('/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chats', chatRoutes);

// app.use(verifyToken);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});


const start = async () => {
  await connectProducer();
  await connectConsumer();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();

// module.exports = app;
