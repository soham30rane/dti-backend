import { Server } from "socket.io";
import { joinRoom, leaveRoom } from "./rooms.js";
import jwt from "jsonwebtoken";
import Quiz from "../models/quizSchema.js"
import {recieveAnswer } from "../quiz/logic.js"
import dotenv from 'dotenv'
dotenv.config()

let io;
const allowedOrigins = process.env.CLIENT_URLS
export const initSockets = (httpServer) =>{
    io = new Server(httpServer, {
        cors: {
            origin: function (origin, callback) {
                // Check if the origin is in the allowed origins list
                if (allowedOrigins.indexOf(origin) !== -1) {
                    callback(null, true); // Allow the request
                } else {
                    callback(new Error('Not allowed by CORS')); // Block the request
                }
            },
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