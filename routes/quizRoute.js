import { Router } from "express"
import { createQuiz,startQuiz,getLeaderBoard } from "../controllers/quizController.js"
const router=Router()

router.post('/create',createQuiz)
router.post('/start',startQuiz)
router.post('/leaderboard',getLeaderBoard)

export default router