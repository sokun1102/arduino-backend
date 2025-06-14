import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import DataTable from './components/DataTable';
import CustomCursor from './components/CustomCursor';

function App() {
  return (
    <div className="App">
      <CustomCursor />
      <header className="App-header">
        <div className="header-content">
          <div className="arduino-icon">⚡</div>
          <div className="title-section">
            <h1>Arduino Sensor Monitor</h1>
            <p className="subtitle">Real-time data visualization and control</p>
          </div>
          <div className="status-indicators">
            <div className="status-item">
              <div className="status-led"></div>
              System Online
            </div>
          </div>
        </div>
      </header>
      
      <nav className="sensor-nav">
        <div className="container">
          <div className="nav-items">
            <div className="nav-item active">
              <div className="nav-icon">📡</div>
              <span>Ultrasonic Sensor</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">⚙️</div>
              <span>Stepper Motor</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">🔌</div>
              <span>Driver Control</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">📊</div>
              <span>Data Monitor</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mt-4">
        <div className="system-overview">
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="sensor-card ultrasonic-card">
                <div className="card-header">
                  <h5>HC-SR05 Ultrasonic</h5>
                  <div className="sensor-status online"></div>
                </div>
                <div className="card-body">
                  <div className="sensor-reading">
                    <span className="reading-value">--</span>
                    <span className="reading-unit">cm</span>
                  </div>
                  <div className="sensor-range">
                    <small>Range: 2-400cm</small>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="sensor-card driver-card">
                <div className="card-header">
                  <h5>ULN2003 Driver</h5>
                  <div className="sensor-status online"></div>
                </div>
                <div className="card-body">
                  <div className="driver-channels">
                    <div className="channel">IN1</div>
                    <div className="channel">IN2</div>
                    <div className="channel">IN3</div>
                    <div className="channel">IN4</div>
                  </div>
                  <div className="voltage-info">
                    <small>5V-12V Operation</small>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="sensor-card motor-card">
                <div className="card-header">
                  <h5>28BYJ-48 Motor</h5>
                  <div className="sensor-status online"></div>
                </div>
                <div className="card-body">
                  <div className="motor-stats">
                    <div className="stat">
                      <span className="stat-label">Steps:</span>
                      <span className="stat-value">0</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">RPM:</span>
                      <span className="stat-value">0</span>
                    </div>
                  </div>
                  <div className="motor-info">
                    <small>5V DC | 2048 steps/rev</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="data-section">
          <div className="section-header">
            <h3>Sensor Data & Control</h3>
            <div className="section-controls">
              <button className="btn btn-primary btn-sm">
                <span className="btn-icon">▶️</span>
                Start Monitoring
              </button>
              <button className="btn btn-secondary btn-sm">
                <span className="btn-icon">⏸️</span>
                Pause
              </button>
            </div>
          </div>
          <DataTable />
        </div>
      </main>
      
      <footer className="app-footer">
        <div className="container">
          <div className="footer-content">
            <div className="connection-status">
              <div className="connection-dot connected"></div>
              Connected to Arduino
            </div>
            <div>© 2024 Arduino Sensor Monitor</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App