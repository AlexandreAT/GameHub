import { Outlet } from 'react-router-dom'

import classes from './App.module.css';

function App() {

  return (
    <>
    <div>
      <div>
        <Outlet />
      </div>
    </div>
    </>
  )
}

export default App
