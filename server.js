const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();
let joinLeaveLog = loadJoinLeaveLog(); // Load the log from the file

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

  // Send the initial join-leave log to the new client
  ws.send(JSON.stringify({ type: 'joinLeaveLog', joinLeaveLog }));
});

function handleJoin(ws, username) {
  clients.set(ws, { username });
  broadcast({ type: 'join', username });

  const logEntry = { type: 'join', username, timestamp: new Date() };
  joinLeaveLog.push(logEntry);
  broadcastJoinLeaveLog();

  // Save the updated log to the file
  saveJoinLeaveLog();
}

function handleMessage(ws, content) {
  const { username } = clients.get(ws);
  broadcast({ type: 'message', username, content });
}

function handleLeave(ws) {
  const { username } = clients.get(ws);
  clients.delete(ws);
  broadcast({ type: 'leave', username });

  const logEntry = { type: 'leave', username, timestamp: new Date() };
  joinLeaveLog.push(logEntry);
  broadcastJoinLeaveLog();

  // Save the updated log to the file
  saveJoinLeaveLog();
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

function saveJoinLeaveLog() {
  fs.writeFileSync('joinLeaveLog.json', JSON.stringify(joinLeaveLog), 'utf-8');
}

function loadJoinLeaveLog() {
  try {
    const logData = fs.readFileSync('joinLeaveLog.json', 'utf-8');
    return JSON.parse(logData);
  } catch (error) {
    console.error('Error loading join-leave log:', error.message);
    return [];
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
