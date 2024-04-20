import { Router } from "express"
import { createQuiz,startQuiz } from "../controllers/quizController.js"
const router=Router()

router.post('/create',createQuiz)
router.post('/start',startQuiz)

export default router