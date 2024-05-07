import User from '../models/userSchema.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Quiz from '../models/quizSchema.js'
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
        let { email, password, username } = req.body
        if (!email || !password || !username) {
            return res.json({ error : true , message : "Please enter all fields"})
        }
        let user = await User.findOne({ email : email })
        if (user) {
            return res.json({ error : true , message : "User already exists"})
        }
        let salt = await bcrypt.genSalt(10)
        let hashedPassword = await bcrypt.hash(password, salt)
        user = new User({
            email,
            password : hashedPassword,
            username,
            quizzes : []
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
        console.log(userId)
        let user = await User.findById(userId._id).select('-password')
        let quizes = [] 
        for(let i=0;i<user.quizzes.length;i++){
            let quiz = await Quiz.findOne({ code : user.quizzes[i]})
            quizes.push(quiz)
        }
        console.log('quizzes : ' , quizes)
        res.json({ error : false , user,quizes })
    } catch(err) {
        console.log(err.message)
        res.json({ error : true , message : "Server error"})
    }
}