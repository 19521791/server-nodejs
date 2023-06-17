const WebSocket = require('ws');

const clients = new Set();

const broadcastProgress = (data) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

const sendProgressUpdate = (progress) => {
  broadcastProgress({ type: "progress", data: progress });
};

const startWebSocketServer = () => {
  const wss = new WebSocket.Server({ port: 8080 });

  wss.on("connection", (ws) => {
    clients.add(ws);

    ws.on("close", () => {
      clients.delete(ws);
    });
  });
};

module.exports = {
  sendProgressUpdate,
  startWebSocketServer,
};
