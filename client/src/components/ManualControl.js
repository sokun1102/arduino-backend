import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import { FaPowerOff, FaBolt } from 'react-icons/fa';

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
    <div className="manual-control mb-3 p-3 shadow rounded bg-white d-inline-block animate__animated animate__fadeInDown" style={{minWidth: 260}}>
      <div className="fw-bold text-primary mb-2" style={{fontSize: '1.1rem', letterSpacing: 1}}>Điều khiển thủ công</div>
      <div className="d-flex align-items-center gap-3">
        <button
          className={`btn btn-lg fw-bold px-4 py-2 ${status === 'ON' ? 'btn-danger' : 'btn-success'}`}
          onClick={handleToggle}
          disabled={loading}
          style={{borderRadius: 20, fontSize: '1.05rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)'}}
        >
          {status === 'ON' ? <FaPowerOff className="me-2" /> : <FaBolt className="me-2" />}
          {status === 'ON' ? 'Tắt động cơ' : 'Bật động cơ'}
        </button>
        <span className={`badge fs-6 ${status === 'ON' ? 'bg-danger' : 'bg-success'} ms-2`} style={{borderRadius: 12, letterSpacing: 1}}>
          {status === 'ON' ? 'ĐANG BẬT' : 'ĐANG TẮT'}
        </span>
      </div>
    </div>
  );
};

export default ManualControl; 