import jwt from 'jsonwebtoken'
// import dotenv from 'dotenv'
import User from '../models/userSchema.js'
// dotenv.config()

export const auth = async (req, res, next) => {
    try {
        let token = req.header('authorization')
        if (!token) {
            return res.json({ error : true , message : "No token, authorization denied"})
        }
        let verified = jwt.verify(token, process.env.SECRET)
        if (!verified) {
            return res.json({ error : true , message : "Token verification failed, authorization denied"})
        }
        const user = await User.findById(verified._id)
        if (!user) {
            return res.json({ error : true , message : "User does not exist"})
        }
        req.user = user
        // console.log(req.user)
        next()
    } catch(err) {
        console.log(err.message)
        res.json({ error : true , message : "Server error"})
    }
}