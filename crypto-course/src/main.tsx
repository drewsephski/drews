import './styles/tailwind.css'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

import * as React from 'react'

// ... rest of the code remains the same ...
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
