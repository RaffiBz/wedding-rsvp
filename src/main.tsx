import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles/global.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

createRoot(rootEl).render(
  <StrictMode>
    {/*
      HashRouter so every route is a #-fragment of the same index.html. On
      GitHub Pages that means tokenized links (…/#/rsvp?t=…) return HTTP 200
      (the crawler hits …/wedding-rsvp/ → 200 with OG tags) instead of the 404
      a real path would get. The repo subpath stays in the real pathname, so no
      basename is needed here. Old non-hash links are bridged by 404.html.
    */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)
