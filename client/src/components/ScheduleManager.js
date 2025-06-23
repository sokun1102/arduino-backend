import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';

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
    <div className="schedule-manager mb-3">
      <form className="row g-3 align-items-end" onSubmit={handleAddSchedule}>
        <div className="col-md-4">
          <label className="form-label">Bật lúc</label>
          <input 
            type="datetime-local" 
            className="form-control" 
            value={onDateTime} 
            onChange={e => setOnDateTime(e.target.value)} 
            required 
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Tắt lúc</label>
          <input 
            type="datetime-local" 
            className="form-control" 
            value={offDateTime} 
            onChange={e => setOffDateTime(e.target.value)} 
            required 
          />
        </div>
        <div className="col-auto">
          <button className="btn btn-primary" type="submit" disabled={loading}>Thêm lịch</button>
        </div>
      </form>
      <div className="mt-3">
        <h6>Danh sách lịch đã đặt:</h6>
        <ul className="list-group">
          {schedules.length === 0 && <li className="list-group-item">Chưa có lịch nào</li>}
          {schedules.map((sch, idx) => (
            <li className="list-group-item d-flex justify-content-between align-items-center" key={idx}>
              <span>
                Bật: <b>{formatDateTime(sch.on)}</b> - Tắt: <b>{formatDateTime(sch.off)}</b>
              </span>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(idx)} disabled={loading}>Xóa</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ScheduleManager;