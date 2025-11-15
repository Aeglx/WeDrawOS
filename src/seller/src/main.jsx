import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import App from './App'
import './global.css'

    <BrowserRouter>
      <App />
    </BrowserRouter>
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <ConfigProvider theme={{ token: { fontSize: 12 } }}>
      <App />
    </ConfigProvider>
  </BrowserRouter>
)