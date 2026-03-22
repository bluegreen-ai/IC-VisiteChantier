# OpenClaw WebSocket Protocol Reference

## Connection Flow

```
1. Client opens WebSocket to wss://gateway-url:18789
2. Gateway sends event "connect.challenge" (with nonce)
3. Client sends req "connect" with auth token
4. Gateway responds res "hello-ok"
5. Client can now call chat.send, chat.history, etc.
```

## Message Frame Types

```typescript
// Request (client → gateway)
{ type: "req", id: "unique-id", method: "chat.send", params: { ... } }

// Response (gateway → client)
{ type: "res", id: "unique-id", ok: true, payload: { ... } }

// Event (gateway → client, push)
{ type: "event", event: "chat", payload: { ... } }
```

## Connect Handshake

```typescript
{
  type: "req",
  id: "connect-1",
  method: "connect",
  params: {
    minProtocol: 3,
    maxProtocol: 3,
    client: { id: "betclaw-pwa", version: "1.0.0", platform: "web", mode: "webchat" },
    role: "operator",
    scopes: ["operator.read", "operator.write"],
    caps: [], commands: [], permissions: {},
    auth: { token: "GATEWAY_TOKEN" },
    locale: "fr"
  }
}
```

## Chat Methods

- `chat.send` — { text: string }
- `chat.history` — {}
- `chat.abort` — {}

## Events to Listen

- `connect.challenge` — trigger handshake
- `chat` — new message or streaming update
- `agent` — agent thinking/writing
- `tick` — heartbeat

## Env Vars

```
VITE_OPENCLAW_WS_URL=wss://openclaw.bluegreen.ai/ws
VITE_OPENCLAW_TOKEN=gateway-token
```

## Server Info

- Gateway port: 18789
- Agent ID: betclaw
- Protocol version: 3
- Auth: token-based
