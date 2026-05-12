import { createRoot } from 'react-dom/client';
import './main.scss';
import './i18n';
import App from './App.tsx';

createRoot(document.getElementById('call-root')!).render(<App />);
