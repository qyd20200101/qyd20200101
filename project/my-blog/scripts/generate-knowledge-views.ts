import { useKnowledgeDb } from '../server/utils/knowledge-db'
import { OpenAI } from 'openai'
import * as dotenv from 'dotenv'

dotenv.config()

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
})

async function generateViews() {
  const db = useKnowledgeDb()
  const docs = db.prepare('SELECT id, title FROM documents WHERE short_summary IS NULL').all()

  console.log(`🚀 开始为 ${docs.length} 个文档生成知识视图...`)

  for (const doc of docs) {
    console.log(`\n📄 正在处理: ${doc.title}...`)
    
    // 获取部分分块内容用于总结 (取前5个块)
    const chunks = db.prepare('SELECT summary FROM chunks WHERE doc_id = ? LIMIT 5').all(doc.id)
    const sampleContent = chunks.map((c: any) => c.summary).join('\n')

    try {
      const response = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { 
            role: 'system', 
            content: '你是一个专业的文档分析专家。请根据提供的文档片段，生成该文档的：1. 短摘要（50字内）；2. 5个核心关键词（逗号隔开）；3. 主要章节名称及各章节的一句话核心思想（格式：章节名: 思想）。' 
          },
          { role: 'user', content: `文档标题: ${doc.title}\n内容片段: \n${sampleContent}` }
        ]
      })

      const reply = response.choices[0]?.message?.content || ''
      
      // 解析 AI 回复 (简单的正则解析)
      const shortSummary = reply.match(/短摘要[：:][\s\n]*(.+)/)?.[1] || ''
      const keywords = reply.match(/关键词[：:][\s\n]*(.+)/)?.[1] || ''
      
      // 更新文档主表
      db.prepare('UPDATE documents SET short_summary = ?, keywords = ? WHERE id = ?')
        .run(shortSummary, keywords, doc.id)

      // 解析并存储章节摘要
      const chapterLines = reply.match(/(?:章节|思想)[：:\n]([\s\S]+)/)?.[1]?.split('\n') || []
      for (const line of chapterLines) {
        if (line.includes(':') || line.includes('：')) {
          const [cTitle, cSummary] = line.split(/[：:]/)
          if (cTitle && cSummary) {
            db.prepare('INSERT INTO chapters (doc_id, title, summary) VALUES (?, ?, ?)')
              .run(doc.id, cTitle.trim(), cSummary.trim())
          }
        }
      }

      console.log(` ✅ 知识视图生成成功！`)
    } catch (e: any) {
      console.error(` ❌ 处理失败: ${e.message}`)
    }
  }
}

generateViews().catch(console.error)
