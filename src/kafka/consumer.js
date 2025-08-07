const { Kafka } = require('kafkajs');
const { io } = require('../sockets/socket');

const kafka = new Kafka({
  clientId: 'whatsapp-backend',
  brokers: [process.env.KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: 'chat-group' });

const connectConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'chat-messages', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const payload = JSON.parse(message.value.toString());
      const { receiver_id } = payload;

      // Emit to WebSocket client if connected
      io.to(`user:${receiver_id}`).emit('new_message', payload);
    },
  });
};

module.exports = {
  connectConsumer,
};
