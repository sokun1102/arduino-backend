import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';

const ManualControl = () => {
  const [status, setStatus] = useState('OFF');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/manual`);
      setStatus(res.data.status);
    } catch (err) {
      setStatus('OFF');
    }
  };

  const handleToggle = async () => {
    setLoading(true);
    const newStatus = status === 'ON' ? 'OFF' : 'ON';
    try {
      await axios.post(`${API_BASE_URL}/manual`, { status: newStatus });
      setStatus(newStatus);
    } catch (err) {
      alert('Lỗi khi gửi lệnh!');
    }
    setLoading(false);
  };

  return (
    <div className="manual-control mb-3">
      <button className={`btn btn-${status === 'ON' ? 'danger' : 'success'}`} onClick={handleToggle} disabled={loading}>
        {status === 'ON' ? 'Tắt động cơ' : 'Bật động cơ'}
      </button>
      <span className="ms-3">Trạng thái: <b>{status}</b></span>
    </div>
  );
};

export default ManualControl; 