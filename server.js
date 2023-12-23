const WebSocket = require('ws');
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const players = new Set();

wss.on('connection', (ws) => {
  // Add new player to the set
  players.add(ws);

  // Notify all players about the new connection
  broadcast({ type: 'playerJoined', playerId: ws.playerId });

  ws.on('message', (message) => {
    // Handle messages from players
    const data = JSON.parse(message);
    handleClientMessage(ws, data);
  });

  ws.on('close', () => {
    // Remove player on disconnect
    players.delete(ws);
    // Notify all players about the disconnection
    broadcast({ type: 'playerLeft', playerId: ws.playerId });
  });
});

function handleClientMessage(ws, data) {
  // Handle game logic based on client messages
  // For example: update player positions, scores, etc.
  broadcast({ type: 'gameUpdate', data });
}

function broadcast(message) {
  // Send a message to all connected players
  players.forEach((player) => {
    player.send(JSON.stringify(message));
  });
}

server.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
