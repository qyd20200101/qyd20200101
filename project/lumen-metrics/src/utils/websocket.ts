type MessageHandler = (data: any) => void;

/**
 * 企业级 WebSocket 客户端封装
 * 包含：自动重连、指数退避、事件分发、心跳机制预留
 */
export class WebSocketClient {
  private url: string;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private isIntentionalClose = false;
  public isConnected = false;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    this.isIntentionalClose = false;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log(`[WebSocket] Connected to ${this.url}`);
      this.reconnectAttempts = 0;
      this.isConnected = true;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;
        if (type && this.handlers.has(type)) {
          this.handlers.get(type)?.forEach(fn => fn(payload));
        }
      } catch (e) {
        console.error('[WebSocket] Parse error', e);
      }
    };

    this.ws.onclose = () => {
      console.log('[WebSocket] Disconnected');
      this.isConnected = false;
      if (!this.isIntentionalClose) {
        this.reconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Error', error);
      this.isConnected = false;
    };
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached');
      return;
    }
    this.reconnectAttempts++;
    setTimeout(() => {
      console.log(`[WebSocket] Reconnecting... (${this.reconnectAttempts})`);
      this.connect();
    }, Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000)); // Exponential backoff
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)?.add(handler);
  }

  off(type: string, handler: MessageHandler) {
    this.handlers.get(type)?.delete(handler);
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.isIntentionalClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
