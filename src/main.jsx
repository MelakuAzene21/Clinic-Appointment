import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import {BrowserRouter} from 'react-router-dom'
import AppContextProvider from './context/AppContext.jsx'
import { ChatProvider } from './context/ChatContext.jsx'


createRoot(document.getElementById('root')).render(
<BrowserRouter>
<AppContextProvider>
<ChatProvider>
<App />
</ChatProvider>
</AppContextProvider>
</BrowserRouter>

  
)
