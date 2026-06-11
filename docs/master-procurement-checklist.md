# Guardian Drive - Master Procurement Checklist

Date: 2026-06-04
Purpose: Buy the full planned hardware now so execution is not blocked later.

## Already Ordered (5 items)

These are already ordered or received and should not be reordered.

- [x] Freenove ESP32-S3 dev board x1
- [x] MPU-6050 GY-521 x5 (DEV only)
- [x] Breadboard + jumper kit x1
- [x] Logic level shifter x5
- [x] INMP441 microphone x1 (passive evidence only, not MVP trigger)

## Buy Now (Full Remaining Project List)

This is the corrected production-aware list (no deprecated parts).

| Item | Qty | Target Use | Approx Cost (CAD) | Notes |
|---|---:|---|---:|---|
| ICM-42688-P IMU breakout | 1-2 | Production IMU | 8-16 | Production replacement for MPU-6050 |
| u-blox NEO-M9N GPS | 1 | Dev + Production | 25 | Do not buy NEO-6M (EOL) |
| Quectel BG95-M3 LTE dev board | 1 | Dev + Production path | 30 | Prefer BG95-M3 over SIM7600G-H |
| SN65HVD230 CAN transceiver | 2 | Dev + spare | 8 | ESP32 TWAI compatible (3.3V) |
| OBD-II breakout cable | 1 | Dev + Production | 8 | For vehicle CAN access |
| BQ24074/BQ24075 power-path charger module | 2 | Dev + spare | 16 | Required for proper load sharing |
| Li-ion battery 5000-7000mAh | 1 | Theft mode runtime target | 20 | Final size confirmed by current testing |
| W25Q64 SPI NOR flash module | 2 | Evidence logs + spare | 6 | For tamper-resilient event storage |
| ATECC608B secure element module | 1-2 | Crypto signing | 4-8 | Evidence signing chain |
| MOSFET relay module (logic-level) | 2 | Siren + start-inhibit | 8 | Never drive siren direct from GPIO |
| Automotive 12V->5V buck converter | 1 | Vehicle power | 8 | Automotive grade only |
| TVS diode (automotive rated) | 2 | Surge protection | 4 | Load-dump/transient protection |
| Inline fuse holder + blade fuses | 1 set | Vehicle safety | 4 | Mandatory for car-connected testing |
| 12V automotive weatherproof siren | 1 | Theft response | 15 | Use weatherproof model |
| MicroSD card + module | 1 | Raw/debug logs | 8 | Debug storage only |
| IP65 weatherproof enclosure + mounts | 1 | Physical install | 15 | For underbody/bumper protection |

## Optional But Smart To Order Now

- [ ] Extra jumper wires and Dupont kits (consumable)
- [ ] Crimp tool + automotive connector set
- [ ] Heat-shrink assortment + loom tape
- [ ] 3.3V/5V bench power module for breadboard testing

## Parts To Avoid (Do Not Buy)

- NEO-6M GPS (EOL)
- SIM7600G-H for production path (too power hungry)
- MCP2515 5V CAN modules (wrong voltage path for ESP32-S3 TWAI setup)
- TP4056 for car-connected build (no power-path/load sharing)

## Estimated Remaining Budget

- Lean buy (single quantity each): about 170-190 CAD
- With spares/safety extras: about 210-260 CAD

## Ordering Sequence If You Place Across Multiple Carts

1. High-risk lead-time items first: BG95-M3, NEO-M9N, ICM-42688-P
2. Vehicle safety/power items second: BQ24074, buck, TVS, fuse, battery
3. Integration items third: SN65HVD230, OBD cable, relay, siren, storage
4. Mechanical/protection items last: enclosure, mounting accessories

## Verification Checklist Before Checkout

- [ ] Every item is 3.3V-compatible where required
- [ ] GPS is NEO-M9N (not NEO-6M)
- [ ] LTE is BG95-M3 class module (not SIM7600G-H)
- [ ] CAN path is SN65HVD230 + ESP32 TWAI
- [ ] Charger is BQ24074/BQ24075 (not TP4056)
- [ ] Automotive power protection parts (buck + TVS + fuse) included
