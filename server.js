const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();

app.use(express.static('public'));

wss.on('connection', (ws) => {
  // Handle initial connection

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    // Handle different types of messages
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

  // Send a welcome message to the new user
  ws.send(JSON.stringify({ type: 'welcome', message: `Welcome, ${username}!` }));
}

function handleMessage(ws, content) {
  const { username } = clients.get(ws);
  broadcast({ type: 'message', username, content });
}

function handleLeave(ws) {
  const { username } = clients.get(ws);
  clients.delete(ws);
  broadcast({ type: 'leave', username });
}

function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
