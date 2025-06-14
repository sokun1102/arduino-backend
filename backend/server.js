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
});

// API Routes
// Lấy toàn bộ dữ liệu
app.get("/data", (req, res) => {
    const sql = "SELECT * FROM logs";
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
    const { distance, motor_status } = req.body;

    if (!distance || !motor_status) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const sql = "INSERT INTO logs (distance, motor_status) VALUES (?, ?)";
    db.query(sql, [distance, motor_status], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        res.status(201).json({ 
            message: 'Data saved successfully', 
            data: { id: result.insertId, distance, motor_status } 
        });
    });
});

// Tìm kiếm theo timestamp
app.get('/search', (req, res) => {
    const { start, end } = req.query;

    if (!start || !end) {
        return res.status(400).json({ message: 'Missing start or end timestamp' });
    }

    const query = 'SELECT * FROM logs WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC';
    db.query(query, [new Date(start), new Date(end)], (err, results) => {
        if (err) {
            console.error('Error searching data:', err);
            return res.status(500).json({ message: 'Server error' });
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
    const { distance, motor_status } = req.body;

    if (!distance || !motor_status) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const sql = "UPDATE logs SET distance = ?, motor_status = ? WHERE id = ?";
    
    db.query(sql, [distance, motor_status, id], (err, result) => {
        if (err) {
            console.error('Error updating data:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.status(200).json({ 
            message: 'Record updated successfully',
            data: { id, distance, motor_status }
        });
    });
});

// Khởi động server
const PORT = 1234;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});