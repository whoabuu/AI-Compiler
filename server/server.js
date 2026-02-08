import express from 'express';
import cors from 'cors'
import axios from 'axios';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/compile", async(req, res)=>{
    const {code, language} = req.body;

    try {
        const pistonRun = await axios.post(
          "https://emkc.org/api/v2/piston/execute",
          {
            language: language,
            version: "*",
            files: [{ content: code }],
          }
        );

        const {run} = pistonRun.data;

        if(run.code !== 0 || run.stderr){
            const aiFix = await getAiFix(code, language, run.stderr);

            return res.json({
                error: true,
                stdout: run.stdout,
                stderr: run.stderr,
                aiFix: aiFix,
            })
        }

        res.json({
            error: false,
            stdout: run.stdout,
        });
    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

async function getAiFix(code, language, errorMsg){
    if(!process.env.GEMINI_API_KEY){
        return({
          explanation: "API key missing",
          correctedCode: code,
        })
    }

    try {
        const model = genAi.getGenerativeModel({ model: "gemini-flash-latest"});

        const prompt = `You are an expert programmer. The user wrote this ${language} code, but it failed.
        
        Code:
        ${code}

        Error:
        ${errorMsg}

        Task:
        1. Explain what is wrong in 1 sentence.
        2. Provide the FIXED code only.

        Return valid JSON format:
        {
            "explanation": "Brief explanation here",
            "correctedCode": "The fixed code string here"
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown if AI adds it (e.g. ```json ... ```)
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("AI Error:", error.message);
        return { explanation: "AI could not process this error.", correctedCode: code };
    }
}

app.listen(PORT, ()=>{
    console.log(`Server running on ${PORT}`);
})