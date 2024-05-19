import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import userRoute from './routes/userRoute.js';
import { createServer } from 'http';
import { initSockets } from './sockets/sockets.js';
import { auth } from './middleware/auth.js';
import quizRoute from './routes/quizRoute.js'
import multer from 'multer';
import { handleImageDelete, handleImgUpload } from './controllers/uploadController.js';
const upload = multer({ dest: 'uploads/' });
dotenv.config()

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({limit: '5mb'}));
app.use(express.json());

app.use('/user',userRoute);
app.use(auth);
app.post('/uploadImg',upload.single('image'),handleImgUpload)
app.post('/deleteImg',handleImageDelete)
app.use('/quiz',quizRoute);

const httpServer = createServer(app);
initSockets(httpServer);

try {
    mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
    httpServer.listen(process.env.PORT, () => {
        console.log('Server started');
    });
    console.log('Creating first room')
} catch(err) {
    console.log(err.message);
}