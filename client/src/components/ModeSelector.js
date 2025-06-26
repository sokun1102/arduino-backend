import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import { FaRobot, FaHandPaper, FaRegClock } from 'react-icons/fa';

const MODES = [
  { value: 'AUTO', label: 'Tự động', icon: <FaRobot />, desc: 'Thiết bị tự động vận hành theo cảm biến.' },
  { value: 'MANUAL', label: 'Thủ công', icon: <FaHandPaper />, desc: 'Bạn điều khiển thiết bị bằng tay.' },
  { value: 'SCHEDULE', label: 'Định thời', icon: <FaRegClock />, desc: 'Thiết bị hoạt động theo lịch trình.' },
];

const ModeSelector = ({ currentMode, onModeChange }) => {
  const [mode, setMode] = useState(currentMode || 'AUTO');
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    setMode(currentMode);
  }, [currentMode]);

  const handleChange = async (newMode) => {
    setMode(newMode);
    try {
      await axios.post(`${API_BASE_URL}/mode`, { mode: newMode });
      if (onModeChange) onModeChange(newMode);
    } catch (err) {
      alert('Lỗi khi đổi chế độ!');
    }
  };

  const getDesc = () => {
    const found = MODES.find(m => m.value === (hovered || mode));
    return found ? found.desc : '';
  };

  return (
    <div className="mode-selector mb-3 p-3 shadow rounded bg-white d-inline-block animate__animated animate__fadeInDown" style={{minWidth: 320}}>
      <div className="fw-bold text-primary mb-2" style={{fontSize: '1.1rem', letterSpacing: 1}}>Chọn chế độ hoạt động</div>
      <div className="btn-group w-100" role="group">
        {MODES.map(m => (
          <button
            key={m.value}
            className={`btn btn-lg fw-bold px-3 py-2 d-flex align-items-center justify-content-center flex-grow-1 ${mode === m.value ? 'btn-primary' : 'btn-outline-primary'}`}
            style={{borderRadius: 18, marginRight: 8, minWidth: 90, boxShadow: mode === m.value ? '0 2px 8px rgba(0,0,0,0.09)' : 'none', transition: 'box-shadow 0.2s'}}
            onClick={() => handleChange(m.value)}
            onMouseEnter={() => setHovered(m.value)}
            onMouseLeave={() => setHovered(null)}
            type="button"
          >
            <span className="me-2" style={{fontSize: '1.2rem'}}>{m.icon}</span>
            {m.label}
            {mode === m.value && <span className="badge bg-light text-primary ms-2">Đang chọn</span>}
          </button>
        ))}
      </div>
      <div className="mt-3 text-secondary" style={{minHeight: 24, fontSize: '1rem'}}>{getDesc()}</div>
    </div>
  );
};

export default ModeSelector; 