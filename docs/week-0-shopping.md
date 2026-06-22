# Week 0: Hardware Shopping & Setup Guide

> Getting your first components ordered and dev environment ready

---

## Programming Language for ESP32: C++ (Arduino Framework)

### Why C++?

Since you're new to embedded coding, we're using **C++ with Arduino framework** instead of bare-metal C. Here's why:

| Aspect | C (Bare Metal) | C++ (Arduino) ← **We use this** |
|--------|---|---|
| Learning curve | 🔴 Steep: interrupts, memory management, register poking | 🟢 Gentle: libraries handle 80% of complexity |
| Time to first "blink" | 1-2 hours of setup | 5 minutes |
| Debugging | 🔴 Serial debugging is manual, slow | 🟢 Serial.print() works instantly |
| Library ecosystem | 🔴 Must write drivers from scratch | 🟢 Pre-made sensor libraries available |
| Web framework | ArduinoIDE is beginner-friendly → PlatformIO is professional | **Use PlatformIO** |
| Typical project time | Faster after learning curve | **Faster overall for prototyping** |

### What This Means

```cpp
// This is what you'll write with Arduino framework:
#include <MPU6050.h>

MPU6050 mpu;

void setup() {
  Serial.begin(115200);
  mpu.initialize();
}

void loop() {
  int x = mpu.getAccelerationX();
  Serial.println(x);
  delay(100);
}
```

**vs. Bare metal C** (register poking, DMA setup, interrupt handlers): 10x more complex.

### Development Tools: PlatformIO

We'll use **PlatformIO** (not Arduino IDE):
- Better project structure
- Built-in dependency management
- Easier debugging
- Professional-grade

**Install Week 0:**
1. Download VS Code
2. Install PlatformIO extension
3. Create new ESP32-S3 project
4. Flash your first "blink" sketch in 5 minutes

---

## Week 0 Shopping List

### What You're Ordering This Week

**Total spend: ~$50-80** for your first batch (just processor + first 2 sensors)

### Core Processor (Order Immediately)

| Item | Qty | Link | Price | Why |
|------|-----|------|-------|-----|
| **ESP32-S3 DevKit** | 1 | [Amazon](https://www.amazon.com/s?k=ESP32-S3+DevKit) or [AliExpress](https://www.aliexpress.com/w/wholesale-ESP32-S3-DevKit.html) | ~$10 | Built-in WiFi + BLE, giant community support, 240 MHz dual-core, tons of GPIO pins. This is the industry standard for prototyping. |
| USB-C Power Cable | 1 | Amazon | ~$5 | To power the ESP32 during development |

**Why ESP32-S3 and not other chips?**
- Arduino/MicroPython support is excellent
- Massive online community (Stack Overflow, GitHub, YouTube)
- Good balance of power/performance/cost
- Can move to nRF52 or STM32 later for production

---

### Sensor 1: IMU (Tilt/Tow Detection)

| Item | Qty | Link | Price | Why |
|------|-----|------|-------|-----|
| **MPU-6050 Breakout Board** | 1 | [Amazon](https://www.amazon.com/s?k=MPU-6050+breakout) or [AliExpress](https://www.aliexpress.com/w/wholesale-MPU6050-module.html) | ~$3-5 | 6-axis IMU (accelerometer + gyro). Detects car tilt, tow angles, impacts. Cheapest reliable IMU. Millions of tutorials online. |

**What it does:**
- Measure acceleration in X/Y/Z (detect tilt, tow)
- Measure rotation (gyroscope)
- Calculate angles and impacts
- Communicates over I2C (simple 2-wire protocol)

**How you'll test it:**
- Week 3: Mount on breadboard, tilt at different angles, print accelerometer values to Serial Monitor

---

### Sensor 2: INMP441 Microphone (Already Ordered — Passive Evidence Sensor Only)

Already ordered, arriving June 15-25. **Glass break detection is removed from MVP.**
The mic will be kept as a passive evidence sensor only (records audio during a confirmed theft event).
No firmware work for audio detection until V1.5 at the earliest.

---

### Breadboarding Supplies

| Item | Qty | Link | Price | Why |
|------|-----|------|-------|-----|
| **Breadboard + Jumper Wires** | 1 | [Amazon combo](https://www.amazon.com/s?k=breadboard+jumper+wires+kit) | ~$8 | Never solder during prototype. Use breadboard + jumpers so you can change wiring instantly. |
| **Logic Level Shifter (3.3V ↔ 5V)** | 1 | [Amazon](https://www.amazon.com/s?k=logic+level+shifter) | ~$3 | Some sensors run at 3.3V, some at 5V. This converter prevents frying your ESP32. |

---

### Optional: Get Started With Testing

| Item | Qty | Link | Price | Why |
|------|-----|------|-------|-----|
| **Raspberry Pi Pico (or Teensy)** | — | — | — | SKIP for now. Learn on ESP32 first. |

---

## What to Order Next (Phase 2-6 — do NOT order yet)

Order these only when you reach the corresponding sprint. See `hardware/BOM.md` for full details.

| Phase | Component | When |
|---|---|---|
| Phase 2 | MOSFET relay module + 12V siren | Week 3 |
| Phase 3 | Quectel BG95-M3 (GPS + LTE in one) + LTE-M SIM (~$35) | Week 4-7 |
| Phase 5 | BQ24074 power-path charger + Li-ion 5000-7000mAh | Week 8 |
| Phase 6 | OBD-II cable + SN65HVD230 CAN transceiver | Week 9-10 |

Plus: 2x reed switch + magnets (door/hood), automotive shock sensor (3.3V/5V) — see `hardware/BOM.md` "Intrusion Sensing".

⚠️ Do NOT order NEO-6M GPS (EOL), SIM7600/7670 for the production build (too power hungry — BG95-M3 is the pick), MCP2515 CAN (5V, wrong for ESP32), 12V shock sensors straight to a GPIO, or TP4056 charger (no load sharing). See `hardware/BOM.md` for reasons.

---

## Week 0: Development Environment Setup

### Step 1: Install PlatformIO (All in one spot)

1. **Download & install VS Code** (free)
   - https://code.visualstudio.com/

2. **Open VS Code Extensions**
   - Search: "PlatformIO"
   - Install "PlatformIO IDE" (official Red Panda icon)
   - Wait 5 minutes for install to complete

3. **Both machines must have this done together**
   - Sit side-by-side
   - Both verify it works

### Step 2: Project Already Created

Project is already initialized at `/Users/palakmejpara/guardian-drive/guardian-firmware`.

Important: `platformio.ini` must include these lines for serial output to work over native USB:

```ini
[env:esp32-s3-devkitc-1]
platform = espressif32
board = esp32-s3-devkitc-1
framework = arduino
build_flags = -DARDUINO_USB_CDC_ON_BOOT=1
monitor_speed = 115200
```

### Step 3: Build, Upload, Monitor

All commands use the full PlatformIO path (not in system PATH on macOS):

```bash
# Build
~/.platformio/penv/bin/pio run

# Upload (hold BOOT button on board if it gets stuck)
~/.platformio/penv/bin/pio run --target upload

# Serial Monitor (115200 baud, set in platformio.ini)
~/.platformio/penv/bin/pio device monitor

# Upload + Monitor in one command
~/.platformio/penv/bin/pio run --target upload && ~/.platformio/penv/bin/pio device monitor
```

Expected output after upload:
```
Guardian Drive — ESP32-S3 online.
heartbeat
heartbeat
```

If upload gets stuck at `Connecting......`: hold the BOOT button on the board then retry.

---

## Shopping Checklist (Copy & Paste for Order)

```
Week 0 Order:
☐ ESP32-S3 DevKit x1 (~$10)
☐ USB-C Power Cable x1 (~$5)
☐ MPU-6050 Breakout x1 (~$4)
☐ INMP441 Microphone x1 (~$5)
☐ Breadboard + Jumper Wires kit x1 (~$8)
☐ Logic Level Shifter x1 (~$3)

Total: ~$35-40

Supplier options:
- Amazon: Fastest (2-day shipping if Prime)
- AliExpress: Cheapest ($5-10 saved) but 2-3 weeks
- Local: RadioShack, Canada Robotics (if available)

RECOMMENDATION: Order from Amazon for Week 0 (speed > cost).
When you know what you need for Phase 1, reorder from AliExpress
for future phases (shipping time doesn't matter if you have other work).
```

---

## Week 0 Status — COMPLETE ✅

All done as of June 4, 2026:

- [x] Freenove ESP32-S3 received and firmware uploaded successfully
- [x] Build, upload, serial monitor all verified working
- [x] PlatformIO installed, `ARDUINO_USB_CDC_ON_BOOT=1` fix applied
- [x] MPU-6050 x5 received
- [x] BOJACK breadboard kit received
- [x] Logic level shifters received
- [x] INMP441 mic ordered (arriving June 15-25, passive only)
- [x] Hardware BOM updated with corrected production components
- [x] HAL architecture decided (sensor interface layer)
- [ ] Git repo initialized with HAL folder structure — do this in Week 1
- [ ] API contract and event schema defined — do this in Week 1

**Week 1 starts now. See `docs/project-plan.md` Week 1 tasks.**

---

## Tips for Success

### Embedded Coding is Different

**Web developers' common mistakes:**
- ❌ Forgetting that memory is TINY (4MB total, ~1MB usable)
- ❌ Using string formatting like Python (no! causes memory leaks)
- ❌ Not looking at Serial Monitor output (best debugging tool)
- ❌ Expecting multiple threads like backend servers (Arduino is single-threaded)

**Golden rules:**
- ✅ Always use Serial.print() to debug (print variables to USB console)
- ✅ Check available RAM with `ESP.getFreeHeap()`
- ✅ Use `const` and `static` to avoid heap fragmentation
- ✅ Test on breadboard BEFORE writing complex logic

### Best Resources

- **Arduino Official Docs**: https://docs.arduino.cc/
- **ESP32 Pinout**: Google "ESP32-S3 DevKit pinout" (bookmark this!)
- **I2C Protocol (why MPU-6050 needs 2 wires)**: https://learn.sparkfun.com/tutorials/i2c
- **Serial vs I2C vs SPI**: https://www.youtube.com/watch?v=IyGwvGzrqp8

### Common Problems Week 0

| Problem | Solution |
|---------|----------|
| "Board not recognized" | Try different USB-C cable (some are charge-only) |
| "Serial Monitor shows garbage" | Baud rate mismatch. Make sure `Serial.begin(115200)` matches monitor |
| "PlatformIO won't compile" | Delete `.pio/` folder, try again |
| "Too many tabs open in VS Code" | Install "close all tabs" extension |

---

## Next: Week 1 Architecture Design

Once you order hardware, start **architecture design session** (Week 2 of Phase 0).

Read: `docs/project-plan.md` Sprint 0.2 for detailed tasks.

**Good luck! 🚀**
