import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';

const SearchBar = ({ onSearch }) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSearch = () => {
    if (!startTime || !endTime) {
      alert('Please provide both start and end timestamps.');
      return;
    }
    onSearch(startTime, endTime);
  };

  return (
    <div className="search-bar mb-4">
      <div className="row">
        <div className="col-md-4">
          <input
            type="datetime-local"
            className="form-control"
            placeholder="Start Time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <input
            type="datetime-local"
            className="form-control"
            placeholder="End Time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <Button variant="primary" onClick={handleSearch}>
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
