import { useSignal } from '@preact/signals'
import { signIn } from '../lib/auth'

export function LoginScreen() {
  const email = useSignal('')
  const password = useSignal('')
  const error = useSignal('')
  const loading = useSignal(false)

  async function handleSubmit(e: Event) {
    e.preventDefault()
    error.value = ''
    loading.value = true

    try {
      await signIn(email.value, password.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur de connexion'
    } finally {
      loading.value = false
    }
  }

  return (
    <div class="h-dvh flex items-center justify-center bg-gray-50 px-6">
      <div class="w-full max-w-sm">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-betc-teal">BETClaw</h1>
          <p class="text-gray-500 mt-2">Assistant terrain pour ingénieurs BET</p>
        </div>

        <form onSubmit={handleSubmit} class="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <label class="block">
            <span class="text-sm font-medium text-gray-700">Email</span>
            <input
              type="email"
              value={email.value}
              onInput={(e) => (email.value = (e.target as HTMLInputElement).value)}
              placeholder="renaud@bluegreen.ai"
              required
              class="mt-1 block w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-betc-teal focus:ring-1 focus:ring-betc-teal touch-manipulation"
            />
          </label>

          <label class="block">
            <span class="text-sm font-medium text-gray-700">Mot de passe</span>
            <input
              type="password"
              value={password.value}
              onInput={(e) => (password.value = (e.target as HTMLInputElement).value)}
              required
              class="mt-1 block w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-betc-teal focus:ring-1 focus:ring-betc-teal touch-manipulation"
            />
          </label>

          {error.value && (
            <p class="text-red-600 text-sm font-medium">{error.value}</p>
          )}

          <button
            type="submit"
            disabled={loading.value}
            class="w-full min-h-[48px] bg-betc-teal text-white font-medium rounded-lg px-4 py-3 active:scale-95 touch-manipulation disabled:opacity-50"
          >
            {loading.value ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
