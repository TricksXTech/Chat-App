const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Serve static files
app.use(express.static(path.join(__dirname)));

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle chat messages
    socket.on('chat message', (msg) => {
        socket.broadcast.emit('chat message', msg);
    });

    // Handle call signaling
    socket.on('call offer', (data) => {
        socket.broadcast.emit('call offer', data);
    });

    socket.on('call answer', (data) => {
        socket.broadcast.emit('call answer', data);
    });

    socket.on('ice candidate', (data) => {
        socket.broadcast.emit('ice candidate', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start server
const PORT = 8000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
