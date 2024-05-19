import { Router } from "express"
import { login,register,profile, quizes, sendOtpToUser } from "../controllers/userController.js"
const router=Router()

router.post('/login',login)
router.post('/register',register)
router.post('/sendOtp',sendOtpToUser);
router.get('/profile',profile);
router.get('/quizes',quizes);

export default router