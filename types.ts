
export enum Tab {
  OVERVIEW = 'Overview',
  SPECS = 'Specs',
  KINEMATICS = 'Kinematics',
  BOM = 'BOM'
}

export interface JointState {
  id: string;
  name: string;
  angle: number;
  targetAngle: number; // The desired setpoint
  velocity: number; // deg/s
  min: number;
  max: number;
  axis: 'x' | 'y' | 'z';
  group: 'Shoulder' | 'Elbow' | 'Wrist' | 'Gripper';
}

export interface SimulationMetrics {
  endEffectorPos: { x: number; y: number; z: number };
  maxTorque: number;
  powerConsumption: number;
  safetyFactor: number;
}

export interface BomItem {
  id: string;
  name: string;
  spec: string;
  qty: number;
  unitCost: number;
  totalCost: number;
  supplier: string;
}
