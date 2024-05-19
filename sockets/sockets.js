import { Server } from "socket.io";
import { joinRoom, leaveRoom } from "./rooms.js";
import jwt from "jsonwebtoken";
import Quiz from "../models/quizSchema.js"
import {recieveAnswer } from "../quiz/logic.js"
import dotenv from 'dotenv'
dotenv.config()

let io;

export const initSockets = (httpServer) =>{
    io = new Server(httpServer, {
        cors: {
          origin: process.env.CLIENT_URL,
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

        socket.on('leave-the-room',(roomCode,token) => {
            console.log('leave room recieved : ',roomCode,' , ',token)
            leaveRoom(socket,roomCode,token)
        })


        socket.on('answer', async (roomCode,questionIndex,answer,token,delta) => {
            console.log('Answer received');
            recieveAnswer(roomCode,questionIndex,answer,token,delta)  
        })
    });

}

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
}