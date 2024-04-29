import { Router } from "express"
import { login,register,profile, quizes } from "../controllers/userController.js"
const router=Router()

router.post('/login',login)
router.post('/register',register)
router.get('/profile',profile);
router.get('/quizes',quizes);

export default router