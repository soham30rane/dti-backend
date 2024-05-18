import mongoose from "mongoose"
// import dotenv from 'dotenv'
// dotenv.config()

let userSchema=new mongoose.Schema({
  email:{
    type:String,
    required:true,
    unique:true
  },
  password:{
    type:String,
    required:true
  },
  username:{
    type:String,
    required:true
  },
  quizzes : [{type : String}],
  otherQuizzes : [{type : String}]
})

export default mongoose.model('User',userSchema)