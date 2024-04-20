import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
    title : {
        type: String,
        required: true
    },
    creatorID : {
        type : String,
        required : true
    },
    questions : [
        {
            questionText : {
                type : String,
                required : true
            },
            options : [String, String, String, String],
            correctAnswerIndex : {
                type : Number,
                required : true,
                min : 0,
                max : 3
            },
            points : {
                type : Number,
                required : true,
                default : 1000
            }
        }
    ],
    participants : [
        {
            participantID : {
                type : String,
                required : true
            },
            answers : [{
                type : Number,
            }],
            score :{
                type : Number,
                required : true,
                default : 0
            }
        }
    ],
    startTime : {
        type : Date
    },
    completed : {
        type : Boolean,
        required : true,
        default : false
    },
    started : {
        type : Boolean,
        required : true,
        default : false
    },
    code : {
        type : String
    }
})

export default mongoose.model('Quiz', quizSchema, 'quizzes');