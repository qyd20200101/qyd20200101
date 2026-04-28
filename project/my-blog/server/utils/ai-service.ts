import OpenAI from 'openai'
import fs from 'node:fs/promises'
import { join } from 'pathe'
import { aiToolDefinitions } from './ai-tools'
import { dispatchToolCall } from './ai-dispatcher'

/**
 * 知识内容压缩：去除冗余空格、空行，尽可能保留核心信息但节约 Token
 */
function compressKnowledgeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

/**
 * 加载 Skill 定义作为 System Prompt
 */
export async function loadSkill(skillName: string) {
  const skillPath = join(process.cwd(), 'docs', 'skills', `${skillName}_skill.md`)
  try {
    const content = await fs.readFile(skillPath, 'utf-8')
    return compressKnowledgeText(content)
  } catch (e) {
    console.warn(`未找到 Skill 定义: ${skillName}`)
    return ''
  }
}

/**
 * DeepSeek AI 服务核心逻辑
 */
export async function askDeepSeek(options: {
  messages: any[]
  skill?: string
  stream?: boolean
}) {
  const config = useRuntimeConfig()
  
  // 初始化 OpenAI 客户端 (兼容 DeepSeek)
  const client = new OpenAI({
    apiKey: config.deepseekApiKey || process.env.DEEPSEEK_API_KEY,
    baseURL: config.deepseekBaseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
  })
  
  const messages = [...options.messages]

  // 如果指定了 Skill，将其注入为第一个 system 消息
  if (options.skill) {
    const skillContent = await loadSkill(options.skill)
    if (skillContent) {
      messages.unshift({ 
        role: 'system', 
        content: `你正在使用 ${options.skill} 技能。以下是技能规范：\n${skillContent}\n\n` +
                 `**重要指令**：\n` +
                 `1. 遵循 4 步检索管线：先调用 search_knowledge 检索 -> 阅读返回的摘要并筛选 chunkId -> 调用 read_knowledge_chunk 获取全文 -> 结合上下文回答。\n` +
                 `2. 严禁输出诸如 < | DSML | > 或 < | invoke | > 等格式的内容，必须使用标准工具调用接口。\n` +
                 `3. 如果你需要读取博客文章，请使用 read_blog_file 工具。`
      })
    }
  }

  // 默认全局指令
  messages.push({
    role: 'system',
    content: '你是一个高效的博客助手。在回答之前，请先思考是否需要调用 search_knowledge 检索背景知识。所有返回给你的知识库内容都已过压缩处理以节省 Token。'
  })

  // 1. 发起初始请求
  const response = await client.chat.completions.create({
    model: 'deepseek-chat', // 使用 DeepSeek 官方模型名称
    messages,
    tools: aiToolDefinitions as any,
    tool_choice: 'auto'
  })

  const responseMessage = response.choices[0]?.message
  if (!responseMessage) {
    throw new Error('AI 未返回有效响应内容')
  }

  // --- 增强逻辑：手动解析复杂的 DSML 格式 ---
  if (!responseMessage.tool_calls && responseMessage.content?.includes('< | DSML |')) {
    console.log(`[AI Debug] 检测到复杂 DSML 格式，启动深度解析...`)
    const toolCalls: any[] = []
    
    // 1. 提取所有的 invoke 块
    const invokeBlocks = responseMessage.content.match(/< \| DSML \| invoke name="([^"]+)"\s*>([\s\S]*?)<\/ \| DSML \| invoke\s*>/g)
    
    if (invokeBlocks) {
      for (const block of invokeBlocks) {
        const nameMatch = block.match(/name="([^"]+)"/)
        if (!nameMatch) continue
        const name = nameMatch[1]
        
        // 2. 在 invoke 块中提取参数值 (支持 <parameter> 标签或直接内容)
        let argValue = ''
        const paramMatch = block.match(/>([^<]+)<\/ \| DSML \| parameter\s*>/)
        if (paramMatch && paramMatch[1]) {
          argValue = paramMatch[1].trim()
        } else {
          // 兜底：尝试匹配简单的标签间内容
          const simpleMatch = block.match(/>([\s\S]*?)<\/ \| DSML \|/);
          if (simpleMatch && simpleMatch[1]) argValue = simpleMatch[1].trim();
        }

        if (argValue) {
          let args = {}
          if (name === 'read_blog_file') args = { filename: argValue }
          else if (name === 'query_db') args = { sql: argValue }
          else if (name === 'read_knowledge_chunk') args = { chunkId: parseInt(argValue) }
          else args = { query: argValue }

          toolCalls.push({
            id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: 'function',
            function: { name, arguments: JSON.stringify(args) }
          })
        }
      }
    }
    
    if (toolCalls.length > 0) {
      console.log(`[AI Debug] 手动解析成功，共识别到 ${toolCalls.length} 个工具调用`)
      ;(responseMessage as any).tool_calls = toolCalls
    }
  }
  // ----------------------------------------------------------------------

  // 2. 检查是否需要调用工具
  if (responseMessage.tool_calls) {
    console.log(`[AI Debug] AI 返回了工具调用，正在处理思考内容...`)
    
    // 强制构造消息对象，确保包含 reasoning_content
    const assistantMessage: any = {
      role: 'assistant',
      content: responseMessage.content || null,
      tool_calls: responseMessage.tool_calls,
    }
    
    // 从原始响应中提取思考内容（不管 SDK 类型定义如何）
    const rawMessage = response.choices?.[0]?.message as any
    if (rawMessage?.reasoning_content) {
      console.log(`[AI Debug] 检测到思考内容，长度: ${rawMessage.reasoning_content.length}`)
      assistantMessage.reasoning_content = rawMessage.reasoning_content
    }
    
    messages.push(assistantMessage)

    for (const toolCall of responseMessage.tool_calls) {
      const tc = toolCall as any
      console.log(`[AI MCP] 执行工具: ${tc.function?.name} ${tc.function?.arguments}`)
      let toolResult = await dispatchToolCall(toolCall)
      
      // 对返回的内容进行压缩处理，节约 Token
      if (typeof toolResult === 'string') {
        toolResult = compressKnowledgeText(toolResult)
      } else if (toolResult && typeof toolResult === 'object') {
        // 如果是对象，转成字符串并压缩
        toolResult = compressKnowledgeText(JSON.stringify(toolResult))
      }

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: toolResult
      })
    }

    // 3. 将工具执行结果返回给 AI，获取最终回复
    console.log(`[AI Debug] 正在发送工具执行结果给 AI...`)
    const finalResponse = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages
    })
    return finalResponse.choices[0]?.message?.content || ''
  }

  return responseMessage.content || ''
}
