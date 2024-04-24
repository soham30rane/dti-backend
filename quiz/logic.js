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
    let participant = quiz.participants.find(ptp => ptp.participantID == verified._id)
    if(!participant){ console.log("Participant not found , params : ",roomCode,token);console.trace();return }
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

export const addParticipant = async (roomCode,token) => {
    // verify the token
    let verified = jwt.verify(token,process.env.SECRET)
    if(!verified){ console.log("Invalid token : ",token);console.trace();return false}
    // find the quiz
    let quiz = await Quiz.findOne({code : roomCode})
    if(!quiz) { console.log("Quiz not found : " ,roomCode),console.trace();return false}
    // find user
    let user = await User.findById(verified._id)
    if(!user) { console.log("User not found :",verified._id);console.trace();return false}
    // Check if already exists and add
    let existing = quiz.participants.find(ptp => ptp.participantID == user._id)
    if(existing){
        console.log("User already exists")
        return true;
    } else {
        quiz.participants.push({
            participantID : user._id,
            participantName : user.username,
            answers : [],
            score : 0,
        })
        quiz.markModified("participants")
        await quiz.save()
        return true;
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