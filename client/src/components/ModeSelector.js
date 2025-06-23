import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';

const ModeSelector = ({ currentMode, onModeChange }) => {
  const [mode, setMode] = useState(currentMode || 'AUTO');

  useEffect(() => {
    setMode(currentMode);
  }, [currentMode]);

  const handleChange = async (e) => {
    const newMode = e.target.value;
    setMode(newMode);
    try {
      await axios.post(`${API_BASE_URL}/mode`, { mode: newMode });
      if (onModeChange) onModeChange(newMode);
    } catch (err) {
      alert('Lỗi khi đổi chế độ!');
    }
  };

  return (
    <div className="mode-selector mb-3">
      <label className="form-label me-2">Chế độ:</label>
      <select className="form-select d-inline w-auto" value={mode} onChange={handleChange}>
        <option value="AUTO">Tự động</option>
        <option value="MANUAL">Thủ công</option>
        <option value="SCHEDULE">Định thời</option>
      </select>
    </div>
  );
};

export default ModeSelector; 