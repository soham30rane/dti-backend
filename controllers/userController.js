import User from '../models/userSchema.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Quiz from '../models/quizSchema.js'
import { getOnlineCount } from '../quiz/liveCount.js'
import { sendOtp, verifyOtp } from '../helpers/otpHelper.js'
// import dotenv from 'dotenv'
// dotenv.config()

let createToken = (_id) => {
    return jwt.sign({ _id }, process.env.SECRET)
}

export const quizes = async (req,res) => {
    try {
        let quizes = await Quiz.find({ creatorID : req.user.id})
        res.json({ error : false , quizes })
    }
    catch(err) {
        console.log(err.message)
        res.json({ error : true , message : "Server error"})
    }
}

export const login = async (req, res) => {
    try {
        let { email, password } = req.body
        if (!email || !password) {
            return res.json({ error : true , message : "Please enter all fields"})
        }
        let user = await User.findOne({ email : email })
        if (!user) {
            return res.json({ error : true , message : "User does not exist"})
        }
        let isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.json({ error : true , message : "Invalid credentials"})
        }
        let token = createToken(user._id,user.username,user.email)
        res.json({ error : false ,token, user : { _id : user._id, email : user.email, username : user.username }})
    } catch(err) {
        console.log(err.message)
        res.json({ error : true , message : "Server error"})
    }
}

export const register = async (req,res) => {
    try {
        let { email, password, username,userOtp } = req.body
        if (!email || !password || !username || !userOtp) {
            return res.json({ error : true , message : "Please enter all fields"})
        }
        let user = await User.findOne({ email : email })
        if (user) {
            return res.json({ error : true , message : "email already registered"})
        }
        if(!verifyOtp(email,userOtp)){ return res.json({error : true, message : "Wrong otp, try again or refresh"}) }
        let salt = await bcrypt.genSalt(10)
        let hashedPassword = await bcrypt.hash(password, salt)
        user = new User({
            email,
            password : hashedPassword,
            username,
            quizzes : [],
            otherQuizzes : []
        })
        await user.save()
        let token = createToken(user._id)
        res.json({ error : false ,token, user : { _id : user._id, email : user.email, username : user.username }})
    } catch(err) {
        console.log(err.message)
        res.json({ error : true , message : "Server error"})
    }
}

export const profile = async (req,res) => {
    try {
        const userId = (jwt.verify(req.header('authorization'),process.env.SECRET));
        if(!userId){ return res.json({error:true,message:'Authorisation failed'}) }
        console.log(userId)
        let user = await User.findById(userId._id).select('-password')
        if(!user){return res.json({error:true,message:"User not found"})}
        let quizes = [] 
        for(let i=0;i<user.quizzes.length;i++){
            let quiz = await Quiz.findOne({ code : user.quizzes[i]})
            let resQuiz = {...quiz.toObject(),onlineCount : getOnlineCount(quiz.code)}
            quizes.push(resQuiz)
        }
        let otherQuizzes = []
        for(let i=0;i<user.otherQuizzes.length;i++){
            try {
                let otherQuiz = await Quiz.findOne({ code : user.otherQuizzes[i] })
                otherQuizzes.push({
                    code : otherQuiz.code,
                    title : otherQuiz.title,
                    started : otherQuiz.started,
                    completed : otherQuiz.completed,
                    onlineCount : getOnlineCount(otherQuiz.code)
                })
            } catch(err) {
                // quiz might have been deleted
                user.otherQuizzes.splice(i,1)
                user.markModified('otherQuizzes')
                await user.save()
            }
        }
        // console.log('quizzes : ' , quizes)
        // console.log('\nOTHER QUIZES : ',otherQuizzes)
        res.json({ error : false , user,quizes,otherQuizzes })
    } catch(err) {
        console.log(err.message)
        res.json({ error : true , message : "Server error"})
    }
}

export const sendOtpToUser = async (req,res) => {
    try {
        let { email } = req.body
        if(!email) { return res.json({error:false,message:"Email required"}) }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){return res.json({error:false,message:"Invalid email"})}
        let user = await User.findOne({ email : email })
        if (user) {
            return res.json({ error : true , message : "email already registered"})
        }
        let status = await sendOtp(email)
        if(status){
            return res.json({error:false,message:`otp sent to ${email}`})
        } else {
            return res.json({error:true,message:"Unable to send email"})
        }        
    } catch {
        console.log(err.message)
        console.log("Something failed")
        return res.json({ error : true , message : "Server error"})
    }
}
