const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Kết nối MySQL
const db = mysql.createConnection({
    host: "localhost",
    port: "3306",
    user: "root",
    password: "110204",
    database: "arduino_logs"
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL');
    
    // Kiểm tra và tạo bảng logs nếu chưa tồn tại
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        distance FLOAT NOT NULL,
        motor_status VARCHAR(10) NOT NULL,
        manual_status VARCHAR(10) NULL,
        mode VARCHAR(20) NULL,
        schedule_info TEXT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`;
    
    db.query(createTableSQL, (err) => {
        if (err) {
            console.error('Error creating logs table:', err);
        } else {
            console.log('Logs table ready');
        }
    });
});

// ====== Biến toàn cục cho manual/mode/schedule ======
let manualStatus = "OFF"; // "ON" hoặc "OFF"
let currentMode = "AUTO"; // "AUTO", "MANUAL", "SCHEDULE"
let schedules = []; // [{on: "HH:mm", off: "HH:mm"}]

// API Routes
// Lấy toàn bộ dữ liệu
app.get("/data", (req, res) => {
    const sql = "SELECT * FROM logs ORDER BY id DESC LIMIT 100";
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        res.status(200).json(results);
    });
});

// Thêm dữ liệu mới
app.post("/add", (req, res) => {
    console.log('Received data:', req.body); // Log dữ liệu nhận được
    
    const { distance, motor_status, manual_status, mode, schedule_info, timestamp } = req.body;

    if (!distance && distance !== 0 || !motor_status) {
        console.log('Missing required fields:', { distance, motor_status });
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Cập nhật các biến toàn cục nếu có giá trị hợp lệ từ ESP8266
    if (mode && ['AUTO', 'MANUAL', 'SCHEDULE'].includes(mode)) {
        currentMode = mode;
    }
    
    if (manual_status && ['ON', 'OFF'].includes(manual_status)) {
        manualStatus = manual_status;
    }
    
    console.log('Updated globals:', { currentMode, manualStatus });

    // Chuẩn bị câu lệnh SQL và các giá trị
    const sql = "INSERT INTO logs (distance, motor_status, manual_status, mode, schedule_info, timestamp) VALUES (?, ?, ?, ?, ?, ?)";
    const values = [
        distance, 
        motor_status, 
        manual_status || manualStatus,  // Sử dụng giá trị từ request hoặc biến toàn cục
        mode || currentMode,           // Sử dụng giá trị từ request hoặc biến toàn cục
        schedule_info || null,
        timestamp ? new Date(timestamp) : new Date()
    ];
    
    console.log('SQL values:', values);
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ message: 'Server error', error: err.message });
        }
        console.log('Data saved successfully with ID:', result.insertId);
        res.status(201).json({ 
            message: 'Data saved successfully', 
            data: { 
                id: result.insertId, 
                distance, 
                motor_status,
                manual_status: manual_status || manualStatus,
                mode: mode || currentMode,
                schedule_info,
                timestamp: values[5]
            } 
        });
    });
});

// Tìm kiếm theo timestamp và các điều kiện tùy chọn
app.get('/search', (req, res) => {
    const { start, end, mode, manual_status } = req.query;

    if (!start || !end) {
        return res.status(400).json({ message: 'Missing start or end timestamp' });
    }

    let query = 'SELECT * FROM logs WHERE timestamp BETWEEN ? AND ?';
    let params = [new Date(start), new Date(end)];
    
    // Thêm điều kiện tìm kiếm bổ sung nếu được cung cấp
    if (mode) {
        query += ' AND mode = ?';
        params.push(mode);
    }
    
    if (manual_status) {
        query += ' AND manual_status = ?';
        params.push(manual_status);
    }
    
    // Sắp xếp kết quả mới nhất lên đầu
    query += ' ORDER BY timestamp DESC';
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error searching data:', err);
            return res.status(500).json({ message: 'Server error', error: err.message });
        }
        res.status(200).json(results);
    });
});

// Lấy dữ liệu theo ID
app.get("/data/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM logs WHERE id = ?";
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.status(200).json(results[0]);
    });
});

// Xóa dữ liệu theo ID
app.delete("/data/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM logs WHERE id = ?";
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting data:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.status(200).json({ message: 'Record deleted successfully' });
    });
});

// Cập nhật dữ liệu theo ID
app.put("/data/:id", (req, res) => {
    const id = req.params.id;
    const { distance, motor_status, manual_status, mode, schedule_info } = req.body;

    if (!distance || !motor_status) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const sql = `
        UPDATE logs 
        SET distance = ?, 
            motor_status = ?, 
            manual_status = ?,
            mode = ?,
            schedule_info = ?
        WHERE id = ?
    `;
    
    const values = [
        distance, 
        motor_status, 
        manual_status || null, 
        mode || null, 
        schedule_info || null,
        id
    ];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating data:', err);
            return res.status(500).json({ message: 'Server error', error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.status(200).json({ 
            message: 'Record updated successfully',
            data: { 
                id, 
                distance, 
                motor_status,
                manual_status,
                mode,
                schedule_info 
            }
        });
    });
});

// ====== API Manual ======
// Đặt trạng thái manual (bật/tắt động cơ)
app.post("/manual", (req, res) => {
    const { status } = req.body;
    if (status !== "ON" && status !== "OFF") {
        return res.status(400).json({ message: "Invalid status" });
    }
    manualStatus = status;
    res.status(200).json({ message: "Manual status updated", status: manualStatus });
});

// Lấy trạng thái manual
app.get("/manual", (req, res) => {
    res.status(200).json({ status: manualStatus });
});

// ====== API Mode ======
// Đặt mode (AUTO, MANUAL, SCHEDULE)
app.post("/mode", (req, res) => {
    const { mode } = req.body;
    if (!["AUTO", "MANUAL", "SCHEDULE"].includes(mode)) {
        return res.status(400).json({ message: "Invalid mode" });
    }
    currentMode = mode;
    res.status(200).json({ message: "Mode updated", mode: currentMode });
});

// Lấy mode hiện tại
app.get("/mode", (req, res) => {
    res.status(200).json({ mode: currentMode });
});

// ====== API Schedule ======
// Đặt lịch định thời (ghi đè toàn bộ lịch)
app.post("/schedule", (req, res) => {
    const { schedule } = req.body; // [{on: "YYYY-MM-DDTHH:MM", off: "YYYY-MM-DDTHH:MM"}, ...]
    if (!Array.isArray(schedule)) {
        return res.status(400).json({ message: "Invalid schedule format" });
    }
    schedules = schedule;
    res.status(200).json({ message: "Schedule updated", schedule: schedules });
});

// Lấy danh sách lịch định thời
app.get("/schedule", (req, res) => {
    res.status(200).json({ schedule: schedules });
});

// Khởi động server
const PORT = 1234;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});