import { db, type LogEntry } from '../db/index';

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'GENERATE_MOCK_DATA') {
    const { count, tenantId } = payload;
    const batchSize = 10000;
    const levels = ['INFO', 'WARN', 'ERROR'];
    const messages = [
      'User login successful', 
      'Database connection failed', 
      'Payment transaction processed', 
      'API gateway timeout', 
      'Cache miss on user profile',
      'Memory limit exceeded',
      'Worker thread spawned',
      'Authentication token expired'
    ];
    
    // Clear existing to avoid duplicate build-up on reload
    await db.logs.clear();
    
    let totalGenerated = 0;
    
    for (let i = 0; i < count; i += batchSize) {
      const batch: LogEntry[] = [];
      const currentBatchSize = Math.min(batchSize, count - i);
      
      for (let j = 0; j < currentBatchSize; j++) {
        const level = levels[Math.floor(Math.random() * levels.length)] as any;
        const msg = messages[Math.floor(Math.random() * messages.length)];
        const timestamp = Date.now() - Math.floor(Math.random() * 86400000);
        
        batch.push({
          timestamp,
          level,
          message: `${msg} [TraceID: ${Math.random().toString(36).substring(2, 9)}]`,
          context: `{"userId": ${Math.floor(Math.random() * 1000)}, "ip": "192.168.1.${Math.floor(Math.random() * 255)}", "responseTime": ${Math.floor(Math.random() * 2000)}ms}`,
          tenantId: tenantId || 'default'
        });
      }
      
      await db.logs.bulkAdd(batch);
      totalGenerated += currentBatchSize;
      
      self.postMessage({ 
        type: 'GENERATE_PROGRESS', 
        payload: { progress: Math.floor((totalGenerated / count) * 100) } 
      });
    }
    
    self.postMessage({ type: 'GENERATE_DONE' });
  }

  if (type === 'SAVE_LOG') {
    const { log } = payload;
    try {
      await db.logs.add(log);
      // No need to send message back unless error
    } catch (e) {
      console.error('Worker SAVE_LOG error:', e);
    }
  }

  if (type === 'QUERY_LOGS') {
    const { level, keyword, startTime, endTime, tenantId, limit = 100000 } = payload;
    
    self.postMessage({ type: 'QUERY_START' });
    
    try {
      const t0 = performance.now();
      const stats = { INFO: 0, WARN: 0, ERROR: 0 };
      
      // 使用 tenantId 进行主索引查询，实现物理隔离级别的性能
      const results = await db.logs.where('tenantId').equals(tenantId)
        .reverse()
        .filter(log => {
          // 时间范围过滤
          if (startTime && log.timestamp < startTime) return false;
          if (endTime && log.timestamp > endTime) return false;

          if (level && log.level !== level) return false;
          if (keyword && !log.message.toLowerCase().includes(keyword.toLowerCase())) return false;
          
          if (stats[log.level] !== undefined) stats[log.level]++;
          return true;
        })
        .limit(limit)
        .toArray();
        
      const t1 = performance.now();
      
      self.postMessage({ 
        type: 'QUERY_RESULTS', 
        payload: {
          data: results,
          timeMs: Math.floor(t1 - t0),
          stats: stats
        } 
      });
    } catch (error: any) {
      self.postMessage({ type: 'QUERY_ERROR', payload: error.toString() });
    }
  }

  if (type === 'EXPORT_LOGS') {
    const { level, keyword, startTime, endTime, tenantId } = payload;
    try {
      let query = db.logs.where('tenantId').equals(tenantId).reverse();
      const results = await query.filter(log => {
        if (startTime && log.timestamp < startTime) return false;
        if (endTime && log.timestamp > endTime) return false;
        if (level && log.level !== level) return false;
        if (keyword && !log.message.toLowerCase().includes(keyword.toLowerCase())) return false;
        return true;
      }).toArray();

      // Convert to CSV
      const headers = 'ID,Timestamp,Level,Message,Context\n';
      const rows = results.map(r => {
        const time = new Date(r.timestamp).toISOString();
        // Escape message to handle commas
        const msg = `"${r.message.replace(/"/g, '""')}"`;
        const ctx = `"${(r.context || '').replace(/"/g, '""')}"`;
        return `${r.id},${time},${r.level},${msg},${ctx}`;
      }).join('\n');

      self.postMessage({
        type: 'EXPORT_DONE',
        payload: { csv: headers + rows }
      });
    } catch (error: any) {
      self.postMessage({ type: 'QUERY_ERROR', payload: error.toString() });
    }
  }
};
