import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import connectDB from './db.js'
import session from "express-session";
import passport from "./config/passport.js";


// environement variable configuration
dotenv.config({path:'./.env'})


// server setup
const app = express()
const corsOption = {
    credentials:true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept']
}
app.use(cors(corsOption))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true }))
app.use(
  session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());

app.use(passport.session());



// server connection along with database
async function serverConnection(){
    try {
        await connectDB()
        app.listen(process.env.PORT || 3000,()=>{
            console.log("SERVER SUCCESSFULLY STARTED AT PORT : ", process.env.PORT || 3000)
        })
    } catch (error) {
        console.error("DATABASE CONNECTION FAILED: " , error)
    }
}
serverConnection()

// implementing routes
import userRouter from './routes/userroute.js'
app.use('/api/user',userRouter)