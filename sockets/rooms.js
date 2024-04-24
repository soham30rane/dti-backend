import Quiz from "../models/quizSchema.js";
import User from "../models/userSchema.js";
import jwt from "jsonwebtoken";
import { getIO } from "./sockets.js";
import { addParticipant,makeLeaderBoard } from "../quiz/logic.js"

export const joinRoom = async (socket,roomCode,token) => {
    try {
        let res = addParticipant(roomCode,token)
        if(res){
            console.log("New user joined room : " , roomCode)
            socket.join(roomCode)
            socket.emit("room-joined",roomCode)
        } else {
            console.log("Cannot join room : ",roomCode,token)
        }
    } catch (err) {
        console.log(err.message);
        console.trace();
        socket.emit('error', { message : "Server error"})
    }
}

export const conductQuiz = async (roomCode) => {
    try {
        // find quiz
        let quiz = await Quiz.findOne({ code : roomCode })
        if (!quiz) { console.log('Room does not exist');return }
        // check if its started
        if(!quiz.started) { console.log('Quiz has not started yet');return }
        // init
        let io = getIO();
        let questions = quiz.questions;
        let time = 10;
        let q_index = 0;

        let interval = setInterval( async () => {
            // Emit question
            if (q_index === questions.length) {
                clearInterval(interval);
                io.to(roomCode).emit('quiz-ended');
                return;
            }
            io.to(roomCode).emit('question',questions[q_index],q_index);
            q_index++;
            await new Promise(resolve => setTimeout(resolve, 10000));

            // Emit results
            io.to(roomCode).emit("question-ended",q_index)
            console.log("Sending results")
            quiz = await Quiz.findOne({ code : roomCode })
            io.to(roomCode).emit('results',makeLeaderBoard(quiz));
        }, time * 1000);
    } catch (err) {
        console.log(err.message);
    }
}