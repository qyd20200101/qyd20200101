import { join } from 'pathe'
import fs from 'node:fs/promises'
import { execSync } from 'node:child_process'

async function testSingleOcr() {
    const filePath = 'knowledge/raw/books/JavaScript高级程序设计（第4版）.pdf'
    const tempMdPath = join(process.cwd(), 'knowledge', 'test_ocr_result.md')
    
    console.log(`🧪 正在强制测试单页 OCR 识别: ${filePath}`)
    
    try {
        // 我们修改一下调用，让 Python 只处理前 2 页（或者全部，取决于 ocr_worker 的实现）
        // 这里我们直接运行之前的 ocr_worker.py
        console.log(`⏳ 正在调用 Python OCR 引擎 (EasyOCR)...`)
        execSync(`python scripts/ocr_worker.py "${filePath}" "${tempMdPath}" 2`, { stdio: 'inherit' })
        
        const result = await fs.readFile(tempMdPath, 'utf-8')
        console.log(`\n✅ 识别成功！结果预览 (前 500 字):\n`)
        console.log("------------------------------------------")
        console.log(result.substring(0, 500))
        console.log("------------------------------------------")
        
        // await fs.unlink(tempMdPath)
    } catch (err: any) {
        console.error(`❌ 测试失败: ${err.message}`)
    }
}

testSingleOcr()
