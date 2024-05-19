import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
    title : { type: String, required: true },
    creatorID : { type : String, required : true },
    questions : [{
            questionText : { type : String, default : ''},
            questionImgUrl : { type : String , default:'' },
            options : [String, String, String, String],
            correctIndex : { type : Number, required : true, min : 0, max : 3},
            points : { type : Number, required : true, default : 1000 }
    }],
    participants : [
        {
            participantID : { type : String, required : true },
            participantName : { type : String, required : true },
            answers : [{
                q_index : { type : Number , required : true },
                a_index : { type : Number , required : true }
            }],
            score :{ type : Number, required : true, default : 0}
        }
    ],
    startTime : { type : Date },
    completed : { type : Boolean, required : true, default : false },
    started : { type : Boolean, required : true, default : false },
    code : { type : String }
})

export default mongoose.model('Quiz', quizSchema, 'quizzes');