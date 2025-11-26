import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const el = document.getElementById('root');
if (!el) {
  console.error('Elemento raiz #root não encontrado no index.html');
} else {
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}