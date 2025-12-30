/**
 * WebSocket client for real-time video streaming
 */

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export interface StreamStats {
  frames_processed: number;
  fps: number;
  has_target_face: boolean;
}

export type StreamEvent =
  | { type: 'connected' }
  | { type: 'disconnected' }
  | { type: 'frame'; data: Blob }
  | { type: 'stats'; stats: StreamStats }
  | { type: 'face_set'; success: boolean }
  | { type: 'error'; error: Error };

export type StreamEventHandler = (event: StreamEvent) => void;

/**
 * WebSocket stream client for real-time video processing
 */
export class StreamClient {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private eventHandlers: Set<StreamEventHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || crypto.randomUUID();
  }

  /**
   * Connect to the streaming server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${WS_BASE}/ws/stream?session_id=${this.sessionId}`;
      this.ws = new WebSocket(url);

      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.emit({ type: 'connected' });
        resolve();
      };

      this.ws.onclose = () => {
        this.emit({ type: 'disconnected' });
        this.attemptReconnect();
      };

      this.ws.onerror = () => {
        const error = new Error('WebSocket error');
        this.emit({ type: 'error', error });
        reject(error);
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event);
      };
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send a frame for processing
   */
  sendFrame(frameData: ArrayBuffer | Blob): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    if (frameData instanceof Blob) {
      frameData.arrayBuffer().then((buffer) => {
        this.ws?.send(buffer);
      });
    } else {
      this.ws.send(frameData);
    }
  }

  /**
   * Set the target face for face swapping
   */
  async setTargetFace(imageBlob: Blob): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected');
    }

    const buffer = await imageBlob.arrayBuffer();
    const prefix = new TextEncoder().encode('FACE');
    const combined = new Uint8Array(prefix.length + buffer.byteLength);
    combined.set(prefix, 0);
    combined.set(new Uint8Array(buffer), prefix.length);

    this.ws.send(combined.buffer);
  }

  /**
   * Request current stats
   */
  requestStats(): void {
    this.sendCommand('stats');
  }

  /**
   * Send ping for keepalive
   */
  ping(): void {
    this.sendCommand('ping');
  }

  /**
   * Subscribe to stream events
   */
  on(handler: StreamEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  /**
   * Get connection state
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get session ID
   */
  get session(): string {
    return this.sessionId;
  }

  private sendCommand(command: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.ws.send(JSON.stringify({ command }));
  }

  private handleMessage(event: MessageEvent): void {
    if (event.data instanceof ArrayBuffer) {
      // Binary data - processed frame
      const blob = new Blob([event.data], { type: 'image/jpeg' });
      this.emit({ type: 'frame', data: blob });
    } else if (typeof event.data === 'string') {
      // JSON response
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'stats') {
          this.emit({
            type: 'stats',
            stats: {
              frames_processed: data.frames_processed,
              fps: data.fps,
              has_target_face: data.has_target_face,
            },
          });
        } else if (data.type === 'face_set') {
          this.emit({ type: 'face_set', success: data.success });
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    }
  }

  private emit(event: StreamEvent): void {
    this.eventHandlers.forEach((handler) => handler(event));
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      this.connect().catch(() => {
        // Will trigger another reconnect via onclose
      });
    }, delay);
  }
}

/**
 * Create a new stream client
 */
export function createStreamClient(sessionId?: string): StreamClient {
  return new StreamClient(sessionId);
}
