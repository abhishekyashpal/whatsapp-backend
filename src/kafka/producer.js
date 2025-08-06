const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'whatsapp-backend',
  brokers: ['kafka:9092'], // adjust to match your docker-compose Kafka hostname
});

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
};

const publishMessage = async (message) => {
  await producer.send({
    topic: 'chat-messages',
    messages: [{ value: JSON.stringify(message) }],
  });
};

module.exports = {
  connectProducer,
  publishMessage,
};
