import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Import Bootstrap CSS globally
import 'bootstrap/dist/css/bootstrap.min.css'
import 'animate.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
