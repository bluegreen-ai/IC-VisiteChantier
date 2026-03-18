import { render } from 'preact';
import { App } from './app';
import './styles.css';

// Request persistent storage on first launch
navigator.storage?.persist?.();

render(<App />, document.getElementById('app')!);
