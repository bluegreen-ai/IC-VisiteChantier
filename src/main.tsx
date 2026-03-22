import { render } from 'preact';
import { App } from './app';
import { initAuth } from './lib/auth';
import { initSync } from './lib/supabase-sync';
import './styles.css';

async function bootstrap() {
  navigator.storage?.persist?.();
  await initAuth();
  initSync();
  render(<App />, document.getElementById('app')!);
}

bootstrap();
