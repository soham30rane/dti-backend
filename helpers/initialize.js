import Quiz from "../models/quizSchema.js";

export const resetIcompleteQuizzes = async () => {
    let quizzes = await Quiz.find({})
    let toUpdate = []
    for(let i=0;i<quizzes.length;i++){
        if(quizzes[i].started && !quizzes[i].completed){
            toUpdate.push(quizzes[i].code)
        }
    }
    console.log(toUpdate)
    for(let code of toUpdate){
        try {
            console.log('Reseting quiz : ',code)
            let quiz = await Quiz.findOne({ code });
            if (!quiz) { continue }
            if(quiz.started && !quiz.completed){
                quiz.started = false
                quiz.completed = false
                quiz.participants = []
                await quiz.save()
            }
        } catch (err){
            console.log("Some error while reseting of quiz",err.message);
            continue
        }
    }
}