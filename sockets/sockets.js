import { Server } from "socket.io";
import { joinRoom } from "./rooms.js";

let io;

export const initSockets = (httpServer) =>{
    io = new Server(httpServer, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      });
    io.on('connection', (socket) => {
        console.log('New connection');        
        socket.on('disconnect', () => {
            console.log('User disconnected');
        });

        socket.on('join-room',(roomCode,token) => {
            joinRoom(socket,roomCode,token);
        })
    });
}

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
}