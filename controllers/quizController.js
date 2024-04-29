import Quiz from '../models/quizSchema.js';
import { conductQuiz } from '../sockets/rooms.js';
import User from '../models/userSchema.js';

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


export const createQuiz = async (req, res) => {
    try {
        let { title, questions} = req.body;
        if (!title || !questions) {
            return res.json({ error: true, message: "Please enter all fields" });
        }
        let time;
        try {
            time  = new Date(startTime)
        } catch (err) { console.trace() }
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
        user.quizzes.push(code)
        quiz.code = code;
        await quiz.save();
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