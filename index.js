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
import { resetIcompleteQuizzes } from './helpers/initialize.js';
const upload = multer({ dest: 'uploads/' });
dotenv.config()

const allowedOrigins = process.env.CLIENT_URLS
const corsOptions = {
    origin: function (origin, callback) {
        // Check if the origin is in the allowed origins list
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true); // Allow the request
        } else {
            callback(new Error('Not allowed by CORS')); // Block the request
        }
    },
    optionsSuccessStatus: 200
};



const app = express();
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({limit: '5mb'}));
app.use(express.json());

app.use('/user',userRoute);
app.use(auth);
app.post('/uploadImg',upload.single('image'),handleImgUpload)
app.post('/deleteImg',handleImageDelete)
app.use('/quiz',quizRoute);

const httpServer = createServer(app);



async function initializeServer() {
    console.log('Reseting incomplete quizzes')
    await resetIcompleteQuizzes();
    
    initSockets(httpServer);
    httpServer.listen(process.env.PORT, () => {
        console.log('Server started');
    });
}

try {
    mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
    initializeServer()
} catch(err) {
    console.log(err.message);
}