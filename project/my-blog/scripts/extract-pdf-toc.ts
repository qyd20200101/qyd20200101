import { join } from 'pathe'
import { GoogleGenerativeAI } from "@google/generative-ai"
import * as dotenv from 'dotenv'
import fs from 'node:fs/promises'
import fitz from 'pdfjs-dist' // 我们尝试用这个轻量级的读取元数据

dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

async function extractTOC(pdfPath: string) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    console.log(`🔍 正在扫描文档目录页 (请稍候 5 秒)...`)
    await new Promise(resolve => setTimeout(resolve, 5000))

    // 使用我们预提取的前 30 页 PDF
    const tocSourcePath = join(process.cwd(), 'knowledge', 'temp_toc_source.pdf')
    const pdfBuffer = await fs.readFile(tocSourcePath)
    
    const prompt = `
        你是一个专业的文档索引专家。请阅读这个 PDF 的目录页，并提取出详细的章节目录。
        输出格式要求为 JSON 数组：
        [
            { "chapter": "第一章 XXX", "startPage": 1, "endPage": 20, "description": "核心思想简述" },
            ...
        ]
        注意：请务必根据目录推断或计算出每个章节的结束页码。如果无法确定 endPage，请留空。
    `

    try {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: pdfBuffer.toString("base64"),
                    mimeType: "application/pdf"
                }
            }
        ])

        const response = await result.response
        const text = response.text()
        
        // 简单提取 JSON 部分
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
            const toc = JSON.parse(jsonMatch[0])
            console.log("✅ 成功提取目录索引：")
            console.table(toc)
            
            // 保存索引到知识库
            const indexPath = pdfPath.replace('.pdf', '_toc.json')
            await fs.writeFile(indexPath, JSON.stringify(toc, null, 2))
            console.log(`💾 索引已保存至: ${indexPath}`)
        }
    } catch (e: any) {
        console.error("❌ 目录提取失败:", e.message)
    }
}

// 测试：以 JavaScript 高级程序设计为例
extractTOC('knowledge/raw/books/JavaScript高级程序设计（第4版）.pdf')
