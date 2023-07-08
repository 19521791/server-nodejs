const amqp = require("amqplib");

const testConnection = async () => {
    try {
        const connection = await amqp.connect("amqp://localhost:5672"); // Replace with your RabbitMQ connection URL
        console.log("Connection to RabbitMQ established successfully!");
        await connection.close();
    } catch (error) {
        console.error("Error connecting to RabbitMQ:", error);
    }
};

testConnection();
