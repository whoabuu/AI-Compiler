import express from 'express';
import cors from 'cors'
import axios from 'axios';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.listen(PORT, ()=>{
    console.log(`Server running on ${PORT}`);
})