import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter as Router } from 'react-router-dom'
import './index.css'
import './i18n.js'
import App from './App.jsx'
import { TranslationProvider } from './context/TranslationContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <TranslationProvider>
        <App />
      </TranslationProvider>
    </Router>
  </StrictMode>
)
