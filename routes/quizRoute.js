import { Router } from "express"
import { createQuiz,startQuiz,getLeaderBoard,deleteQuiz } from "../controllers/quizController.js"
const router=Router()

router.post('/create',createQuiz)
router.post('/start',startQuiz)
router.post('/leaderboard',getLeaderBoard)
router.post('/delete',deleteQuiz)

export default router