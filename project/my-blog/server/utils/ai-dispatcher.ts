import * as tools from './ai-tools'
import * as kTools from './ai-knowledge-tools'

/**
 * AI 工具分发器
 * 负责解析 LLM 的 tool_calls 并执行对应的本地函数
 */
export const dispatchToolCall = async (toolCall: any) => {
  const { name, arguments: argsString } = toolCall.function
  
  let args: any
  try {
    args = typeof argsString === 'string' ? JSON.parse(argsString) : argsString
  } catch (e) {
    console.error(`解析 AI 工具参数失败: ${argsString}`)
    throw new Error(`参数格式错误: ${name}`)
  }

  console.log(`[AI MCP] 执行工具: ${name}`, args)

  try {
    switch (name) {
      case 'read_blog_file':
        return await tools.readBlogFile(args.filename)
      case 'write_blog_file':
        return await tools.writeBlogFile(args.filename, args.content)
      case 'list_local_files':
        return await tools.listLocalFiles()
      case 'query_db':
        return tools.queryBlogDb(args.sql, args.params)
      // 知识库工具
      case 'search_knowledge':
        return await kTools.searchKnowledge(args.query, args.tags)
      case 'read_knowledge_chunk':
        return await kTools.readKnowledgeChunk(args.chunkId)
      case 'get_document_info':
        return await kTools.getDocumentInfo(args.docId)
      case 'list_knowledge_documents':
        return await kTools.listKnowledgeDocuments()
      default:
        throw new Error(`未定义的工具: ${name}`)
    }
  } catch (err: any) {
    console.error(`[AI MCP] 工具执行报错: ${name}`, err.message)
    return { error: err.message }
  }
}
