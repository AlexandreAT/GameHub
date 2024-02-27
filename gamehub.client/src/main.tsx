import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Importações
import { createBrowserRouter, RouterProvider, Route } from 'react-router-dom'

// Componentes
import Login from './routes/Login.tsx'
import Register from './routes/Register.tsx'
import ForgotPassword from './routes/ForgotPassword.tsx'
import TermsOfCondition from './routes/TermsOfCondition.tsx'


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Login/>,
      },
      {
        path: "/register",
        element: <Register/>,
      },
      {
        path: "/forgotPassword",
        element: <ForgotPassword/>,
      },
      {
        path: "/termsOfCondition",
        element: <TermsOfCondition/>,
      }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>,
)
