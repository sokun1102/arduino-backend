#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <Stepper.h>
#include <NTPtimeESP.h>

// --- Cấu hình ---
const char* ssid = "Nhat Vy";
const char* password = "88888888";
const char* serverName = "https://arduino-iot-backend.onrender.com/add";
const char* modeUrl = "https://arduino-iot-backend.onrender.com/mode";
const char* manualUrl = "https://arduino-iot-backend.onrender.com/manual";
const char* scheduleUrl = "https://arduino-iot-backend.onrender.com/schedule";
const int trigPin = D5, echoPin = D6;
const int motorPin1 = D1, motorPin2 = D2, motorPin3 = D3, motorPin4 = D4;
Stepper myStepper(2048, motorPin1, motorPin3, motorPin2, motorPin4);

// --- Ngưỡng ---
const float detectionDistance = 100.0, activationDistance = 50.0, closeDistance = 150.0;
const unsigned long doorOpenDuration = 5000, autoCloseDelay = 3000;
const unsigned long CHECK_INTERVAL = 2000, STATUS_INTERVAL = 30000;
const unsigned long NTP_INTERVAL = 300000, NTP_RETRY = 30000;
const unsigned long DISTANCE_INTERVAL = 500;
const unsigned long STATUS_UPDATE_INTERVAL = 3600000;

// --- Biến điều khiển cập nhật ---
bool forceUpdate = false;
float lastSentDistance = 0;
String lastSentMotorStatus = "";
String lastSentMode = "";
String lastSentManual = "";

// --- Trạng thái ---
bool doorOpen = false, motorRunning = false, timeInit = false, ntpOK = false;
String currentMode = "AUTO", manualStatus = "OFF", lastSchedId = "";
String oldManualStatus = "OFF";
unsigned long lastDetectionTime = 0, doorOpenTime = 0, lastCheckMode = 0;
unsigned long lastStatusPrint = 0, lastNTPSync = 0, lastNTPAttempt = 0, lastSchedTime = 0;
unsigned long lastDistanceCheck = 0;
unsigned long lastStatusUpdate = 0;
int ntpFails = 0;

// --- NTP ---
NTPtime NTP("pool.ntp.org");
strDateTime dateTime;
char currentDateTime[21] = "";

// --- Lịch trình ---
typedef struct { String on, off; } Schedule;
Schedule schedules[5];
int schedCount = 0;

void handleModeResponse(String payload);
void handleManualResponse(String payload);
void handleScheduleResponse(String payload);
void openDoor(float distance);
void closeDoor(float distance);
void sendData(float distance, const char* status);
void sendStatusUpdate(bool force = false);

void setup() {
  Serial.begin(115200);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(motorPin1, OUTPUT);
  pinMode(motorPin2, OUTPUT);
  pinMode(motorPin3, OUTPUT);
  pinMode(motorPin4, OUTPUT);
  myStepper.setSpeed(15);
  digitalWrite(motorPin1, LOW);
  digitalWrite(motorPin2, LOW);
  digitalWrite(motorPin3, LOW);
  digitalWrite(motorPin4, LOW);
  Serial.println("\n╔══════════════════════════════╗");
  Serial.println("║      KẾT NỐI WIFI            ║");
  Serial.println("╚══════════════════════════════╝");
  WiFi.begin(ssid, password);
  for(int i=0; WiFi.status() != WL_CONNECTED && i<20; i++) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Đã kết nối WiFi thành công!");
    Serial.print("📱 IP: ");
    Serial.println(WiFi.localIP().toString());
    initNTP();
    httpGet(modeUrl, handleModeResponse);
  } else {
    Serial.println("\n❌ Kết nối WiFi thất bại!");
  }
  Serial.println("\n╔══════════════════════════════╗");
  Serial.println("║   HỆ THỐNG SẴN SÀNG          ║");
  Serial.println("╚══════════════════════════════╝");
}

bool initNTP() {
  Serial.println("\n⏱️ Đồng bộ thời gian...");
  for (int i=0; i<3; i++) {
    dateTime = NTP.getNTPtime(7.0, 0);
    if (dateTime.valid && dateTime.year >= 2020) {
      sprintf(currentDateTime, "%04d-%02d-%02dT%02d:%02d", 
              dateTime.year, dateTime.month, dateTime.day, dateTime.hour, dateTime.minute);
      lastNTPSync = millis();
      ntpOK = true;
      timeInit = true;
      Serial.println("✅ Đồng bộ thời gian: " + String(currentDateTime));
      return true;
    }
    delay(1000);
  }
  Serial.println("❌ Đồng bộ thời gian thất bại!");
  return false;
}

void updateTime() {
  dateTime = NTP.getNTPtime(7.0, 0);
  if (dateTime.valid && dateTime.year >= 2020) {
    sprintf(currentDateTime, "%04d-%02d-%02dT%02d:%02d", 
            dateTime.year, dateTime.month, dateTime.day, dateTime.hour, dateTime.minute);
    lastNTPSync = millis();
    ntpOK = true;
    ntpFails = 0;
    timeInit = true;
    return;
  }
  ntpFails++;
  if (!timeInit) return;
  unsigned long elapsedSecs = (millis() - lastNTPSync) / 1000;
  int totalMin = dateTime.hour * 60 + dateTime.minute + (elapsedSecs / 60);
  int newHour = (totalMin / 60) % 24;
  int newMin = totalMin % 60;
  int newDay = dateTime.day + ((totalMin / 60) / 24);
  if (newDay > 31) newDay = 31;
  sprintf(currentDateTime, "%04d-%02d-%02dT%02d:%02d", 
          dateTime.year, dateTime.month, newDay, newHour, newMin);
}

void httpGet(const char* url, void (*callback)(String)) {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, url);
  http.setTimeout(10000);
  int httpCode = http.GET();
  if (httpCode == 200) {
    callback(http.getString());
  } else {
    Serial.printf("❌ HTTP GET lỗi: %s - code: %d\n", url, httpCode);
    Serial.println(http.errorToString(httpCode));
  }
  http.end();
}

void handleModeResponse(String payload) {
  StaticJsonDocument<64> doc;
  DeserializationError error = deserializeJson(doc, payload);
  if (!error) {
    String newMode = doc["mode"].as<String>();
    if (currentMode != newMode) {
      currentMode = newMode;
      Serial.println("\n🔄 Chế độ: " + currentMode);
      lastStatusPrint = 0;
      forceUpdate = true;
      if (currentMode == "MANUAL") {
        httpGet(manualUrl, handleManualResponse);
      } else if (currentMode == "SCHEDULE") {
        httpGet(scheduleUrl, handleScheduleResponse);
      }
    }
  }
}

void handleManualResponse(String payload) {
  StaticJsonDocument<64> doc;
  DeserializationError error = deserializeJson(doc, payload);
  if (!error) {
    String newStatus = doc["status"].as<String>();
    if (manualStatus != newStatus) {
      oldManualStatus = manualStatus;
      manualStatus = newStatus;
      Serial.println("👐 Trạng thái thủ công: " + manualStatus);
      forceUpdate = true;
      if (currentMode == "MANUAL") {
        if (manualStatus == "ON" && !doorOpen && !motorRunning) {
          Serial.println("⚡ Nhận lệnh MỞ CỬA thủ công");
          openDoor(0);
        } else if (manualStatus == "OFF" && doorOpen && !motorRunning) {
          Serial.println("⚡ Nhận lệnh ĐÓNG CỬA thủ công");
          closeDoor(0);
        }
      }
    }
  }
}

void handleScheduleResponse(String payload) {
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, payload);
  if (!error) {
    JsonArray array = doc["schedule"].as<JsonArray>();
    int oldCount = schedCount;
    schedCount = 0;
    bool scheduleChanged = false;
    for (JsonObject item : array) {
      if (schedCount < 5) {
        String newOn = item["on"].as<String>();
        String newOff = item["off"].as<String>();
        if (schedCount >= oldCount || 
            schedules[schedCount].on != newOn || 
            schedules[schedCount].off != newOff) {
          scheduleChanged = true;
        }
        schedules[schedCount].on = newOn;
        schedules[schedCount].off = newOff;
        schedCount++;
      }
    }
    if (schedCount != oldCount || scheduleChanged) {
      Serial.println("\n📅 LỊCH: " + String(schedCount) + " mục");
      for (int i=0; i<schedCount; i++) {
        Serial.printf("  #%d: BẬT=%s, TẮT=%s\n", 
                     i+1, schedules[i].on.c_str(), schedules[i].off.c_str());
      }
      lastSchedId = "";
      forceUpdate = true;
    }
  }
}

float measureDistance() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH, 30000);
  if (duration == 0) {
    Serial.println("⚠️ Không nhận được tín hiệu echo!");
    return -1;
  }
  float distance = (duration * 0.0343) / 2;
  if (distance < 2 || distance > 400) {
    Serial.println("⚠️ Khoảng cách ngoài phạm vi!");
    return -1;
  }
  return distance;
}

void controlDoor(float distance) {
  unsigned long now = millis();
  if (distance <= detectionDistance) {
    lastDetectionTime = now;
    if (distance <= activationDistance && !doorOpen && !motorRunning) {
      Serial.print("🔍 Phát hiện vật thể ở khoảng cách: ");
      Serial.println(distance);
      openDoor(distance);
    }
  }
  if (doorOpen && !motorRunning) {
    bool noPerson = (now - lastDetectionTime > autoCloseDelay);
    bool openTooLong = (now - doorOpenTime > doorOpenDuration);
    if ((noPerson || openTooLong)) {
      if (distance > closeDistance) {
        Serial.println("🔄 Tự động đóng cửa: không phát hiện người");
        closeDoor(distance);
      } else {
        Serial.println("⚠️ Phát hiện người gần cửa, không đóng vì an toàn");
        lastDetectionTime = now;
      }
    }
  }
}

void openDoor(float distance) {
  if (doorOpen || motorRunning) return;
  motorRunning = true;
  Serial.println("\n╔══════════════════════════╗");
  Serial.println("║      🔓 MỞ CỬA           ║");
  Serial.println("╚══════════════════════════╝");
  myStepper.step(1024);
  digitalWrite(motorPin1, LOW);
  digitalWrite(motorPin2, LOW);
  digitalWrite(motorPin3, LOW);
  digitalWrite(motorPin4, LOW);
  doorOpen = true;
  doorOpenTime = millis();
  motorRunning = false;
  Serial.println("✅ Đã mở cửa xong!");
  sendData(distance, "ON");
}

void closeDoor(float distance) {
  if (!doorOpen || motorRunning) return;
  motorRunning = true;
  Serial.println("\n╔══════════════════════════╗");
  Serial.println("║      🔒 ĐÓNG CỬA          ║");
  Serial.println("╚══════════════════════════╝");
  myStepper.step(-1024);
  digitalWrite(motorPin1, LOW);
  digitalWrite(motorPin2, LOW);
  digitalWrite(motorPin3, LOW);
  digitalWrite(motorPin4, LOW);
  doorOpen = false;
  motorRunning = false;
  Serial.println("✅ Đã đóng cửa xong!");
  sendData(distance, "OFF");
}

bool shouldSendData(float distance, const char* motor_status) {
  if (String(motor_status) != lastSentMotorStatus || 
      currentMode != lastSentMode || 
      manualStatus != lastSentManual) {
    return true;
  }
  if (abs(distance - lastSentDistance) > 10) {
    return true;
  }
  return false;
}

void sendData(float distance, const char* status) {
  if (WiFi.status() != WL_CONNECTED) return;
  lastSentDistance = distance;
  lastSentMotorStatus = status;
  lastSentMode = currentMode;
  lastSentManual = manualStatus;
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, serverName);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);
  StaticJsonDocument<256> doc;
  doc["distance"] = distance;
  doc["motor_status"] = status;
  doc["timestamp"] = String(currentDateTime);
  doc["mode"] = currentMode;
  doc["manual_status"] = manualStatus;
  if (currentMode == "SCHEDULE" && schedCount > 0) {
    String schedInfo = "";
    int maxSchedules = min(2, schedCount);
    for (int i=0; i<maxSchedules; i++) {
      if (i > 0) schedInfo += " | ";
      schedInfo += "BẬT:" + schedules[i].on.substring(11, 16) + ",TẮT:" + schedules[i].off.substring(11, 16);
    }
    doc["schedule_info"] = schedInfo;
  }
  String json;
  serializeJson(doc, json);
  Serial.print("📤 Gửi dữ liệu: ");
  Serial.println(json);
  int httpCode = http.POST(json);
  if (httpCode > 0) {
    if (httpCode == 200 || httpCode == 201) {
      Serial.println("✅ Đã gửi dữ liệu thành công");
      lastStatusUpdate = millis();
    } else {
      Serial.printf("⚠️ HTTP code: %d\n", httpCode);
      String response = http.getString();
      Serial.println("Response: " + response);
    }
  } else {
    Serial.printf("❌ HTTP POST lỗi: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

void sendStatusUpdate(bool force) {
  float distance = measureDistance();
  if (distance < 2 || distance > 400) {
    Serial.println("⚠️ Đo khoảng cách lỗi, KHÔNG gửi dữ liệu lên server!");
    return; // Không gửi nếu đo lỗi
  }
  if (force || shouldSendData(distance, doorOpen ? "ON" : "OFF")) {
    sendData(distance, doorOpen ? "ON" : "OFF");
    forceUpdate = false;
  }
}

void checkSchedule() {
  if (!timeInit || strlen(currentDateTime) < 16) return;
  String current = String(currentDateTime).substring(0, 16);
  static String lastChecked = "";
  if (current == lastChecked) return;
  lastChecked = current;
  for (int i=0; i<schedCount; i++) {
    if (schedules[i].on.length() >= 16 && 
        schedules[i].on.substring(0, 16) == current && 
        !doorOpen && !motorRunning) {
      String id = "ON_" + String(i) + "_" + current;
      if (id != lastSchedId || millis() - lastSchedTime > 60000) {
        Serial.println("\n⏰ LỊCH TRÌNH: MỞ CỬA!");
        Serial.println("  ► Lịch #" + String(i+1) + " tại " + current);
        openDoor(0);
        lastSchedId = id;
        lastSchedTime = millis();
        return;
      }
    }
    if (schedules[i].off.length() >= 16 &&
        schedules[i].off.substring(0, 16) == current && 
        doorOpen && !motorRunning) {
      String id = "OFF_" + String(i) + "_" + current;
      if (id != lastSchedId || millis() - lastSchedTime > 60000) {
        Serial.println("\n⏰ LỊCH TRÌNH: ĐÓNG CỬA!");
        Serial.println("  ► Lịch #" + String(i+1) + " tại " + current);
        closeDoor(0);
        lastSchedId = id;
        lastSchedTime = millis();
        return;
      }
    }
  }
}

void loop() {
  unsigned long now = millis();
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("📶 Đang kết nối lại WiFi...");
    WiFi.reconnect();
    delay(3000);
    return;
  }
  if ((now - lastNTPSync >= NTP_INTERVAL) || 
      (!ntpOK && now - lastNTPAttempt >= NTP_RETRY)) {
    updateTime();
    lastNTPAttempt = now;
  } else if (timeInit && now - lastNTPSync >= 60000) {
    updateTime();
  }
  if (now - lastCheckMode >= CHECK_INTERVAL) {
    httpGet(modeUrl, handleModeResponse);
    if (currentMode == "MANUAL") {
      httpGet(manualUrl, handleManualResponse);
    } else if (currentMode == "SCHEDULE") {
      httpGet(scheduleUrl, handleScheduleResponse);
    }
    lastCheckMode = now;
  }
  if (forceUpdate || now - lastStatusUpdate >= STATUS_UPDATE_INTERVAL) {
    sendStatusUpdate(forceUpdate);
  }
  if (now - lastStatusPrint >= STATUS_INTERVAL) {
    Serial.println("\n╔══════════════ TRẠNG THÁI ════════════════╗");
    Serial.println("  ⏱️  Thời gian: " + String(currentDateTime));
    Serial.println("  🔄 Chế độ: " + currentMode);
    Serial.println("  🚪 Cửa: " + String(doorOpen ? "MỞ" : "ĐÓNG"));
    if (currentMode == "MANUAL") {
      Serial.println("  👐 Trạng thái: " + manualStatus);
    } else if (currentMode == "SCHEDULE") {
      Serial.println("  📅 Số lịch: " + String(schedCount));
    }
    Serial.println("╚═════════════════════════════════════════╝");
    lastStatusPrint = now;
  }
  if (currentMode == "AUTO") {
    if (now - lastDistanceCheck >= DISTANCE_INTERVAL) {
      float distance = measureDistance();
      if (distance > 0) {
        static float lastDistance = -1;
        if (abs(distance - lastDistance) > 5) {
          Serial.print("📏 Khoảng cách: ");
          Serial.print(distance);
          Serial.println(" cm");
          lastDistance = distance;
        }
        controlDoor(distance);
      }
      lastDistanceCheck = now;
    }
  } else if (currentMode == "MANUAL") {
    if (manualStatus == "ON" && !doorOpen && !motorRunning) {
      openDoor(0);
    } else if (manualStatus == "OFF" && doorOpen && !motorRunning) {
      closeDoor(0);
    }
  } else if (currentMode == "SCHEDULE") {
    checkSchedule();
  }
  yield();
  delay(50);
} 