export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  streaming?: boolean
}

type EventHandler = (event: string, payload: Record<string, unknown>) => void

export class OpenClawClient {
  private ws: WebSocket | null = null
  private pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>()
  private eventHandlers: EventHandler[] = []
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private _connected = false
  private idCounter = 0
  private supabaseAccessToken: string | null = null

  constructor(
    private wsUrl: string,
    private authToken: string,
    private sessionKey: string = 'agent:main:main',
  ) {}

  /**
   * Set the Supabase access token for RLS-scoped queries.
   * Sent as a silent system message after WebSocket connect.
   * MVP approach — to be replaced by Edge Function proxy (see PRD Passe 11).
   */
  setSupabaseToken(token: string | null) {
    this.supabaseAccessToken = token
  }

  connect() {
    if (this.ws) return

    console.log('[OpenClaw] Connecting to', this.wsUrl)
    this.ws = new WebSocket(this.wsUrl)

    this.ws.onopen = () => {
      console.log('[OpenClaw] WebSocket open, waiting for challenge...')
      this.reconnectAttempts = 0
    }

    this.ws.onmessage = (ev) => {
      let msg: Record<string, unknown>
      try {
        msg = JSON.parse(ev.data as string)
      } catch {
        return
      }

      console.log('[OpenClaw] ←', msg.type, msg.type === 'event' ? msg.event : msg.id)

      if (msg.type === 'event' && msg.event === 'connect.challenge') {
        this.handleChallenge()
      } else if (msg.type === 'event') {
        this.eventHandlers.forEach((h) => h(msg.event as string, (msg.payload ?? {}) as Record<string, unknown>))
      } else if (msg.type === 'res' && msg.id) {
        const p = this.pending.get(msg.id as string)
        if (p) {
          this.pending.delete(msg.id as string)
          if (msg.ok) {
            p.resolve(msg.payload)
          } else {
            console.error('[OpenClaw] Request failed:', msg.id, msg.payload || msg.error)
            p.reject(msg.payload || msg.error || new Error('Request failed'))
          }
        }
      }
    }

    this.ws.onerror = (err) => {
      console.error('[OpenClaw] WebSocket error:', err)
    }

    this.ws.onclose = (ev) => {
      console.log('[OpenClaw] WebSocket closed:', ev.code, ev.reason)
      this._connected = false
      this.ws = null
      this.eventHandlers.forEach((h) => h('_disconnected', {}))
      this.scheduleReconnect()
    }
  }

  private async handleChallenge() {
    console.log('[OpenClaw] Challenge received, sending connect...')
    try {
      await this.request('connect', {
        minProtocol: 3,
        maxProtocol: 3,
        client: { id: 'webchat', version: '1.0.0', platform: 'web', mode: 'webchat' },
        role: 'operator',
        scopes: ['operator.read', 'operator.write', 'operator.admin'],
        caps: [],
        commands: [],
        permissions: {},
        auth: { token: this.authToken },
        locale: navigator.language || 'fr',
        userAgent: 'betclaw-pwa/1.0.0',
      })
      console.log('[OpenClaw] Connected!')
      this._connected = true

      // Send Supabase JWT as a silent system message so the agent can query as this user
      if (this.supabaseAccessToken) {
        await this.sendMessage(`[system:supabase_auth:${this.supabaseAccessToken}]`)
      }

      this.eventHandlers.forEach((h) => h('_connected', {}))
    } catch (err) {
      console.error('[OpenClaw] Connect failed:', err)
      this.disconnect()
    }
  }

  request(method: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'))
        return
      }
      const id = `${method}-${++this.idCounter}-${Date.now()}`
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ type: 'req', id, method, params }))

      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id)
          reject(new Error('Request timeout'))
        }
      }, 30000)
    })
  }

  async sendMessage(text: string) {
    return this.request('chat.send', {
      sessionKey: this.sessionKey,
      message: text,
      deliver: false,
      idempotencyKey: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    })
  }

  async getHistory() {
    return this.request('chat.history', {
      sessionKey: this.sessionKey,
      limit: 100,
    })
  }

  async abort() {
    return this.request('chat.abort', {
      sessionKey: this.sessionKey,
    })
  }

  onEvent(handler: EventHandler) {
    this.eventHandlers.push(handler)
    return () => {
      this.eventHandlers = this.eventHandlers.filter((h) => h !== handler)
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    this.reconnectAttempts++
    console.log(`[OpenClaw] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.ws?.close()
    this.ws = null
    this._connected = false
  }

  get isConnected() {
    return this._connected
  }
}
