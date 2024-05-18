import Quiz from '../models/quizSchema.js';
import { conductQuiz } from '../sockets/rooms.js';
import User from '../models/userSchema.js';
import { makeLeaderBoard } from '../quiz/logic.js';

const generateRandomCode = () =>{
    // Generate a random code in this format : "***-***-***" where * is a random alphabet in lowercase
    let code = "";
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            code += String.fromCharCode(Math.floor(Math.random() * 26) + 97);
        }
        if (i !== 2) {
            code += "-";
        }
    }
    return code;
}

export const editQuiz = async (req,res) => {
    try {
        let { title, questions,quizCode} = req.body;
        if (!title || !questions || !quizCode) {
            return res.json({ error: true, message: "Please enter all fields" });
        }
        let quiz = await Quiz.findOne({ code : quizCode })
        if(!quiz) {
            return res.json({error : true , message : "Original quiz not found"})
        }
        if(quiz.started){
            return res.json({ error : true , message : "Cant edit"})
        }
        console.log(`${req.user._id} === ${quiz.creatorID.toString()}`)
        if(quiz.creatorID.toString() !== req.user.id) {
            return res.json({ error : true , message : "Unauthorised" })
        }
        quiz.title = title;
        quiz.questions = questions;
        await quiz.save();
        return res.json({ error: false, quiz });
    } catch (err) {
        console.log(err.message);
        return res.json({ error: true, message: "Server error" });
    }
}

export const deleteQuiz = async (req,res) => {
    try {
        let { code } = req.body
        if (!code) { return res.json({ error: true, message: "Please enter all fields" }); }
        let quiz = await Quiz.findOne({ code });
        if (!quiz) { return res.json({ error: true, message: "Quiz not found" }); }
        if (quiz.creatorID.toString() !== req.user.id) { return res.json({ error: true, message: "Unauthorized" }); }
        if(quiz.started && !quiz.completed){
            return res.json({ error : true, message : "Can't delete when quiz is live"})
        }

        // Delete the quiz code from all participants quiz list
        for(let i=0;i<quiz.participants.length;i++){
            let ptp = quiz.participants[i]
            if(ptp.participantID == quiz.creatorID){
                continue
            }
            let user = await User.findOne({_id : ptp.participantID})
            if(user){
                let index = user.otherQuizzes.indexOf(code)
                if(index !== -1){
                    user.otherQuizzes.splice(index,1)
                    user.markModified('otherQuizzes')
                    await user.save()
                }
            }
        }
        // Remove it from creators list
        let creator = await User.findById(quiz.creatorID)
        if(creator){
            let index = creator.quizzes.indexOf(code)
            if(index !== -1){
                creator.quizzes.splice(index,1)
                creator.markModified('quizzes')
                await creator.save()
            }
        }
        await Quiz.deleteOne({_id : quiz._id})
        return res.json({ error : false })
    } catch (err){
        console.log(err.message);
        res.json({ error: true, message: "Server error" });
    }
}

export const createQuiz = async (req, res) => {
    try {
        let { title, questions} = req.body;
        if (!title || !questions) {
            return res.json({ error: true, message: "Please enter all fields" });
        }
        let quiz = new Quiz({
            title,
            questions,
        });
        quiz.creatorID = req.user.id;
        let code = generateRandomCode();
        let otherQuiz = await Quiz.findOne({ code });
        while (otherQuiz) {
            code = generateRandomCode();
            otherQuiz = await Quiz.findOne({ code });
        }
        let user = await User.findById(req.user.id)
        user.quizzes.unshift(code)
        quiz.code = code;
        await quiz.save();
        await user.save();
        res.json({ error: false, quiz });
    } catch (err) {
        console.log(err.message);
        res.json({ error: true, message: "Server error" });
    }
}

export const startQuiz = async (req, res) => {
    try {
        let { code } = req.body;
        if (!code) {
            return res.json({ error: true, message: "Please enter all fields" });
        }
        let quiz = await Quiz.findOne({ code });
        if (!quiz) {
            return res.json({ error: true, message: "Quiz not found" });
        }
        if (quiz.creatorID.toString() !== req.user.id) {
            return res.json({ error: true, message: "Unauthorized" });
        }
        quiz.started = true;
        await quiz.save();
        conductQuiz(code);
        res.json({ error: false, message: "Quiz started" });
    } catch (err) {
        console.log(err.message);
        res.json({ error: true, message: "Server error" });
    }
}

export const getLeaderBoard = async (req,res) => {
    try {
        let { code } = req.body;
        if (!code) {
            return res.json({ error: true, message: "Please enter all fields" });
        }
        let quiz = await Quiz.findOne({ code });
        if (!quiz) {
            return res.json({ error: true, message: "Quiz not found" });
        }
        res.json({ error: false, data : makeLeaderBoard(quiz) });
    } catch (err) {
        console.log(err.message);
        res.json({ error: true, message: "Server error" });
    }
}