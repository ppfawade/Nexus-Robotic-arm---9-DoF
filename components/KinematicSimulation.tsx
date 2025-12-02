
import React, { useState, useEffect, useRef } from 'react';
import { JointState, SimulationMetrics } from '../types';
import { generateSimulationInterpretation } from '../services/geminiService';

// --- Types ---
type Vector3 = { x: number; y: number; z: number };
type Matrix4x4 = number[][];
type FrameData = {
    id: number;
    pos: Vector3;
    xAxis: Vector3;
    yAxis: Vector3;
    zAxis: Vector3;
    label: string;
};

// Engineering Properties for AL6061-T6
const AL6061_YIELD_STRENGTH = 276; // MPa
const GRAVITY = 9.81;

interface LinkProps {
    name: string;
    length: number; // meters
    mass: number; // kg
    od: number; // outer diameter meters
    thickness: number; // meters
    cogRatio: number; // distance from proximal joint / length
}

// Derived from PDF Page 4 "Revised" Data
const LINKS: Record<string, LinkProps> = {
    UPPER:   { name: 'Upper Arm', length: 0.45, mass: 1.5, od: 0.050, thickness: 0.0015, cogRatio: 0.5 }, // r1 = 0.225
    FOREARM: { name: 'Forearm',   length: 0.30, mass: 1.5, od: 0.040, thickness: 0.0010, cogRatio: 0.5 }, // r2 = 0.15
    HAND:    { name: 'Hand',      length: 0.15, mass: 1.0, od: 0.040, thickness: 0.0010, cogRatio: 0.5 }  // r3 = 0.075
};

interface StressResult {
    location: string;
    torqueStatic: number;
    torqueDynamic: number;
    stressMPa: number;
    safetyFactor: number;
    color: string;
}

// --- Math Helpers (Standard Transform Matrices) ---

const identity = (): Matrix4x4 => [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
];

const multiplyMatrices = (m1: Matrix4x4, m2: Matrix4x4): Matrix4x4 => {
  const result = Array(4).fill(0).map(() => Array(4).fill(0));
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      for (let k = 0; k < 4; k++) {
        result[r][c] += m1[r][k] * m2[k][c];
      }
    }
  }
  return result;
};

const rotateX = (theta: number): Matrix4x4 => {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    return [
        [1, 0, 0, 0],
        [0, c, -s, 0],
        [0, s, c, 0],
        [0, 0, 0, 1]
    ];
};

const rotateY = (theta: number): Matrix4x4 => {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    return [
        [c, 0, s, 0],
        [0, 1, 0, 0],
        [-s, 0, c, 0],
        [0, 0, 0, 1]
    ];
};

const rotateZ = (theta: number): Matrix4x4 => {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    return [
        [c, -s, 0, 0],
        [s, c, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];
};

const translate = (x: number, y: number, z: number): Matrix4x4 => {
    return [
        [1, 0, 0, x],
        [0, 1, 0, y],
        [0, 0, 1, z],
        [0, 0, 0, 1]
    ];
};

const extractFrame = (m: Matrix4x4, id: number, label: string): FrameData => {
    return {
        id,
        label,
        pos: { x: m[0][3], y: m[1][3], z: m[2][3] },
        xAxis: { x: m[0][0], y: m[1][0], z: m[2][0] },
        yAxis: { x: m[0][1], y: m[1][1], z: m[2][1] },
        zAxis: { x: m[0][2], y: m[1][2], z: m[2][2] }
    };
};

// Calculate Area Moment of Inertia for Hollow Circle
const calculateInertia = (od: number, thickness: number) => {
    const id = od - 2 * thickness;
    return (Math.PI * (Math.pow(od, 4) - Math.pow(id, 4))) / 64;
};

// Calculate Cross Product
const crossProduct = (a: Vector3, b: Vector3): Vector3 => {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    };
};

const magnitude = (v: Vector3) => Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);

// Interpolate Vector
const lerpVector = (v1: Vector3, v2: Vector3, t: number): Vector3 => {
    return {
        x: v1.x + (v2.x - v1.x) * t,
        y: v1.y + (v2.y - v1.y) * t,
        z: v1.z + (v2.z - v1.z) * t
    };
};

const getStressColor = (stressMPa: number) => {
    const ratio = Math.min(stressMPa / AL6061_YIELD_STRENGTH, 1.2); 
    const hue = Math.max(0, 240 - (ratio * 240)); 
    return `hsl(${hue}, 80%, 50%)`;
};

const KinematicSimulation: React.FC = () => {
  // Initialize joints with both angle and targetAngle
  const [joints, setJoints] = useState<JointState[]>([
    // Shoulder Complex
    { id: 'j1', name: 'Shoulder Z (Yaw)', angle: 0, targetAngle: 0, velocity: 0, min: -90, max: 90, axis: 'z', group: 'Shoulder' },
    { id: 'j2', name: 'Shoulder Y (Pitch)', angle: 0, targetAngle: 0, velocity: 0, min: -90, max: 90, axis: 'y', group: 'Shoulder' },
    { id: 'j3', name: 'Shoulder X (Roll)', angle: 0, targetAngle: 0, velocity: 0, min: -45, max: 45, axis: 'x', group: 'Shoulder' }, 
    
    // Elbow Complex
    { id: 'j4', name: 'Elbow Z (Yaw)', angle: -180, targetAngle: -180, velocity: 0, min: -270, max: -90, axis: 'z', group: 'Elbow' },
    { id: 'j5', name: 'Elbow Y (Pitch)', angle: -180, targetAngle: -180, velocity: 0, min: -270, max: -90, axis: 'y', group: 'Elbow' }, 
    { id: 'j6', name: 'Elbow X (Roll)', angle: 0, targetAngle: 0, velocity: 0, min: -45, max: 45, axis: 'x', group: 'Elbow' },
    
    // Wrist Complex
    { id: 'j7_x', name: 'Wrist X (Roll)', angle: 0, targetAngle: 0, velocity: 0, min: -45, max: 45, axis: 'x', group: 'Wrist' }, 
    { id: 'j7_y', name: 'Wrist Y (Pitch)', angle: 0, targetAngle: 0, velocity: 0, min: -45, max: 45, axis: 'y', group: 'Wrist' },
    { id: 'j7_z', name: 'Wrist Z (Yaw)', angle: 0, targetAngle: 0, velocity: 0, min: -45, max: 45, axis: 'z', group: 'Wrist' },
    
    { id: 'j9', name: 'Gripper', angle: 50, targetAngle: 50, velocity: 0, min: 0, max: 100, axis: 'x', group: 'Gripper' }, 
  ]);

  const [loadMass, setLoadMass] = useState(5.0); 
  const [isDynamic, setIsDynamic] = useState(false);
  const [showForces, setShowForces] = useState(true); 
  const [showFrames, setShowFrames] = useState(true);
  const [showStressMap, setShowStressMap] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Camera & Trajectory
  const [camera, setCamera] = useState({ azim: 45, elev: 20, scale: 300, panX: 0, panY: 0 });
  const [trajectory, setTrajectory] = useState<Vector3[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const interactionMode = useRef<'rotate' | 'pan' | null>(null);
  const lastMousePos = useRef<{x: number, y: number} | null>(null);
  
  // Animation & Physics Refs
  const animationFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const isPlayingRef = useRef(isPlaying);
  
  // Analysis Data
  const [precisePos, setPrecisePos] = useState<{x: string, y: string, z: string} | null>(null);
  const [stressResults, setStressResults] = useState<StressResult[]>([]);
  const [jointTorques, setJointTorques] = useState<Record<string, number>>({});
  const [aiInsight, setAiInsight] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reach, setReach] = useState<number>(0);

  // Sync state to ref for animation loop usage
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // --- Physics & Animation Loop ---
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (time: number) => {
        // Calculate Delta Time (seconds)
        const dt = Math.min((time - lastTime) / 1000, 0.1); // Cap at 100ms to prevent explosion
        lastTime = time;

        // Advance animation time if playing
        if (isPlayingRef.current) {
            timeRef.current += dt;
        }

        setJoints(prevJoints => {
            return prevJoints.map((j, i) => {
                let target = j.targetAngle;

                // 1. Animation Override Logic
                if (isPlayingRef.current && j.group !== 'Gripper') {
                    const offset = i * 0.5;
                    // Gentle sinusoidal motion
                    const amp = (j.max - j.min) * 0.15;
                    const center = (j.max + j.min) / 2;
                    // Use timeRef for smooth continuous wave
                    target = center + Math.sin(timeRef.current * 1.5 + offset) * amp;
                }

                // 2. Physics Controller (Spring-Damper)
                // Tuning constants for "Heavy Machinery" feel
                const stiffness = 120; // Proportional gain (Kp)
                const damping = 15;    // Derivative gain (Kd)
                
                // Heuristic Inertia: Shoulder joints have more mass/inertia than wrist
                let inertia = 1.0;
                if (j.group === 'Shoulder') inertia = 2.5;
                if (j.group === 'Elbow') inertia = 1.5;
                if (j.group === 'Wrist') inertia = 0.5;

                // Acceleration = Force / Mass
                const error = target - j.angle;
                const acceleration = (stiffness * error - damping * j.velocity) / inertia;
                
                // Euler Integration
                const newVelocity = j.velocity + acceleration * dt;
                const newAngle = j.angle + newVelocity * dt;

                return {
                    ...j,
                    angle: newAngle,
                    velocity: newVelocity,
                    targetAngle: target // Persist the target (or the animated one)
                };
            });
        });

        animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, []); // Run effect once, internal state handles updates

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const zoomSensitivity = 0.5;
        setCamera(prev => ({ 
            ...prev, 
            scale: Math.max(50, Math.min(3000, prev.scale - e.deltaY * zoomSensitivity)) 
        }));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  const handleSliderChange = (id: string, val: number) => {
    // Only update the target, physics will handle the rest
    setJoints(prev => prev.map(j => j.id === id ? { ...j, targetAngle: val } : j));
  };

  const resetSimulation = () => {
      setIsPlaying(false);
      setJoints(joints.map(j => {
          let resetAngle = 0;
          if (j.id === 'j4' || j.id === 'j5') resetAngle = -180;
          else if (j.id === 'j9') resetAngle = 50;
          else resetAngle = 0; 
          
          return { ...j, angle: resetAngle, targetAngle: resetAngle, velocity: 0 };
      }));
      setTrajectory([]);
  };

  const exportData = () => {
      const data = JSON.stringify({
          timestamp: new Date().toISOString(),
          configuration: joints,
          metrics: {
              endEffector: precisePos,
              reach: reach.toFixed(3) + "m",
              stressData: stressResults,
              torques: jointTorques
          },
          trajectory
      }, null, 2);
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bosch_p1_sim.json`;
      a.click();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        interactionMode.current = 'pan';
    } else {
        interactionMode.current = 'rotate';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !lastMousePos.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    
    if (interactionMode.current === 'rotate') {
        setCamera(prev => ({
            ...prev,
            azim: prev.azim - dx * 0.5,
            elev: Math.max(-89, Math.min(89, prev.elev + dy * 0.5))
        }));
    } else if (interactionMode.current === 'pan') {
        setCamera(prev => ({
            ...prev,
            panX: prev.panX + dx,
            panY: prev.panY + dy
        }));
    }
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    interactionMode.current = null;
    lastMousePos.current = null;
  };

  const runAiAnalysis = async () => {
      setIsSimulating(true);
      const metrics = { stressResults, loadMass, isDynamic };
      const txt = await generateSimulationInterpretation(metrics);
      setAiInsight(txt);
      setIsSimulating(false);
  };

  // --- Render Loop (Canvas & Physics Calculations) ---
  useEffect(() => {
    const toRad = (deg: number) => deg * Math.PI / 180;
    
    // --- FORWARD KINEMATICS (Explicit Transforms) ---
    // Convention: Local X axis is "Forward" along the link.
    // Order: Rotate Z (Yaw) -> Rotate Y (Pitch) -> Rotate X (Roll) -> Translate X (Link Length)
    
    let TGlobal = identity();
    const frames: FrameData[] = [extractFrame(TGlobal, 0, 'Base')];

    // 1. Shoulder Complex (3 DOF)
    // J1: Z (Yaw)
    TGlobal = multiplyMatrices(TGlobal, rotateZ(toRad(joints[0].angle)));
    const frameJ1 = extractFrame(TGlobal, 1, 'J1 (Sh_Z)');
    
    // J2: Y (Pitch)
    TGlobal = multiplyMatrices(TGlobal, rotateY(toRad(joints[1].angle)));
    const frameJ2 = extractFrame(TGlobal, 2, 'J2 (Sh_Y)');

    // J3: X (Roll)
    TGlobal = multiplyMatrices(TGlobal, rotateX(toRad(joints[2].angle)));
    const frameJ3 = extractFrame(TGlobal, 3, 'J3 (Sh_X)');
    // --> UPPER ARM STARTS HERE
    
    // Translate Upper Arm Length
    TGlobal = multiplyMatrices(TGlobal, translate(LINKS.UPPER.length, 0, 0));
    
    // 2. Elbow Complex (3 DOF)
    // J4: Z (Yaw)
    TGlobal = multiplyMatrices(TGlobal, rotateZ(toRad(joints[3].angle)));
    const frameJ4 = extractFrame(TGlobal, 4, 'J4 (Elb_Z)');
    
    // J5: Y (Pitch)
    TGlobal = multiplyMatrices(TGlobal, rotateY(toRad(joints[4].angle)));
    const frameJ5 = extractFrame(TGlobal, 5, 'J5 (Elb_Y)');
    
    // J6: X (Roll)
    TGlobal = multiplyMatrices(TGlobal, rotateX(toRad(joints[5].angle)));
    const frameJ6 = extractFrame(TGlobal, 6, 'J6 (Elb_X)');
    // --> FOREARM STARTS HERE

    // Translate Forearm Length
    TGlobal = multiplyMatrices(TGlobal, translate(LINKS.FOREARM.length, 0, 0));

    // 3. Wrist Complex (3 DOF)
    // J7_X: X (Roll)
    TGlobal = multiplyMatrices(TGlobal, rotateX(toRad(joints[6].angle)));
    const frameJ7X = extractFrame(TGlobal, 7, 'J7 (Wr_X)');

    // J7_Y: Y (Pitch)
    TGlobal = multiplyMatrices(TGlobal, rotateY(toRad(joints[7].angle)));
    const frameJ7Y = extractFrame(TGlobal, 8, 'J8 (Wr_Y)');
    
    // J7_Z: Z (Yaw) - Added
    TGlobal = multiplyMatrices(TGlobal, rotateZ(toRad(joints[8].angle)));
    const frameJ7Z = extractFrame(TGlobal, 9, 'J9 (Wr_Z)');

    // --> HAND STARTS HERE

    // End Effector
    TGlobal = multiplyMatrices(TGlobal, translate(LINKS.HAND.length, 0, 0));
    const endEffectorFrame = extractFrame(TGlobal, 10, 'EE');

    // Store all significant frames for rendering
    const allFrames = [
        frames[0], // Base
        frameJ1, frameJ2, frameJ3, // Shoulder
        frameJ4, frameJ5, frameJ6, // Elbow
        frameJ7X, frameJ7Y, frameJ7Z, // Wrist
        endEffectorFrame           // EE
    ];

    const shoulderEnd = frameJ3.pos;
    const elbowPos = frameJ4.pos; 
    const wristPos = frameJ7X.pos;
    const endEffector = endEffectorFrame.pos;

    // CoG Calculation (Midpoints)
    const cogUpper = lerpVector(frameJ3.pos, frameJ4.pos, LINKS.UPPER.cogRatio);
    const cogFore = lerpVector(frameJ6.pos, frameJ7X.pos, LINKS.FOREARM.cogRatio);
    // Approximate Hand CoG using new Wrist Z frame as base
    const cogHand = lerpVector(frameJ7Z.pos, endEffector, LINKS.HAND.cogRatio);

    // Metrics
    setPrecisePos({
        x: (endEffector.x * 1000).toFixed(2),
        y: (endEffector.y * 1000).toFixed(2),
        z: (endEffector.z * 1000).toFixed(2)
    });
    setReach(magnitude({x: endEffector.x - frames[0].pos.x, y: endEffector.y - frames[0].pos.y, z: endEffector.z - frames[0].pos.z}));

    // --- TORQUE & STRESS ---
    const calculateMoment = (pivot: Vector3, loads: {mass: number, pos: Vector3}[]) => {
        let totalM = {x:0, y:0, z:0};
        loads.forEach(L => {
            const r = {x: L.pos.x - pivot.x, y: L.pos.y - pivot.y, z: L.pos.z - pivot.z};
            const F = {x: 0, y: 0, z: -L.mass * GRAVITY};
            const M = crossProduct(r, F);
            totalM.x += M.x; totalM.y += M.y; totalM.z += M.z;
        });
        return magnitude(totalM);
    };

    const loadSet = [
        {mass: LINKS.UPPER.mass, pos: cogUpper},
        {mass: LINKS.FOREARM.mass, pos: cogFore},
        {mass: LINKS.HAND.mass, pos: cogHand},
        {mass: loadMass, pos: endEffector}
    ];

    const torqueMap: Record<string, number> = {};
    // Calculate torque for each joint axis
    // Shoulder (J2 Pitch is main torque bearer)
    torqueMap['j2'] = calculateMoment(frameJ2.pos, loadSet);
    // Elbow (J5 Pitch)
    torqueMap['j5'] = calculateMoment(frameJ5.pos, loadSet.slice(1));
    // Wrist (J7_Y Pitch)
    torqueMap['j7_y'] = calculateMoment(frameJ7Y.pos, loadSet.slice(2));

    // Fill others with approximate small values for UI
    joints.forEach(j => { if(!torqueMap[j.id]) torqueMap[j.id] = 0.1; });
    setJointTorques(torqueMap);

    const calcStress = (torque: number, link: LinkProps) => {
        const I = calculateInertia(link.od, link.thickness);
        const c = link.od / 2;
        return ((torque * c) / I) / 1e6; // MPa
    };

    const stressS = calcStress(torqueMap['j2'], LINKS.UPPER);
    const stressE = calcStress(torqueMap['j5'], LINKS.FOREARM);
    const stressW = calcStress(torqueMap['j7_y'], LINKS.HAND);

    setStressResults([
        { location: 'Shoulder', torqueStatic: torqueMap['j2'], torqueDynamic: 0, stressMPa: stressS, safetyFactor: AL6061_YIELD_STRENGTH/stressS, color: getStressColor(stressS) },
        { location: 'Elbow', torqueStatic: torqueMap['j5'], torqueDynamic: 0, stressMPa: stressE, safetyFactor: AL6061_YIELD_STRENGTH/stressE, color: getStressColor(stressE) },
        { location: 'Wrist', torqueStatic: torqueMap['j7_y'], torqueDynamic: 0, stressMPa: stressW, safetyFactor: AL6061_YIELD_STRENGTH/stressW, color: getStressColor(stressW) },
    ]);

    // Update Trajectory
    setTrajectory(prev => {
        const last = prev[prev.length - 1];
        if (last && Math.abs(last.x - endEffector.x) < 0.005 && Math.abs(last.y - endEffector.y) < 0.005) return prev;
        return [...prev, endEffector].slice(-150);
    });

    // --- RENDER ---
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const project = (v: Vector3) => {
        const radAzim = toRad(camera.azim);
        const radElev = toRad(camera.elev);
        const scale = camera.scale;
        
        // World -> Camera Rotate
        let x = v.x, y = v.y, z = v.z;
        // Rotate around Z (Azim)
        let x1 = x*Math.cos(radAzim) - y*Math.sin(radAzim);
        let y1 = x*Math.sin(radAzim) + y*Math.cos(radAzim);
        let z1 = z;
        // Rotate around X (Elev) - Z becomes Up on screen Y
        let y2 = z1*Math.cos(radElev) - x1*Math.sin(radElev);
        let z2 = z1*Math.sin(radElev) + x1*Math.cos(radElev);
        let x2 = y1;

        return {
            x: w/2 + x2 * scale + camera.panX,
            y: h/1.5 - y2 * scale + camera.panY,
            z: z2 // Depth for sorting if needed
        };
    };

    const drawLine = (p1: Vector3, p2: Vector3, color: string, width: number) => {
        const v1 = project(p1);
        const v2 = project(p2);
        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    const drawAxes = (frame: FrameData, size: number) => {
        const o = frame.pos;
        const x = {x: o.x + frame.xAxis.x*size, y: o.y + frame.xAxis.y*size, z: o.z + frame.xAxis.z*size};
        const y = {x: o.x + frame.yAxis.x*size, y: o.y + frame.yAxis.y*size, z: o.z + frame.yAxis.z*size};
        const z = {x: o.x + frame.zAxis.x*size, y: o.y + frame.zAxis.y*size, z: o.z + frame.zAxis.z*size};
        
        drawLine(o, x, '#ef4444', 2); // X Red
        drawLine(o, y, '#22c55e', 2); // Y Green
        drawLine(o, z, '#3b82f6', 2); // Z Blue
    };

    // Draw Human
    const head = project({x: -0.2, y: 0, z: 0.6});
    ctx.strokeStyle = '#475569'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(head.x, head.y, 20, 0, Math.PI*2); ctx.stroke();
    drawLine({x:-0.2, y:0, z:0.5}, {x:-0.2, y:0, z:0}, '#475569', 2); // Spine
    drawLine({x:0, y:0, z:0.45}, {x:-0.4, y:0, z:0.45}, '#475569', 2); // Shoulders

    // Draw Links
    // Upper Arm: J3 to J4
    drawLine(frameJ3.pos, frameJ4.pos, showStressMap ? getStressColor(stressS) : '#94a3b8', 12);
    // Forearm: J6 to J7_X
    drawLine(frameJ6.pos, frameJ7X.pos, showStressMap ? getStressColor(stressE) : '#94a3b8', 10);
    // Hand: J7_Z to EE (using the new J7_Z frame as the start of the hand link visual)
    drawLine(frameJ7Z.pos, endEffectorFrame.pos, showStressMap ? getStressColor(stressW) : '#94a3b8', 8);

    // Draw Joints
    [frameJ1, frameJ2, frameJ3, frameJ4, frameJ5, frameJ6, frameJ7X, frameJ7Y, frameJ7Z].forEach(f => {
        const p = project(f.pos);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI*2); ctx.fill();
        if(showFrames) drawAxes(f, 0.08);
    });

    // Gripper Visualization
    const gripperJ = joints.find(j => j.id === 'j9');
    const isGripperMoving = gripperJ && Math.abs(gripperJ.velocity) > 0.1;

    // Use EE frame Y-axis for finger spread direction
    const openDist = gripperJ ? (gripperJ.angle / 100) * 0.04 : 0.02; // Max 4cm spread from center
    const ee = endEffectorFrame;
    const fingerLen = 0.06;

    // Calculate Finger Bases (offset along Y axis of EE frame)
    const f1Base = {
        x: ee.pos.x + ee.yAxis.x * openDist,
        y: ee.pos.y + ee.yAxis.y * openDist,
        z: ee.pos.z + ee.yAxis.z * openDist
    };
    const f2Base = {
        x: ee.pos.x - ee.yAxis.x * openDist,
        y: ee.pos.y - ee.yAxis.y * openDist,
        z: ee.pos.z - ee.yAxis.z * openDist
    };

    // Calculate Finger Tips (offset along X axis of EE frame)
    const f1Tip = {
        x: f1Base.x + ee.xAxis.x * fingerLen,
        y: f1Base.y + ee.xAxis.y * fingerLen,
        z: f1Base.z + ee.xAxis.z * fingerLen
    };
    const f2Tip = {
        x: f2Base.x + ee.xAxis.x * fingerLen,
        y: f2Base.y + ee.xAxis.y * fingerLen,
        z: f2Base.z + ee.xAxis.z * fingerLen
    };

    // Project Points
    const pBase1 = project(f1Base);
    const pTip1 = project(f1Tip);
    const pBase2 = project(f2Base);
    const pTip2 = project(f2Tip);
    const pCenter = project(ee.pos);

    ctx.save();
    
    // Activity Glow
    if (isGripperMoving) {
        const pulse = (Math.sin(Date.now() / 150) + 1) * 0.5; // 0 to 1
        ctx.shadowBlur = 15 + pulse * 10;
        ctx.shadowColor = `rgba(14, 165, 233, ${0.6 + pulse * 0.4})`; // Pulsing Blue/Cyan glow
        ctx.fillStyle = `rgba(14, 165, 233, ${0.8 + pulse * 0.2})`;
    } else {
        ctx.fillStyle = '#0ea5e9';
        ctx.shadowBlur = 0;
    }

    // Draw Base Hub
    ctx.beginPath(); 
    ctx.arc(pCenter.x, pCenter.y, 6, 0, Math.PI*2); 
    ctx.fill();

    // Draw Fingers (Simple Lines for now, or thick lines)
    ctx.strokeStyle = isGripperMoving ? '#38bdf8' : '#0284c7';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(pBase1.x, pBase1.y); ctx.lineTo(pTip1.x, pTip1.y);
    ctx.moveTo(pBase2.x, pBase2.y); ctx.lineTo(pTip2.x, pTip2.y);
    ctx.stroke();

    ctx.restore();

  }, [joints, camera, loadMass, isDynamic, showForces, showFrames, showStressMap]);

  const getMaxTorque = (group: string) => {
      switch(group) {
          case 'Shoulder': return 120;
          case 'Elbow': return 60;
          case 'Wrist': return 20;
          default: return 10;
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 flex flex-col gap-6">
        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-gray-800">Simulation Control</h3>
                 <span className={`text-xs px-2 py-1 rounded font-bold ${isPlaying ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                     {isPlaying ? 'RUNNING' : 'IDLE'}
                 </span>
             </div>
             
             <div className="flex gap-2 mb-4">
                 <button onClick={() => setIsPlaying(!isPlaying)} className={`flex-1 py-2 rounded text-sm font-medium transition ${isPlaying ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                     {isPlaying ? 'PAUSE' : 'PLAY ANIMATION'}
                 </button>
                 <button onClick={resetSimulation} className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                     RESET
                 </button>
                 <button onClick={exportData} className="px-4 py-2 bg-blue-50 text-blue-700 rounded text-sm font-medium">JSON</button>
             </div>
             
             <div className="mb-4 pt-2 border-t border-gray-100">
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-600">Payload Mass</span>
                    <span className="font-mono text-blue-600">{loadMass.toFixed(1)} kg</span>
                </div>
                <input type="range" min="0" max="10" step="0.1" value={loadMass} onChange={(e) => setLoadMass(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
             </div>

             <div className="grid grid-cols-2 gap-2">
                 <button onClick={() => setShowStressMap(!showStressMap)} className={`text-xs py-1 rounded border ${showStressMap ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>Stress Map</button>
                 <button onClick={() => setShowFrames(!showFrames)} className={`text-xs py-1 rounded border ${showFrames ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>Joint Frames</button>
                 <button onClick={() => setCamera({ azim: 45, elev: 20, scale: 300, panX: 0, panY: 0 })} className="text-xs py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50">Reset Camera</button>
             </div>
        </div>

        {/* Joint Sliders */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 overflow-y-auto max-h-[500px]">
            {['Shoulder', 'Elbow', 'Wrist', 'Gripper'].map(group => (
                <div key={group} className="mb-6 last:mb-0">
                    <h4 className="text-xs uppercase font-bold text-gray-500 border-b pb-1 mb-3">{group}</h4>
                    {joints.filter(j => j.group === group).map(j => {
                        const torque = jointTorques[j.id] || 0;
                        const maxTorque = getMaxTorque(j.group);
                        const usagePercent = Math.min(100, (torque / maxTorque) * 100);
                        const usageColor = usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500';

                        return (
                        <div key={j.id} className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-gray-700">{j.name}</span>
                                <div className="flex gap-2">
                                     {/* Show Actual vs Target for Physics Visualization */}
                                     <span className="font-mono text-gray-400 text-xs mt-0.5">{j.targetAngle.toFixed(0)}°</span>
                                     <span className="font-mono text-blue-600 font-bold">{j.angle.toFixed(1)}°</span>
                                </div>
                            </div>
                            <input 
                                type="range" 
                                min={j.min} 
                                max={j.max} 
                                step="1" 
                                value={j.targetAngle} // Controls setpoint
                                onChange={(e) => handleSliderChange(j.id, parseFloat(e.target.value))} 
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-1" 
                            />
                            {j.group !== 'Gripper' && (
                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                    <span className="w-10 font-mono text-right">{torque.toFixed(1)}Nm</span>
                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all duration-300 ${usageColor}`} style={{width: `${usagePercent}%`}}></div>
                                    </div>
                                    <span className="w-8 font-mono text-gray-400">{usagePercent.toFixed(0)}%</span>
                                </div>
                            )}
                        </div>
                    )})}
                </div>
            ))}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        {/* 3D Viewport */}
        <div className="bg-gray-900 rounded-xl shadow-lg p-1 relative overflow-hidden border border-gray-700">
             <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md p-3 rounded border border-gray-700 text-white text-xs font-mono space-y-1 pointer-events-none">
                <div className="text-blue-400 font-bold mb-1">ENGINEERING SIMULATION</div>
                <div>MATERIAL: AL6061-T6 (Yield: {AL6061_YIELD_STRENGTH} MPa)</div>
                <div>REACH: {reach.toFixed(3)} m</div>
                {precisePos && <div>EE: [{precisePos.x}, {precisePos.y}, {precisePos.z}] mm</div>}
             </div>
             
             <canvas 
                ref={canvasRef} width={800} height={500} 
                className={`w-full h-auto bg-gradient-to-b from-gray-800 to-gray-900 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
             />
        </div>

        {/* Analysis */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <h3 className="font-bold text-gray-800 text-sm mb-4">Structural Analysis</h3>
            <table className="min-w-full text-xs">
                <thead>
                    <tr className="text-gray-500 border-b">
                        <th className="text-left pb-2">Location</th>
                        <th className="text-right pb-2">Load (Nm)</th>
                        <th className="text-right pb-2">Stress (MPa)</th>
                        <th className="text-right pb-2">Safety Factor</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {stressResults.map((res, i) => (
                        <tr key={i}>
                            <td className="py-2 font-medium flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: res.color}}></div>
                                {res.location}
                            </td>
                            <td className="py-2 text-right font-mono">{res.torqueStatic.toFixed(1)}</td>
                            <td className="py-2 text-right font-mono">{res.stressMPa.toFixed(1)}</td>
                            <td className="py-2 text-right font-mono">
                                <span className={`${res.safetyFactor < 1.5 ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                                    {res.safetyFactor.toFixed(2)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default KinematicSimulation;
