
import { BomItem } from './types';

export const EXECUTIVE_SUMMARY = `
**Project Name:** Nexus-9 Humanoid Single Arm
**Team:** Nexus Robotics Labs
**Date:** Oct 26, 2023

**Overview:**
This proposal outlines the design, simulation, and manufacturing plan for a high-performance, 9-degree-of-freedom (DOF) humanoid robotic arm. Designed for versatility and payload capacity (5kg), this system integrates redundant kinematics (3-Shoulder, 3-Elbow, 2-Wrist, 1-Gripper) to enable complex object manipulation in constrained environments. 

This project bridges the gap between industrial reliability and open-source accessibility, targeting advanced research and prosumer applications.
`;

export const KEY_FEATURES = [
  { title: "Redundant 9-DOF", value: "3-3-2-1 Config", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { title: "Payload Capacity", value: "5.0 kg", icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" },
  { title: "Reach", value: "900 mm", icon: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" },
  { title: "Cost Efficiency", value: "$850 / Unit", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }
];

export const SPECS_DATA = [
  { category: "Functional", items: [
      { label: "Max Payload", value: "5.0 kg (Full Extension)" },
      { label: "Vertical Reach", value: "900 mm" },
      { label: "Horizontal Reach", value: "650 mm" },
      { label: "Max Velocity", value: "> 1.0 m/s (End Effector)" },
      { label: "Repeatability", value: "±0.5 mm" }
  ]},
  { category: "Mechanical", items: [
      { label: "Total Mass", value: "8.07 kg" },
      { label: "Joint Configuration", value: "Shoulder(3) - Elbow(3) - Wrist(2) - Gripper(1)" },
      { label: "Material", value: "AL6061-T6, Carbon Fiber, Nylon 3D Print" },
      { label: "Gearing", value: "Strain Wave (Harmonic) & Planetary" }
  ]},
  { category: "Electrical", items: [
      { label: "Bus Voltage", value: "48V DC" },
      { label: "Communication", value: "EtherCAT / CAN-FD (1kHz Loop)" },
      { label: "Peak Power", value: "450 W" },
      { label: "Safety", value: "Current-based Collision Detection" }
  ]}
];

export const BOM_DATA: BomItem[] = [
    { id: 'M-001', name: 'High Torque BLDC Motor (Shoulder)', spec: '48V, 120Nm Peak, Integrated Driver', qty: 3, unitCost: 120, totalCost: 360, supplier: 'T-Motor / ODrive' },
    { id: 'M-002', name: 'Mid Torque BLDC Motor (Elbow)', spec: '48V, 60Nm Peak', qty: 3, unitCost: 85, totalCost: 255, supplier: 'T-Motor / CubeMars' },
    { id: 'M-003', name: 'Coreless DC Motor (Wrist)', spec: '24V, Precision Gearbox 100:1', qty: 2, unitCost: 45, totalCost: 90, supplier: 'Maxon / Faulhaber' },
    { id: 'M-004', name: 'Linear Actuator (Gripper)', spec: 'NEMA 17 Stepper with Lead Screw', qty: 1, unitCost: 25, totalCost: 25, supplier: 'StepperOnline / Moons' },
    { id: 'S-001', name: 'Strain Wave Gear (Harmonic)', spec: 'Size 17, 100:1 Ratio', qty: 3, unitCost: 80, totalCost: 240, supplier: 'Leaderdrive / Laifual' },
    { id: 'S-002', name: 'Planetary Gearbox', spec: '10:1 Backlash < 3 arcmin', qty: 3, unitCost: 40, totalCost: 120, supplier: 'Neugart / Apex Dynamics' },
    { id: 'E-001', name: 'Main Controller PCB', spec: 'STM32H7, CAN-FD, 8-layer', qty: 1, unitCost: 35, totalCost: 35, supplier: 'JLCPCB / Custom Design' },
    { id: 'M-005', name: 'Structural Housing', spec: 'Aluminum 7075 & Carbon Fiber Tubes', qty: 1, unitCost: 150, totalCost: 150, supplier: 'Xometry / Misumi' },
    { id: 'C-001', name: 'Cabling & Connectors', spec: 'High-flex silicone wire, XT60', qty: 1, unitCost: 20, totalCost: 20, supplier: 'Digikey / Mouser' },
    { id: 'F-001', name: 'Fasteners & Bearings', spec: 'SS304 Screws, Deep Groove Ball Bearings', qty: 1, unitCost: 15, totalCost: 15, supplier: 'McMaster-Carr' },
];
