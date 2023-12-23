const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();
const joinLeaveLog = [];

app.use(express.static('public'));

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'join':
        handleJoin(ws, data.username);
        break;
      case 'message':
        handleMessage(ws, data.content);
        break;
    }
  });

  ws.on('close', () => {
    handleLeave(ws);
  });
});

function handleJoin(ws, username) {
  clients.set(ws, { username });
  broadcast({ type: 'join', username });

  joinLeaveLog.push({ type: 'join', username, timestamp: new Date() });
  broadcastJoinLeaveLog();
}

function handleMessage(ws, content) {
  const { username } = clients.get(ws);
  broadcast({ type: 'message', username, content });
}

function handleLeave(ws) {
  const { username } = clients.get(ws);
  clients.delete(ws);
  broadcast({ type: 'leave', username });

  joinLeaveLog.push({ type: 'leave', username, timestamp: new Date() });
  broadcastJoinLeaveLog();
}

function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

function broadcastJoinLeaveLog() {
  broadcast({ type: 'joinLeaveLog', joinLeaveLog });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
