import { Server } from "socket.io";
import { joinRoom } from "./rooms.js";
import jwt from "jsonwebtoken";
import Quiz from "../models/quizSchema.js"
import {recieveAnswer } from "../quiz/logic.js"

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


        socket.on('answer', async (roomCode,questionIndex,answer,token) => {
            console.log('Answer received');
            recieveAnswer(roomCode,questionIndex,answer,token)  
        })
    });

}

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
}