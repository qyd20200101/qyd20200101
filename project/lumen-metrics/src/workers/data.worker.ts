// Web Worker for Data Processing
self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;
  
  if (type === 'PROCESS_STREAM') {
    // heavy computation mock
    const processed = payload.map((item: any) => ({
      ...item,
      processedTime: Date.now()
    }));
    
    self.postMessage({
      type: 'STREAM_PROCESSED',
      payload: processed
    });
  }
};
