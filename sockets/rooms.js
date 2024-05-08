import Quiz from "../models/quizSchema.js";
import User from "../models/userSchema.js";
import jwt from "jsonwebtoken";
import { getIO } from "./sockets.js";
import { addParticipant,makeLeaderBoard } from "../quiz/logic.js"

export const joinRoom = async (socket,roomCode,token) => {
    try {
        let {res,isRunning,title} = await addParticipant(socket,roomCode,token)
        if(res){
            console.log("New user joined room : " , roomCode)
            socket.join(roomCode)
            socket.emit("room-joined",roomCode,title)
            if(isRunning){
                socket.emit('get-ready')
            } else {
                socket.emit("not-started")
            }
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
        
        console.log('emitting get ready')
        io.to(roomCode).emit('get-ready')
        setTimeout(()=>{
            console.log('emitting question : ',questions[q_index])
            io.to(roomCode).emit('question',questions[q_index],q_index);
            q_index++;
            setTimeout(async ()=>{
                // Emit results
                io.to(roomCode).emit("question-ended",q_index)
                console.log("Sending results")
                quiz = await Quiz.findOne({ code : roomCode })
                io.to(roomCode).emit('results',makeLeaderBoard(quiz));
            },10000)
        },10000)

        await new Promise(resolve => setTimeout(resolve, 5000));

        let interval = setInterval( async () => {
            // Emit question
            if (q_index === questions.length) {
                clearInterval(interval);
                io.to(roomCode).emit('quiz-ended',makeLeaderBoard(quiz),quiz.title);
                quiz.completed = true
                await quiz.save()
                return;
            }

            console.log('emitting get ready')
            io.to(roomCode).emit('get-ready')
            await new Promise(resolve => setTimeout(resolve, 5000));

            console.log('emitting question : ',questions[q_index])
            io.to(roomCode).emit('question',questions[q_index],q_index);
            q_index++;
            await new Promise(resolve => setTimeout(resolve, 10000));

            // Emit results
            io.to(roomCode).emit("question-ended",q_index)
            console.log("Sending results")
            quiz = await Quiz.findOne({ code : roomCode })
            io.to(roomCode).emit('results',makeLeaderBoard(quiz));
        }, 25000);
    } catch (err) {
        console.log(err.message);
    }
}