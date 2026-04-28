import { GoogleGenerativeAI } from "@google/generative-ai"
import * as dotenv from 'dotenv'
dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

async function listModels() {
  try {
    // 尝试列出模型 (在 SDK 中可能没有直接的 listModels，我们直接尝试常用的名称)
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.5-flash-latest"]
    for (const m of models) {
        try {
            const model = genAI.getGenerativeModel({ model: m })
            const result = await model.generateContent("test")
            console.log(`✅ Model ${m} is AVAILABLE`)
        } catch (e: any) {
            console.log(`❌ Model ${m} is NOT available: ${e.message}`)
        }
    }
  } catch (e: any) {
    console.error("Error:", e.message)
  }
}

listModels()
