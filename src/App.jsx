import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './pages/Home.jsx';
import Yukata from './pages/Yukata.jsx';
import Furisode from './pages/Furisode.jsx';
import Preview from './pages/Preview.jsx';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/yukata' element={<Yukata />} />
        <Route path='/furisode' element={<Furisode />} />
        <Route path='/preview' element={<Preview />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App