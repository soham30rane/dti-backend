import { Router } from "express"
import { createQuiz,startQuiz,getLeaderBoard,deleteQuiz, editQuiz } from "../controllers/quizController.js"
const router=Router()

router.post('/create',createQuiz)
router.post('/start',startQuiz)
router.post('/leaderboard',getLeaderBoard)
router.post('/delete',deleteQuiz)
router.post('/edit',editQuiz)

export default router