import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ResearchPage } from './components/ResearchPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {new URLSearchParams(location.search).get('view') === 'research' ? <ResearchPage /> : <App />}
  </StrictMode>,
)
