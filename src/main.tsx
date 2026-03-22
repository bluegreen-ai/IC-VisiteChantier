import { render } from 'preact';
import { App } from './app';
import { initAuth } from './lib/auth';
import './styles.css';

// Request persistent storage on first launch
navigator.storage?.persist?.();

// Initialize auth before rendering
initAuth();

render(<App />, document.getElementById('app')!);
