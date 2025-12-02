# Nexus-9 Humanoid Single Arm

![Status](https://img.shields.io/badge/Status-Prototype_Validated-success)
![Version](https://img.shields.io/badge/Version-v1.2.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

**Nexus Robotics Labs** presents the Nexus-9: A high-performance, 9-DOF redundant manipulator designed for complex object manipulation in unstructured environments. This repository contains the complete engineering design package, simulation source code, and validation reports.

---

## 📚 Table of Contents

1. [Product Requirements Document (PRD)](#1-product-requirements-document-prd)
2. [Requirements Specifications (HW/SW/Mech)](#2-requirements-specifications)
3. [High Level Design & Architecture](#3-high-level-design--architecture)
4. [Schematics, CAD & Software](#4-schematics-cad--software-code)
5. [Design Analysis](#5-design-analysis)
6. [Test Plan](#6-component-and-module-test-plan)
7. [Bill of Materials & Pricing](#7-bill-of-materials-and-product-pricing)

---

## 1. Product Requirements Document (PRD)

### 1.1 Executive Summary
The Nexus-9 is a single-arm humanoid manipulator intended for research, prosumer automation, and mobile manipulation platforms. It bridges the gap between rigid industrial cobots and compliant hobbyist arms.

### 1.2 Functional Requirements
*   **Kinematics:** 9 Degrees of Freedom (Redundant) to minimize singularities and allow obstacle avoidance.
*   **Payload:** Minimum 5.0 kg continuous hold at full extension.
*   **Reach:** 900 mm workspace radius.
*   **Precision:** Repeatability < ±0.5 mm.
*   **Gripper:** Adaptive parallel jaw with interchangeable fingers.

### 1.3 Non-Functional Requirements
*   **Safety:** ISO 10218-1 compliant power and force limiting (PFL).
*   **Power:** 48V DC Bus (Battery compatible).
*   **Durability:** >10,000 hours MTTF under nominal load.
*   **Interface:** EtherCAT / CAN-FD real-time control interface.

---

## 2. Requirements Specifications

### 2.1 Mechanical Specifications
*   **Structure:** Aluminum 6061-T6 (Structural Links), Carbon Fiber (Shells).
*   **Joint Config:** 
    *   Shoulder: 3 DOF (Pitch/Yaw/Roll) - High Torque
    *   Elbow: 3 DOF (Pitch/Yaw/Roll) - Mid Torque
    *   Wrist: 2 DOF (Pitch/Roll) - High Speed
    *   Gripper: 1 DOF (Linear)
*   **Weight Budget:** Total arm mass < 8.5 kg.

### 2.2 Hardware (Electrical) Specifications
*   **Actuators:** Frameless BLDC motors with integrated magnetic encoders (14-bit).
*   **Gearbox:** Strain wave gears (Harmonic) for J1-J3; Planetary for J4-J9.
*   **Drivers:** Integrated FOC drivers located at each joint (Distributed architecture).
*   **Bus:** Daisy-chained power + differential data pair.

### 2.3 Software Specifications
*   **Control Loop:** 1 kHz real-time kinematic solver.
*   **Stack:** ROS 2 (Humble) compatible hardware interface.
*   **Safety Monitor:** Redundant watchdog timer on MCU, current-based collision detection.

---

## 3. High Level Design / Architecture

### 3.1 System Block Diagram
```ascii
[Power Supply 48V] ===+===> [Shoulder Complex (J1-J3)] ===> [Elbow Complex (J4-J6)] ===> [Wrist (J7-J8)]
                      |           ^                            ^                         ^
[Host PC / AI] <===> [CAN-FD Bus Master] <===============================================+
                      |
                      +---> [Emergency Stop Circuit]
```

### 3.2 Kinematic Chain (Denavit-Hartenberg Overview)
The system utilizes a modified DH parameter approach to manage the 9-DOF redundancy.
*   **Base Frame:** Shoulder Yaw (Z-axis).
*   **Redundancy Resolution:** Null-space projection utilized to optimize manipulability and avoid joint limits while maintaining end-effector pose.

---

## 4. Schematics, CAD, Sw Code

### 4.1 Mechanical Design
*   **Files:** Located in `/cad` (STEP/SolidWorks).
*   **Highlights:** 
    *   Hollow-shaft design for internal cabling.
    *   Pre-tensioned angular contact bearings for joint rigidity.

### 4.2 Software Implementation
The core kinematic simulation provided in this web app (`src/components/KinematicSimulation.tsx`) implements the physics engine:
```typescript
// Pseudo-code for Forward Kinematics Loop
function solveFK(joints) {
    let T = Identity();
    for (let i = 0; i < joints.length; i++) {
        // Rot Z -> Rot Y -> Rot X -> Trans X
        T = T * RotZ(joints[i].angle) * RotY * RotX * Trans(link_len);
    }
    return extractPosition(T);
}
```

---

## 5. Design Analysis

### 5.1 Worst Case Analysis (WCA)
*   **Scenario:** 5kg Payload held horizontally at max reach (900mm).
*   **Max Moment (Shoulder Pitch):** ~58 Nm (Static) + Dynamic loads.
*   **Motor Selection:** 120 Nm Peak Actuator provides Safety Factor > 2.0.

### 5.2 Tolerance Stack-up (Wrist Assembly)
*   **Global Tolerance Budget:** ±0.500 mm
*   **Analysis:**
    *   Link Machining: ±0.050 mm
    *   Bearing Runout: ±0.025 mm
    *   Gear Backlash: ±0.150 mm
    *   **Total Stack:** ±0.225 mm (PASS)

### 5.3 Reliability (MTTF/MTBF)
*   **MTBF Calculation:** Based on MIL-HDBK-217F.
*   **Critical Component:** Harmonic Drive Gearbox.
*   **L10 Life:** 15,000 hours at rated torque.
*   **System Availability:** 99.98%.

### 5.4 FMEA (Failure Mode and Effects Analysis)
| Component | Failure Mode | Effect | Severity (1-10) | Mitigation |
|-----------|--------------|--------|-----------------|------------|
| J3 Motor  | Overheating  | Loss of holding torque | 9 | Active thermal throttling, NTC thermistors. |
| Encoder   | Signal Noise | Jittery motion | 5 | Differential signaling, shielded cables. |
| Gearbox   | Tooth Skip   | Positional error | 8 | Torque limiters, collision detection software. |

---

## 6. Component and Module Test Plan

### 6.1 Unit Testing
*   **Actuators:** Verify torque constant ($K_t$) and velocity constant ($K_v$) on dynamometer.
*   **PCBs:** Automated Optical Inspection (AOI) and Flying Probe test.

### 6.2 Module Testing (Joint Level)
*   **Endurance:** 100,000 cycle reciprocation test at 50% load.
*   **Thermal:** Continuous operation at max rated current until thermal equilibrium.

### 6.3 System Integration Testing
*   **ISO 9283:** Pose repeatability and accuracy testing using laser tracker.
*   **Payload Test:** Dynamic movement with 5.5kg (110% load) dummy weight.

---

## 7. Bill of Materials and Product Pricing

**Volume:** 10,000 Units | **Target Cost:** $850.00 USD

| Category | Component | Spec | Qty | Unit Cost ($) | Total ($) |
|----------|-----------|------|-----|---------------|-----------|
| **Motors** | High Torque BLDC | 48V, 120Nm | 3 | 120.00 | 360.00 |
| **Motors** | Mid/Low Torque | 48V/24V | 5 | 50.00 (avg) | 250.00 |
| **Gears** | Strain Wave | Size 17/14 | 3 | 80.00 | 240.00 |
| **Gears** | Planetary | Precision | 3 | 40.00 | 120.00 |
| **Electronics** | Driver/Controller | Custom PCB | 1 | 35.00 | 35.00 |
| **Mech** | Housing/Structure | AL6061/CF | 1 | 150.00 | 150.00 |
| **Sundries** | Bearings/Fasteners | Various | Lot | 35.00 | 35.00 |
| **Labor** | Assembly/QA | 1 hr/unit | 1 | 40.00 | 40.00 |

**Total Estimated BOM Cost:** ~$1,230 (Prototype) / **$850 (10k Volume)**

---

© 2023 Nexus Robotics Labs. All Rights Reserved.
