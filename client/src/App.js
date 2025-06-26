import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import DataTable from './components/DataTable';
import CustomCursor from './components/CustomCursor';
import ModeSelector from './components/ModeSelector';
import ManualControl from './components/ManualControl';
import ScheduleManager from './components/ScheduleManager';
import axios from 'axios';
import { FaMicrochip, FaCheckCircle, FaCloud, FaRegLightbulb } from 'react-icons/fa';

function App() {
  const [mode, setMode] = useState('AUTO');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    fetchMode();
  }, []);

  const fetchMode = async () => {
    try {
      const res = await axios.get('http://localhost:1234/mode');
      setMode(res.data.mode || 'AUTO');
    } catch (err) {
      setMode('AUTO');
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setToastMsg(`Chuyển sang chế độ ${newMode}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1800);
  };

  return (
    <div className="App">
      <CustomCursor />
      <header className="App-header fade-in">
        <div className="header-content">
          <div className="title-section">
            <span className="icon-glow"><FaMicrochip size={38} /></span>
            <h1 className="glow-title">Arduino IoT Dashboard</h1>
            <p className="subtitle">Giám sát & điều khiển thiết bị IoT thực tế</p>
          </div>
          <div className="status-indicators">
            {/* <span className="status-dot online status-animate"></span> */}
            <span className="status-text"><FaCheckCircle style={{marginRight:4}}/>Hệ thống hoạt động</span>
          </div>
        </div>
      </header>

      <main className="container mt-4">
        <section className="controls-section mb-4 fade-in-up">
          <ModeSelector currentMode={mode} onModeChange={handleModeChange} />
          {mode === 'MANUAL' && <ManualControl />}
          {mode === 'SCHEDULE' && <ScheduleManager />}
        </section>
        <section className="data-section fade-in-up">
          <h3 className="section-title"><FaCloud style={{marginRight:8}}/>Dữ liệu cảm biến & nhật ký hệ thống</h3>
          <DataTable />
        </section>
      </main>

      <footer className="app-footer fade-in">
        <div className="container">
          <div className="footer-content">
            <span><FaRegLightbulb style={{marginRight:6}}/>© 2024 Arduino IoT Dashboard</span>
            <span className="footer-status">Kết nối: <span className="footer-dot connected"></span> Backend</span>
          </div>
        </div>
      </footer>

      {showToast && (
        <div className="custom-toast">{toastMsg}</div>
      )}
    </div>
  );
}

export default App;