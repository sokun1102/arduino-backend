const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ====== Kết nối MongoDB ======
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arduino_logs';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

// ====== Định nghĩa Schema và Model ======
const logSchema = new mongoose.Schema({
  distance: { type: Number, required: true },
  motor_status: { type: String, required: true },
  manual_status: { type: String, default: null },
  mode: { type: String, default: null },
  schedule_info: { type: String, default: null },
  timestamp: { type: Date, default: Date.now }
});
const Log = mongoose.model('Log', logSchema);

// ====== Biến toàn cục cho manual/mode/schedule ======
let manualStatus = "OFF"; // "ON" hoặc "OFF"
let currentMode = "AUTO"; // "AUTO", "MANUAL", "SCHEDULE"
let schedules = []; // [{on: "HH:mm", off: "HH:mm"}]

// API Routes
// Lấy toàn bộ dữ liệu
app.get("/data", async (req, res) => {
  try {
    const results = await Log.find().sort({ _id: -1 }).limit(100);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Thêm dữ liệu mới
app.post("/add", async (req, res) => {
  console.log('Received data:', req.body); // Log dữ liệu nhận được
  const { distance, motor_status, manual_status, mode, schedule_info, timestamp } = req.body;
  if ((!distance && distance !== 0) || !motor_status) {
    console.log('Missing required fields:', { distance, motor_status });
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (mode && ['AUTO', 'MANUAL', 'SCHEDULE'].includes(mode)) {
    currentMode = mode;
  }
  if (manual_status && ['ON', 'OFF'].includes(manual_status)) {
    manualStatus = manual_status;
  }
  console.log('Updated globals:', { currentMode, manualStatus });
  try {
    const log = new Log({
      distance,
      motor_status,
      manual_status: manual_status || manualStatus,
      mode: mode || currentMode,
      schedule_info: schedule_info || null,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    });
    const saved = await log.save();
    res.status(201).json({
      message: 'Data saved successfully',
      data: saved
    });
  } catch (err) {
    console.error('Error inserting data:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Tìm kiếm theo timestamp và các điều kiện tùy chọn
app.get('/search', async (req, res) => {
  const { start, end, mode, manual_status } = req.query;
  if (!start || !end) {
    return res.status(400).json({ message: 'Missing start or end timestamp' });
  }
  let query = {
    timestamp: { $gte: new Date(start), $lte: new Date(end) }
  };
  if (mode) query.mode = mode;
  if (manual_status) query.manual_status = manual_status;
  try {
    const results = await Log.find(query).sort({ timestamp: -1 });
    res.status(200).json(results);
  } catch (err) {
    console.error('Error searching data:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Lấy dữ liệu theo ID
app.get("/data/:id", async (req, res) => {
  try {
    const result = await Log.findById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Record not found' });
    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Xóa dữ liệu theo ID
app.delete("/data/:id", async (req, res) => {
  try {
    const result = await Log.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Record not found' });
    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (err) {
    console.error('Error deleting data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cập nhật dữ liệu theo ID
app.put("/data/:id", async (req, res) => {
  const { distance, motor_status, manual_status, mode, schedule_info } = req.body;
  if (!distance || !motor_status) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const updated = await Log.findByIdAndUpdate(
      req.params.id,
      {
        distance,
        motor_status,
        manual_status: manual_status || null,
        mode: mode || null,
        schedule_info: schedule_info || null
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Record not found' });
    res.status(200).json({
      message: 'Record updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('Error updating data:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ====== API Manual ======
app.post("/manual", (req, res) => {
  const { status } = req.body;
  if (status !== "ON" && status !== "OFF") {
    return res.status(400).json({ message: "Invalid status" });
  }
  manualStatus = status;
  res.status(200).json({ message: "Manual status updated", status: manualStatus });
});

app.get("/manual", (req, res) => {
  res.status(200).json({ status: manualStatus });
});

// ====== API Mode ======
app.post("/mode", (req, res) => {
  const { mode } = req.body;
  if (!["AUTO", "MANUAL", "SCHEDULE"].includes(mode)) {
    return res.status(400).json({ message: "Invalid mode" });
  }
  currentMode = mode;
  res.status(200).json({ message: "Mode updated", mode: currentMode });
});

app.get("/mode", (req, res) => {
  res.status(200).json({ mode: currentMode });
});

// ====== API Schedule ======
app.post("/schedule", (req, res) => {
  const { schedule } = req.body; // [{on: "YYYY-MM-DDTHH:MM", off: "YYYY-MM-DDTHH:MM"}, ...]
  if (!Array.isArray(schedule)) {
    return res.status(400).json({ message: "Invalid schedule format" });
  }
  schedules = schedule;
  res.status(200).json({ message: "Schedule updated", schedule: schedules });
});

app.get("/schedule", (req, res) => {
  res.status(200).json({ schedule: schedules });
});

// Khởi động server
const PORT = 1234;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});