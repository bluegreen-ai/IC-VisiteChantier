import { useSignal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import { OpenClawClient, type ChatMessage } from '../lib/openclaw-client'
import { session } from '../lib/auth'

// Build WebSocket URL from base URL (https → wss)
const baseUrl = import.meta.env.VITE_OPENCLAW_URL as string | undefined
const wsUrl = baseUrl ? baseUrl.replace(/^https?:/, 'wss:') : undefined
const wsToken = import.meta.env.VITE_OPENCLAW_TOKEN as string | undefined
const sessionKey = (import.meta.env.VITE_OPENCLAW_SESSION as string | undefined) ?? 'agent:main:main'

export function ChatView() {
  const messages = useSignal<ChatMessage[]>([])
  const input = useSignal('')
  const sending = useSignal(false)
  const connected = useSignal(false)
  const agentTyping = useSignal(false)
  const error = useSignal('')
  const clientRef = useRef<OpenClawClient | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.value.length, messages.value[messages.value.length - 1]?.content])

  // Initialize WebSocket client
  useEffect(() => {
    if (!wsUrl || !wsToken) {
      error.value = 'Chat non configuré (VITE_OPENCLAW_URL / VITE_OPENCLAW_TOKEN manquants)'
      return
    }

    const client = new OpenClawClient(wsUrl, wsToken, sessionKey)
    // Pass Supabase JWT so the agent queries data scoped to this user via RLS
    client.setSupabaseToken(session.value?.access_token ?? null)
    clientRef.current = client

    const unsub = client.onEvent((event, payload) => {
      switch (event) {
        case '_connected':
          connected.value = true
          error.value = ''
          break
        case '_disconnected':
          connected.value = false
          break
        case 'chat':
          handleChatEvent(payload)
          break
        case 'agent':
          agentTyping.value = true
          break
      }
    })

    client.connect()

    return () => {
      unsub()
      client.disconnect()
      clientRef.current = null
    }
  }, [])

  function handleChatEvent(payload: Record<string, unknown>) {
    console.log('[OpenClaw] chat event:', JSON.stringify(payload, null, 2))

    // PinchChat chat event format:
    // payload.state: 'delta' | 'final' | 'error' | 'aborted'
    // payload.runId: string
    // payload.message: { id, role, text, thinking, ... }
    const state = payload.state as string | undefined
    const msgData = (payload.message ?? payload) as Record<string, unknown>
    const runId = (payload.runId ?? msgData.id ?? `msg-${Date.now()}`) as string

    // Content can be: string, or array of { type: "text", text: "..." } blocks
    let content = ''
    const rawContent = msgData.content ?? msgData.text
    if (typeof rawContent === 'string') {
      content = rawContent
    } else if (Array.isArray(rawContent)) {
      content = rawContent
        .filter((block: Record<string, unknown>) => block.type === 'text' && typeof block.text === 'string')
        .map((block: Record<string, unknown>) => block.text)
        .join('')
    }

    const role = (msgData.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant'
    const streaming = state === 'delta'

    if (state === 'error') {
      error.value = content || 'Erreur de l\'agent'
      agentTyping.value = false
      return
    }

    if (state === 'aborted') {
      agentTyping.value = false
      // Mark last streaming message as done
      const lastIdx = messages.value.findIndex((m) => m.streaming)
      if (lastIdx >= 0) {
        const updated = [...messages.value]
        updated[lastIdx] = { ...updated[lastIdx], streaming: false }
        messages.value = updated
      }
      return
    }

    agentTyping.value = streaming

    // Find existing message by runId to update streaming content
    const existing = messages.value.findIndex((m) => m.id === runId)
    if (existing >= 0) {
      const updated = [...messages.value]
      updated[existing] = { ...updated[existing], content, streaming }
      messages.value = updated
    } else if (content) {
      messages.value = [
        ...messages.value,
        { id: runId, role, content, timestamp: Date.now(), streaming },
      ]
    }
  }

  async function handleSend(e: Event) {
    e.preventDefault()
    const text = input.value.trim()
    if (!text || sending.value || !clientRef.current?.isConnected) return

    const userMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }
    messages.value = [...messages.value, userMsg]
    input.value = ''
    sending.value = true
    agentTyping.value = true

    try {
      await clientRef.current.sendMessage(text)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur envoi message'
      agentTyping.value = false
    } finally {
      sending.value = false
    }
  }

  if (!wsUrl || !wsToken) {
    return (
      <div class="flex items-center justify-center h-full px-6">
        <div class="text-center text-gray-500">
          <p class="text-lg font-medium">Chat non disponible</p>
          <p class="text-sm mt-2">
            Configurez <code>VITE_OPENCLAW_URL</code> et <code>VITE_OPENCLAW_TOKEN</code> dans .env
          </p>
        </div>
      </div>
    )
  }

  return (
    <div class="flex flex-col h-full">
      {!connected.value && (
        <div class="bg-amber-50 text-amber-700 text-xs px-3 py-1.5 text-center">
          Connexion en cours...
        </div>
      )}

      {error.value && (
        <div class="bg-red-50 text-red-600 text-xs px-3 py-1.5 text-center">
          {error.value}
        </div>
      )}

      <div ref={scrollRef} class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.value.length === 0 && connected.value && (
          <div class="text-center text-gray-400 py-12">
            <p class="text-lg">Bonjour ! Je suis BETClaw.</p>
            <p class="text-sm mt-1">Posez-moi vos questions sur le chantier.</p>
          </div>
        )}

        {messages.value.map((msg) => (
          <div
            key={msg.id}
            class={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              class={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-betc-teal text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-900 rounded-bl-md'
              }`}
            >
              {msg.content}
              {msg.streaming && (
                <span class="inline-block w-1.5 h-4 bg-current opacity-50 animate-pulse ml-0.5 align-text-bottom" />
              )}
            </div>
          </div>
        ))}

        {agentTyping.value && messages.value[messages.value.length - 1]?.role !== 'assistant' && (
          <div class="flex justify-start">
            <div class="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div class="flex gap-1">
                <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms" />
                <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms" />
                <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms" />
              </div>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        class="border-t border-gray-200 px-3 py-2 flex gap-2 bg-white"
      >
        <input
          type="text"
          value={input.value}
          onInput={(e) => (input.value = (e.target as HTMLInputElement).value)}
          placeholder="Votre message..."
          disabled={!connected.value}
          class="flex-1 min-h-[44px] rounded-full border border-gray-300 px-4 py-2 text-base focus:border-betc-teal focus:ring-1 focus:ring-betc-teal touch-manipulation disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.value.trim() || sending.value || !connected.value}
          class="min-h-[44px] min-w-[44px] bg-betc-teal text-white rounded-full flex items-center justify-center touch-manipulation disabled:opacity-50 active:scale-95"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </form>
    </div>
  )
}
