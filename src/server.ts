import express from 'express';
import socketIO from 'socket.io';
import path from 'path';
import { createServer } from 'http';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = socketIO(httpServer);

const PORT = 3333;
let activeSockets: string[] = [];

app.use(cors());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, '../public')));

app.use(express.json());

io.on('connection', socket => {
  const existingSocket = activeSockets.filter(
    eachSocket => eachSocket === socket.id,
  );

  if (!existingSocket.length) {
    activeSockets.push(socket.id);

    socket.emit('update-user-list', {
      users: activeSockets.filter(eachSocket => eachSocket !== socket.id),
    });

    socket.broadcast.emit('update-user-list', {
      users: [socket.id],
    });
  }
  console.log('Socket connected.');

  socket.on('call-user', data => {
    console.log('Call user:', data.to);
    socket.to(data.to).emit('call-made', {
      offer: data.offer,
      socket: socket.id,
    });
  });

  socket.on('make-answer', data => {
    socket.to(data.to).emit('answer-made', {
      socket: socket.id,
      answer: data.answer,
    });
  });

  socket.on('reject-call', data => {
    socket.to(data.from).emit('call-rejected', {
      socket: socket.id,
    });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    activeSockets = activeSockets.filter(
      eachSocket => eachSocket !== socket.id,
    );

    socket.broadcast.emit('remove-user', {
      socketId: socket.id,
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server listening to port ${PORT}`);
});
