import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import { FaCalendarAlt, FaPlus, FaTrash } from 'react-icons/fa';

const ScheduleManager = () => {
  const [schedules, setSchedules] = useState([]);
  const [onDateTime, setOnDateTime] = useState('');
  const [offDateTime, setOffDateTime] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/schedule`);
      setSchedules(res.data.schedule || []);
    } catch (err) {
      setSchedules([]);
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    const newSchedules = [...schedules, { on: onDateTime, off: offDateTime }];
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/schedule`, { schedule: newSchedules });
      setSchedules(newSchedules);
      setOnDateTime('');
      setOffDateTime('');
    } catch (err) {
      alert('Lỗi khi lưu lịch!');
    }
    setLoading(false);
  };

  const handleDelete = async (idx) => {
    const newSchedules = schedules.filter((_, i) => i !== idx);
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/schedule`, { schedule: newSchedules });
      setSchedules(newSchedules);
    } catch (err) {
      alert('Lỗi khi xóa lịch!');
    }
    setLoading(false);
  };

  // Hàm định dạng hiển thị datetime
  const formatDateTime = (datetimeStr) => {
    if (!datetimeStr) return '';
    const date = new Date(datetimeStr);
    return date.toLocaleString('vi-VN');
  };

  return (
    <div className="schedule-manager mb-3 p-3 shadow rounded bg-white animate__animated animate__fadeInDown" style={{maxWidth: 520}}>
      <div className="fw-bold text-primary mb-2 d-flex align-items-center gap-2" style={{fontSize: '1.1rem', letterSpacing: 1}}>
        <FaCalendarAlt size={22} className="text-primary" />
        Quản lý lịch trình
      </div>
      <form className="row g-3 align-items-end" onSubmit={handleAddSchedule}>
        <div className="col-md-5">
          <label className="form-label fw-bold text-primary">Bật lúc</label>
          <input
            type="datetime-local"
            className="form-control"
            value={onDateTime}
            onChange={e => setOnDateTime(e.target.value)}
            required
            style={{borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)'}}
          />
        </div>
        <div className="col-md-5">
          <label className="form-label fw-bold text-primary">Tắt lúc</label>
          <input
            type="datetime-local"
            className="form-control"
            value={offDateTime}
            onChange={e => setOffDateTime(e.target.value)}
            required
            style={{borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)'}}
          />
        </div>
        <div className="col-auto">
          <button className="btn btn-primary fw-bold d-flex align-items-center px-4 py-2" type="submit" disabled={loading} style={{borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.07)'}}>
            <FaPlus className="me-1" /> Thêm lịch
          </button>
        </div>
      </form>
      <div className="mt-3">
        <h6 className="fw-bold text-secondary mb-2">Danh sách lịch đã đặt:</h6>
        <ul className="list-group">
          {schedules.length === 0 && <li className="list-group-item">Chưa có lịch nào</li>}
          {schedules.map((sch, idx) => (
            <li className="list-group-item d-flex justify-content-between align-items-center animate__animated animate__fadeInUp" key={idx} style={{borderRadius: 12, marginBottom: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.04)'}}>
              <span>
                <span className="badge bg-info text-dark me-2" style={{fontSize: '1rem', borderRadius: 8}}>Bật: {formatDateTime(sch.on)}</span>
                <span className="badge bg-secondary me-2" style={{fontSize: '1rem', borderRadius: 8}}>Tắt: {formatDateTime(sch.off)}</span>
              </span>
              <button className="btn btn-sm btn-danger d-flex align-items-center px-3 py-1" onClick={() => handleDelete(idx)} disabled={loading} style={{borderRadius: 14}}>
                <FaTrash className="me-1" /> Xóa
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ScheduleManager;