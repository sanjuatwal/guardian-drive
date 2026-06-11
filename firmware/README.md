# Firmware

ESP32-S3 embedded firmware for the Guardian Drive Car Unit.

## Planned Structure

```
firmware/
├── src/
│   ├── main.cpp           ← entry point, sensor polling loop
│   ├── imu.cpp/.h         ← MPU-6050 tow/tilt/impact detection
│   ├── microphone.cpp/.h  ← INMP441 glass break detection
│   ├── gps.cpp/.h         ← NEO-6M location and sleep/wake logic
│   ├── lte.cpp/.h         ← SIM7600 AT command interface
│   ├── obd.cpp/.h         ← MCP2515 CAN bus event reading
│   ├── battery.cpp/.h     ← LiPo voltage monitoring
│   ├── risk_engine.cpp/.h ← local event scoring logic
│   └── event_log.cpp/.h   ← SD card buffered event storage
├── platformio.ini         ← PlatformIO build config
└── README.md              ← this file
```

## Getting Started

Install PlatformIO (recommended over Arduino IDE for larger projects):

```bash
pip install platformio
```

Target board: `esp32-s3-devkitc-1`

More firmware details will be added as Stage 1 bench testing begins.
