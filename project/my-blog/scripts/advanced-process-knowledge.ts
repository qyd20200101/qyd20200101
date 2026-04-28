import { join, extname, basename } from 'pathe'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdf = require('pdf-parse')
import { useKnowledgeDb } from '../server/utils/knowledge-db'
import fs from 'node:fs/promises'

const RAW_DIR = join(process.cwd(), 'knowledge', 'raw')
const CHUNKS_BASE_DIR = join(process.cwd(), 'knowledge', 'chunks')

/**
 * 文本去噪与标准化
 */
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ') // 压缩多余空格
    .replace(/\n{3,}/g, '\n\n') // 压缩多余换行
    .trim()
}

/**
 * 高级切分逻辑：基于标题层级和代码块，并提取丰富元数据
 */
function splitIntoChunks(text: string, maxChunkSize = 800) {
  const lines = text.split('\n')
  const chunks: { 
    content: string; 
    headerPath: string[]; 
    hasCode: boolean; 
    needsContext: boolean;
    title: string;
  }[] = []
  
  let currentHeaders: string[] = []
  let currentChunkLines: string[] = []
  let inCodeBlock = false
  let chunkHasCode = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      chunkHasCode = true
    }

    const headerMatch = !inCodeBlock ? line.match(/^(#{1,6})\s+(.+)$/) : null
    
    if (headerMatch) {
      if (currentChunkLines.length > 0) {
        chunks.push({ 
          content: currentChunkLines.join('\n'), 
          headerPath: [...currentHeaders],
          hasCode: chunkHasCode,
          needsContext: currentChunkLines.length > 5 && !currentChunkLines[0].startsWith('#'),
          title: currentHeaders[currentHeaders.length - 1] || '未定义章节'
        })
        currentChunkLines = []
        chunkHasCode = false
      }
      const level = headerMatch[1].length
      currentHeaders = currentHeaders.slice(0, level - 1)
      currentHeaders[level - 1] = headerMatch[2].trim()
    }

    currentChunkLines.push(line)

    if (currentChunkLines.join('\n').length > maxChunkSize && !inCodeBlock) {
      chunks.push({ 
        content: currentChunkLines.join('\n'), 
        headerPath: [...currentHeaders],
        hasCode: chunkHasCode,
        needsContext: true, // 强制切分的块通常需要上下文
        title: currentHeaders[currentHeaders.length - 1] || '接上文'
      })
      currentChunkLines = []
      chunkHasCode = false
    }
  }

  if (currentChunkLines.length > 0) {
    chunks.push({ 
      content: currentChunkLines.join('\n'), 
      headerPath: [...currentHeaders],
      hasCode: chunkHasCode,
      needsContext: false,
      title: currentHeaders[currentHeaders.length - 1] || '结尾'
    })
  }

  return chunks
}

async function processKnowledge() {
  const db = useKnowledgeDb()
  // 清理旧数据重新跑 (可选，为了演示我先注释掉)
  // db.exec('DELETE FROM chunks; DELETE FROM documents;')

  const categories = ['books', 'notes', 'articles', 'imports']

  for (const cat of categories) {
    const catDir = join(RAW_DIR, cat)
    try {
      const files = await fs.readdir(catDir)
      for (const file of files) {
        if (file.startsWith('.')) continue
        
        const filePath = join(catDir, file)
        const ext = extname(file).toLowerCase()
        let rawText = ''

        console.log(`\n📦 正在深度解析: ${file}...`)

        if (ext === '.pdf') {
          const dataBuffer = await fs.readFile(filePath)
          const data = await pdf(dataBuffer)
          rawText = data.text

          // --- 扫描件探测与本地 OCR 联动 ---
          const charsPerPage = data.numpages > 0 ? rawText.length / data.numpages : 0
          if (charsPerPage < 100) {
            console.log(`  ⚠️ 检测到扫描版 PDF (每页仅 ${charsPerPage.toFixed(1)} 字符)，触发本地 OCR 主链路...`)
            const { execSync } = await import('node:child_process')
            const tempMdPath = join(process.cwd(), 'knowledge', `temp_ocr_${Date.now()}.md`)
            
            try {
              // 调用 Python OCR 脚本
              execSync(`python scripts/ocr_worker.py "${filePath}" "${tempMdPath}"`, { stdio: 'inherit' })
              rawText = await fs.readFile(tempMdPath, 'utf-8')
              await fs.unlink(tempMdPath) // 清理临时文件
              console.log(`  ✅ 本地 OCR 识别完成`)
            } catch (err: any) {
              console.error(`  ❌ 本地 OCR 执行失败: ${err.message}`)
              // 如果本地 OCR 失败，可以在这里预留 Vision 补强的入口
            }
          }
          // ---------------------------------
        } else {
          rawText = await fs.readFile(filePath, 'utf-8')
        }

        const cleanedText = cleanText(rawText)
        const title = basename(file, ext)
        
        const docResult = db.prepare(`
          INSERT INTO documents (title, type, source_path)
          VALUES (?, ?, ?)
        `).run(title, cat, filePath)
        const docId = docResult.lastInsertRowid

        const chunks = splitIntoChunks(cleanedText)
        console.log(`   - 成功切分为 ${chunks.length} 个语义块`)

        const docChunkDir = join(CHUNKS_BASE_DIR, `doc_${docId}`)
        await fs.mkdir(docChunkDir, { recursive: true })

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i]
          const chunkFileName = `chunk_${String(i + 1).padStart(3, '0')}.md`
          const chunkPath = join(docChunkDir, chunkFileName)
          
          const contextHeader = `> 上下文: ${title} ${chunk.headerPath.length ? '> ' + chunk.headerPath.filter(Boolean).join(' > ') : ''}\n\n`
          const fullContent = contextHeader + chunk.content

          await fs.writeFile(chunkPath, fullContent, 'utf-8')

          db.prepare(`
            INSERT INTO chunks (doc_id, chunk_index, file_path, summary, tags, has_code, needs_context, chunk_title)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            docId, 
            i + 1, 
            join('knowledge', 'chunks', `doc_${docId}`, chunkFileName),
            chunk.content.substring(0, 200).replace(/\n/g, ' ') + '...',
            chunk.headerPath.join(','),
            chunk.hasCode ? 1 : 0,
            chunk.needsContext ? 1 : 0,
            chunk.title
          )
        }
      }
    } catch (e) { continue }
  }
  console.log('\n✨ 深度解析与智能分块完成！')
}

processKnowledge().catch(console.error)
