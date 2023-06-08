const app = require("./app");
const connectDB = require("./config/db.config");
const socketIO = require('socket.io');
const http = require('http');

const { PORT } = process.env;

const server = http.createServer(app)
const io = socketIO(server);

io.on('connection', (socket) => {
    console.log('A client connected');

    socket.on('message', (data) => {
        console.log('Received message: ', data);
    });

    socket.on('disconnect', () => {
        console.log('A client disconnected');
    });
});
// connectDB();
server.listen(PORT, () => console.log(`App are listening at ${PORT}`));
   
