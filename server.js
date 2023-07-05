const app = require("./app");
const { connectToRabbitMQ } = require("./config/rabbit-mq.config");
const http = require('http');
const socketIO = require('socket.io');
const server = http.createServer(app);
const io = socketIO(server);
const { loadModel } = require('./service/ninedash/load-model.service');
const tf = require('@tensorflow/tfjs-node');
const registerHandlers = require('./provider/socket-io.provider');

const { PORT } = process.env;

const onConnection = (socket) => {
    registerHandlers(io, socket);
}

(async function() {
    await tf.ready();

    const model = await loadModel();

    global.modeler = model;
    
    connectToRabbitMQ();
   
    io.on('connection', onConnection);

    server.listen(PORT, () => console.log(`App are listening at ${PORT}`));
})();


