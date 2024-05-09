import Quiz from "../models/quizSchema.js";
import User from "../models/userSchema.js";
import jwt from "jsonwebtoken"

export const recieveAnswer = async (roomCode,q_index,a_index,token) => {
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
        participant.score += quiz.questions[q_index].points
    }
    // save to database
    console.log(quiz)
    quiz.markModified("participants")
    await quiz.save();
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
        return { res : true,isRunning : quiz.started,title:quiz.title };
    } else {
        quiz.participants.push({
            participantID : user._id,
            participantName : user.username,
            answers : [],
            score : 0,
        })
        quiz.markModified("participants")
        await quiz.save()
        return { res : true,isRunning : quiz.started,title:quiz.title };
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