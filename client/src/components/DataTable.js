import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Badge from 'react-bootstrap/Badge';
import './DataTable.css';
import { API_BASE_URL } from '../apiConfig';

const DataTable = () => {
  const [data, setData] = useState([]); // Dữ liệu từ backend
  const [loading, setLoading] = useState(false); // Trạng thái tải dữ liệu
  const [searchStart, setSearchStart] = useState(''); // Tìm kiếm bắt đầu
  const [searchEnd, setSearchEnd] = useState(''); // Tìm kiếm kết thúc
  const [error, setError] = useState(''); // Trạng thái lỗi
  const [lastUpdate, setLastUpdate] = useState(null); // Thời gian cập nhật cuối
  const [autoRefresh, setAutoRefresh] = useState(false); // Tự động làm mới
  const [totalRecords, setTotalRecords] = useState(0); // Tổng số bản ghi

  // Gọi API để lấy toàn bộ dữ liệu
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/data`);
      setData(response.data);
      setTotalRecords(response.data.length);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data from Arduino system. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  // Gọi API tìm kiếm dữ liệu theo khoảng thời gian
  const handleSearch = async () => {
    if (!searchStart || !searchEnd) {
      setError('Please provide both start and end timestamps.');
      return;
    }

    // Kiểm tra logic thời gian
    if (new Date(searchStart) >= new Date(searchEnd)) {
      setError('Start time must be before end time.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/search`, {
        params: {
          start: searchStart,
          end: searchEnd,
        },
      });
      setData(response.data);
      setTotalRecords(response.data.length);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error searching data:', error);
      setError('Error fetching search results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset tìm kiếm và lấy toàn bộ dữ liệu
  const handleReset = () => {
    setSearchStart('');
    setSearchEnd('');
    setError('');
    fetchData();
  };

  // Xuất dữ liệu ra CSV
  const exportToCSV = () => {
    if (data.length === 0) {
      setError('No data to export.');
      return;
    }

    const csvContent = [
      ['ID', 'Distance (cm)', 'Motor Status', 'Mode', 'Manual Status', 'Schedule Info', 'Timestamp'],
      ...data.map(row => [
        row.id,
        row.distance,
        row.motor_status,
        row.mode || '',
        row.manual_status || '',
        row.schedule_info || '',
        new Date(row.timestamp).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arduino_sensor_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Định dạng trạng thái motor
  const formatMotorStatus = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'on') {
      return <Badge bg="success" className="motor-badge">🔓 MỞ</Badge>;
    } else if (statusLower === 'off') {
      return <Badge bg="secondary" className="motor-badge">🔒 ĐÓNG</Badge>;
    } else {
      return <Badge bg="warning" className="motor-badge">⚠️ {status}</Badge>;
    }
  };

  // Định dạng chế độ làm việc
  const formatMode = (mode) => {
    if (!mode) return null;
    
    switch(mode.toUpperCase()) {
      case 'AUTO':
        return <Badge bg="primary" className="mode-badge">🤖 TỰ ĐỘNG</Badge>;
      case 'MANUAL':
        return <Badge bg="warning" className="mode-badge">👐 THỦ CÔNG</Badge>;
      case 'SCHEDULE':
        return <Badge bg="info" className="mode-badge">⏰ LỊCH TRÌNH</Badge>;
      default:
        return <Badge bg="secondary" className="mode-badge">{mode}</Badge>;
    }
  };

  // Định dạng trạng thái thủ công
  const formatManualStatus = (status) => {
    if (!status) return null;
    
    if (status.toUpperCase() === 'ON') {
      return <Badge bg="success" className="manual-badge">BẬT</Badge>;
    } else {
      return <Badge bg="danger" className="manual-badge">TẮT</Badge>;
    }
  };

  // Định dạng thông tin lịch trình
  const formatScheduleInfo = (info) => {
    if (!info) return <span className="no-schedule">Không có lịch</span>;
    return (
      <div className="schedule-info">
        {info.split('|').map((schedule, index) => (
          <Badge key={index} bg="info" className="schedule-badge">
            {schedule.trim()}
          </Badge>
        ))}
      </div>
    );
  };

  // Định dạng khoảng cách với màu sắc theo mức độ
  const formatDistance = (distance) => {
    const dist = parseFloat(distance);
    let className = 'distance-normal';
    let icon = '📏';
    
    if (dist < 10) {
      className = 'distance-close';
      icon = '🔴';
    } else if (dist < 30) {
      className = 'distance-medium';
      icon = '🟡';
    } else {
      className = 'distance-far';
      icon = '🟢';
    }

    return (
      <span className={`distance-value ${className}`}>
        {icon} {dist} cm
      </span>
    );
  };

  // Auto refresh
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchData();
      }, 5000); // Refresh mỗi 5 giây
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Lấy dữ liệu khi component được render
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="datatable-container">
      {/* Header Section */}
      <div className="datatable-header">
        <div className="header-left">
          <h3 className="section-title">
            <span className="title-icon">📊</span>
            Sensor Data Logs
          </h3>
          <div className="data-stats">
            <span className="stat-item">
              <strong>{totalRecords}</strong> records
            </span>
            {lastUpdate && (
              <span className="stat-item">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="header-right">
          <div className="auto-refresh-toggle">
            <label className="refresh-label">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <span className="refresh-text">
                🔄 Auto Refresh (5s)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-card">
          <div className="search-header">
            <h5>🔍 Time Range Filter</h5>
          </div>
          <div className="search-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Start Time</label>
                <input
                  type="datetime-local"
                  className="form-control search-input"
                  value={searchStart}
                  onChange={(e) => setSearchStart(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">End Time</label>
                <input
                  type="datetime-local"
                  className="form-control search-input"
                  value={searchEnd}
                  onChange={(e) => setSearchEnd(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">&nbsp;</label>
                <div className="search-buttons">
                  <Button 
                    variant="primary" 
                    onClick={handleSearch}
                    disabled={loading}
                    className="search-btn"
                  >
                    🔍 Search
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleReset}
                    disabled={loading}
                    className="reset-btn"
                  >
                    🔄 Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <strong>⚠️ Error:</strong> {error}
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="action-section">
        <div className="action-buttons">
          <Button 
            variant="success" 
            onClick={fetchData}
            disabled={loading}
            className="action-btn"
          >
            {loading ? <Spinner size="sm" /> : '🔄'} Refresh Data
          </Button>
          <Button 
            variant="info" 
            onClick={exportToCSV}
            disabled={data.length === 0}
            className="action-btn"
          >
            📥 Export CSV
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-section">
        {loading && !autoRefresh ? (
          <div className="loading-container">
            <Spinner animation="border" variant="primary" />
            <p className="loading-text">Loading Arduino sensor data...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table className="data-table">
              <thead className="table-header">
                <tr>
                  <th className="th-id">
                    <span className="header-icon">🆔</span>
                    ID
                  </th>
                  <th className="th-distance">
                    <span className="header-icon">📏</span>
                    Distance
                  </th>
                  <th className="th-motor">
                    <span className="header-icon">⚙️</span>
                    Motor Status
                  </th>
                  <th className="th-mode">
                    <span className="header-icon">🔄</span>
                    Mode
                  </th>
                  <th className="th-schedule">
                    <span className="header-icon">📅</span>
                    Schedule
                  </th>
                  <th className="th-timestamp">
                    <span className="header-icon">🕐</span>
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((row, index) => (
                    <tr key={row.id} className={`table-row ${index % 2 === 0 ? 'row-even' : 'row-odd'}`}>
                      <td className="td-id">
                        <span className="id-badge">#{row.id}</span>
                      </td>
                      <td className="td-distance">
                        {formatDistance(row.distance)}
                      </td>
                      <td className="td-motor">
                        {formatMotorStatus(row.motor_status)}
                      </td>
                      <td className="td-mode">
                        {formatMode(row.mode)}
                      </td>
                      <td className="td-schedule">
                        {formatScheduleInfo(row.schedule_info)}
                      </td>
                      <td className="td-timestamp">
                        <span className="timestamp-value">
                          📅 {new Date(row.timestamp).toLocaleDateString()}
                          <br />
                          🕐 {new Date(row.timestamp).toLocaleTimeString()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-data">
                      <div className="no-data-content">
                        <span className="no-data-icon">📭</span>
                        <p>No sensor data found.</p>
                        <small>Try adjusting your search criteria or refresh the data.</small>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      {/* Auto refresh indicator */}
      {autoRefresh && (
        <div className="refresh-indicator">
          <Spinner size="sm" animation="border" />
          <span>Auto-refreshing every 5 seconds...</span>
        </div>
      )}
    </div>
  );
};

export default DataTable;