const amqp = require('amqplib');

let rabbitMQConnection = null;

const connectToRabbitMQ = async () => {
    try {
        rabbitMQConnection = await amqp.connect({
            hostname: 'rabbitmq',
            port: 5672,
            heartbeat: 60,
        });
        console.log("Connected to RabbitMQ");
    } catch (err) {
        console.log("Error connecting to RabbitMQ:", err);
    }
}


const getRabbitMQConnection = () => {
    return rabbitMQConnection;
}

module.exports = { connectToRabbitMQ, getRabbitMQConnection };