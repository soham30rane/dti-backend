import mongoose, { Mongoose } from "mongoose";
import Quiz from "../models/quizSchema.js";
import User from "../models/userSchema.js";
import jwt from "jsonwebtoken"

export const recieveAnswer = async (roomCode,q_index,a_index,token,delta) => {
    // verify the jwt
    let verified = jwt.verify(token,process.env.SECRET)
    if(!verified){ console.log("User auth failed : ",token); console.trace();return }
    // find the quiz
    let quiz = await Quiz.findOne({code : roomCode})
    if(!quiz) { console.log("Quiz not found , code: ",roomCode); console.trace();return }
    // check if user is the participant
    let participant =  quiz.participants.find(ptp => ptp.participantID == verified._id)
    if(!participant){ console.log("Participant not found , params : ",roomCode,token);console.trace();return }
    // Check if the user has already answered the questions
    let old_ans = participant.answers.find(item => item.q_index == q_index)
    if(old_ans){ console.log("Question is already answered : ",roomCode,token,q_index);console.trace();return }
    // update the participant object
    participant.answers.push({q_index,a_index})
    if(quiz.questions[q_index].correctIndex == a_index){
        let score = Math.floor(quiz.questions[q_index].points + quiz.questions[q_index].points*delta)
        console.log(delta)
        participant.score += score
    }

    let attempts = 10;
    let done = false
    while(attempts > 0 && !done){
        try{
            try {
                // save to database
                // console.log(quiz)
                quiz.markModified("participants")
                await quiz.save();
                done = true
            } catch (err){
                if( err instanceof mongoose.Error.VersionError ){
                    quiz = await Quiz.find({code : roomCode})
                    participant =  quiz.participants.find(ptp => ptp.participantID == verified._id)
                    participant.answers.push({q_index,a_index})
                    if(quiz.questions[q_index].correctIndex == a_index){
                        score = Math.floor(quiz.questions[q_index].points + quiz.questions[q_index].points*delta)
                        console.log(delta)
                        participant.score += score
                    }
                    quiz.markModified("participants")
                    await quiz.save();
                    done = true
                } else {
                    console.log(err)
                    break;
                }
            }
        } catch (err){
            attempts--
        }
    }
}

export const addParticipant = async (socket,roomCode,token) => {
    // verify the token
    if(!token){ socket.emit('login-required');console.log("Token not found : ",token);console.trace();return {res : false} }
    let verified = jwt.verify(token,process.env.SECRET)
    if(!verified){ socket.emit('login-required');console.log("Invalid token : ",token);console.trace();return {res : false}}
    // find the quiz
    let quiz = await Quiz.findOne({code : roomCode})
    if(!quiz) { socket.emit('quiz-not-found');console.log("Quiz not found : " ,roomCode),console.trace();return {res : false}}
    // Check if the quiz is completed
    if(quiz.completed){ socket.emit('quiz-ended',makeLeaderBoard(quiz),quiz.title); return { res : false };}
    // find user
    let user = await User.findById(verified._id)
    if(!user) { socket.emit('login-required');console.log("User not found :",verified._id);console.trace();return {res : false}}
    // Check if already exists and add
    let existing = quiz.participants.find(ptp => ptp.participantID == user._id)
    if(existing){
        console.log("User already exists")
        return { res : true,isRunning : quiz.started,title:quiz.title,userid : user._id };
    } else {
        quiz.participants.push({
            participantID : user._id,
            participantName : user.username,
            answers : [],
            score : 0,
        })
        quiz.markModified("participants")
        await quiz.save()
        let resultObj = { res : true,isRunning : quiz.started,title:quiz.title,userid : user._id } 
        // Add the quiz code to user object
        if(user.quizzes.includes(quiz.code)){ return resultObj; }
        if(user.otherQuizzes.includes(quiz.code)){ return resultObj; }
        user.otherQuizzes.unshift(quiz.code)
        user.markModified('otherQuizzes')
        await user.save();
        return resultObj;
    }
}

export const makeLeaderBoard = (quiz) => {
    let leaderboard = [];
    for(let item of quiz.participants){
        leaderboard.push({
            u_id : item.participantID,
            u_name : item.participantName,
            score : item.score
        })
    }
    leaderboard.sort((a,b) => b.score - a.score )
    console.log(leaderboard)
    return leaderboard;
}