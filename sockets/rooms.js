import Quiz from "../models/quizSchema.js";
import jwt from "jsonwebtoken";
import { getIO } from "./sockets.js";

export const joinRoom = async (socket,roomCode,token) => {
    try {
        let verified = jwt.verify(token, process.env.SECRET)
        if (!verified) {
            return socket.emit('error', { message : "Token verification failed, authorization denied"})
        }
        const quiz = await Quiz.findOne({ code : roomCode })
        if (!quiz) {
            return socket.emit('error', { message : "Room does not exist"})
        }
        quiz.participants.push(verified._id)
        socket.join(roomCode);
        socket.emit('room-joined',roomCode);
    } catch (err) {
        console.log(err.message);
        socket.emit('error', { message : "Server error"})
    }
}

export const conductQuiz = async (roomCode) => {
    try {
        const quiz = await Quiz.findOne({ code : roomCode })
        if (!quiz) {
            console.log('Room does not exist')
            return
            // return socket.emit('error', { message : "Room does not exist"})
        }
        if(!quiz.started) {
            console.log('Quiz has not started yet')
            return
            // return socket.emit('error', { message : "Quiz has not started yet"})
        }
        let io = getIO();
        let questions = quiz.questions;
        let time = 10;
        let currentQuestion = 0;
        let interval = setInterval(() => {
            if (currentQuestion === questions.length) {
                clearInterval(interval);
                io.to(roomCode).emit('quiz-ended');
                return;
            }
            io.to(roomCode).emit('question',questions[currentQuestion]);
            currentQuestion++;
        }, time * 1000);
    } catch (err) {
        console.log(err.message);
        // socket.emit('error', { message : "Server error"})
    }
}