const { getRabbitMQConnection } = require('../config/rabbit-mq.config');

const getMessageFromQueue = async (queueName) => {
    const rabbitMQConnection = getRabbitMQConnection();
    const channel = await rabbitMQConnection.createChannel();
    await channel.assertQueue(queueName);

    const messages = [];

    while(true){
        const message = await channel.get(queueName);
        if(!message){
            break;
        }

        messages.push(JSON.parse(message.content.toString()));
        channel.ack(message);
    }

    return messages;
}

module.exports = { getMessageFromQueue };