import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './AuthContext.jsx'
import { DemoProvider } from './DemoContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <DemoProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </DemoProvider>
    </BrowserRouter>
  </StrictMode>,
)
