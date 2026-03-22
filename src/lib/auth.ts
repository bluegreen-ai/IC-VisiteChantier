import { signal } from '@preact/signals'
import { supabase } from './supabase'
import type { Session, User } from '@supabase/supabase-js'

export const session = signal<Session | null>(null)
export const user = signal<User | null>(null)
export const authLoading = signal(true)

export async function initAuth() {
  const { data } = await supabase.auth.getSession()
  session.value = data.session
  user.value = data.session?.user ?? null
  authLoading.value = false

  supabase.auth.onAuthStateChange((_event, newSession) => {
    session.value = newSession
    user.value = newSession?.user ?? null
  })
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
