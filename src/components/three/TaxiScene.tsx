import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * TaxiScene – a real-time 3D night-drive scene built with Three.js.
 * A low-poly yellow taxi drives along an endless night road with
 * street lamps, passing buildings, stars and a mouse-parallax camera.
 * All geometry is procedural – no external 3D models needed.
 */

const YELLOW = '#f5b301';
const DARK = '#111827';

/* ---------------------------------- Taxi ---------------------------------- */

const Wheel: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.x -= delta * 9;
  });
  return (
    <group position={position} ref={ref}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.22, 20]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.17, 0.17, 0.23, 12]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
};

const Taxi: React.FC = () => {
  const group = useRef<THREE.Group>(null);
  const sign = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      // gentle suspension bob + tiny sway, like a real drive
      group.current.position.y = 0.02 + Math.sin(t * 6) * 0.015;
      group.current.rotation.z = Math.sin(t * 3.1) * 0.008;
      group.current.rotation.y = Math.sin(t * 0.7) * 0.03;
    }
    if (sign.current) {
      // taxi roof sign glow pulse
      sign.current.emissiveIntensity = 0.9 + Math.sin(t * 4) * 0.35;
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      {/* main body */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.5, 0.5, 3.1]} />
        <meshStandardMaterial color={YELLOW} metalness={0.35} roughness={0.35} />
      </mesh>
      {/* cabin */}
      <mesh position={[0, 0.98, -0.1]} castShadow>
        <boxGeometry args={[1.35, 0.5, 1.7]} />
        <meshStandardMaterial color={YELLOW} metalness={0.35} roughness={0.35} />
      </mesh>
      {/* windows */}
      <mesh position={[0, 0.99, -0.1]}>
        <boxGeometry args={[1.37, 0.36, 1.5]} />
        <meshStandardMaterial color="#0b1220" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* windshield */}
      <mesh position={[0, 0.95, 0.82]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[1.3, 0.04, 0.55]} />
        <meshStandardMaterial color="#0b1220" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* black checker stripe */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.52, 0.14, 3.11]} />
        <meshStandardMaterial color={DARK} roughness={0.6} />
      </mesh>
      {/* bumpers */}
      <mesh position={[0, 0.33, 1.58]}>
        <boxGeometry args={[1.45, 0.18, 0.12]} />
        <meshStandardMaterial color="#374151" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.33, -1.58]}>
        <boxGeometry args={[1.45, 0.18, 0.12]} />
        <meshStandardMaterial color="#374151" roughness={0.5} />
      </mesh>
      {/* roof TAXI sign */}
      <mesh position={[0, 1.32, -0.1]}>
        <boxGeometry args={[0.62, 0.18, 0.24]} />
        <meshStandardMaterial
          ref={sign}
          color="#fff7d6"
          emissive={YELLOW}
          emissiveIntensity={1}
        />
      </mesh>
      {/* headlights */}
      {[-0.5, 0.5].map((x) => (
        <group key={`hl${x}`}>
          <mesh position={[x, 0.52, 1.56]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color="#fffbe6" emissive="#fff2b3" emissiveIntensity={2} />
          </mesh>
          <spotLight
            position={[x, 0.55, 1.6]}
            target-position={[x, 0, 8]}
            angle={0.5}
            penumbra={0.6}
            intensity={12}
            distance={14}
            color="#ffedad"
          />
        </group>
      ))}
      {/* tail lights */}
      {[-0.55, 0.55].map((x) => (
        <mesh key={`tl${x}`} position={[x, 0.55, -1.57]}>
          <boxGeometry args={[0.18, 0.1, 0.05]} />
          <meshStandardMaterial color="#7f1d1d" emissive="#ef4444" emissiveIntensity={1.6} />
        </mesh>
      ))}
      {/* wheels */}
      <Wheel position={[-0.72, 0.32, 1.0]} />
      <Wheel position={[0.72, 0.32, 1.0]} />
      <Wheel position={[-0.72, 0.32, -1.05]} />
      <Wheel position={[0.72, 0.32, -1.05]} />
    </group>
  );
};

/* ------------------------------ Moving world ------------------------------ */

const ROAD_SPEED = 7;
const LOOP = 60; // world loop length

/** Endless dashed centre-line + side lines that slide toward the camera. */
const Road: React.FC = () => {
  const dashes = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!dashes.current) return;
    dashes.current.position.z -= delta * ROAD_SPEED;
    if (dashes.current.position.z < -4) dashes.current.position.z += 4;
  });

  return (
    <group>
      {/* asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]} receiveShadow>
        <planeGeometry args={[9, LOOP + 40]} />
        <meshStandardMaterial color="#1a2030" roughness={0.95} />
      </mesh>
      {/* sidewalks */}
      {[-5.4, 5.4].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.06, -10]}>
          <planeGeometry args={[1.8, LOOP + 40]} />
          <meshStandardMaterial color="#242b3d" roughness={0.95} />
        </mesh>
      ))}
      {/* sliding centre dashes */}
      <group ref={dashes}>
        {Array.from({ length: 26 }, (_, i) => (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.02, i * 4 - 40]}
          >
            <planeGeometry args={[0.16, 1.6]} />
            <meshStandardMaterial color="#fbbf24" emissive="#b45309" emissiveIntensity={0.25} />
          </mesh>
        ))}
      </group>
      {/* solid side lines */}
      {[-3.9, 3.9].map((x) => (
        <mesh key={`line${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, -10]}>
          <planeGeometry args={[0.12, LOOP + 40]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
      ))}
    </group>
  );
};

/** A single street lamp that loops toward the camera forever. */
const StreetLamp: React.FC<{ x: number; z0: number }> = ({ x, z0 }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.z -= delta * ROAD_SPEED;
    if (ref.current.position.z < -18) ref.current.position.z += LOOP;
  });
  const facing = x > 0 ? -1 : 1;
  return (
    <group ref={ref} position={[x, 0, z0]}>
      <mesh position={[0, 1.9, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 3.8, 8]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      <mesh position={[facing * 0.55, 3.75, 0]} rotation={[0, 0, facing * -0.25]}>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      <mesh position={[facing * 1.05, 3.62, 0]}>
        <sphereGeometry args={[0.13, 10, 10]} />
        <meshStandardMaterial color="#fff7d6" emissive="#fde68a" emissiveIntensity={2.2} />
      </mesh>
      <pointLight
        position={[facing * 1.05, 3.4, 0]}
        intensity={5}
        distance={9}
        decay={2}
        color="#fde68a"
      />
    </group>
  );
};

/** Dark building silhouettes with lit windows drifting past. */
const Building: React.FC<{
  x: number;
  z0: number;
  w: number;
  h: number;
  d: number;
  seed: number;
}> = ({ x, z0, w, h, d, seed }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.z -= delta * ROAD_SPEED;
    if (ref.current.position.z < -25) ref.current.position.z += LOOP;
  });

  const windows = useMemo(() => {
    const rng = (n: number) => {
      const s = Math.sin(seed * 999 + n * 78.233) * 43758.5453;
      return s - Math.floor(s);
    };
    const out: { pos: [number, number, number]; lit: boolean }[] = [];
    const cols = Math.max(2, Math.floor(w / 0.7));
    const rows = Math.max(3, Math.floor(h / 0.8));
    const face = x > 0 ? -1 : 1;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        out.push({
          pos: [
            face * (w / 2 + 0.01),
            0.6 + r * (h - 1) / rows,
            -d / 2 + 0.4 + c * (d - 0.8) / cols,
          ],
          lit: rng(c * 13 + r * 7) > 0.62,
        });
      }
    }
    return out;
  }, [w, h, d, x, seed]);

  return (
    <group ref={ref} position={[x, 0, z0]}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#0d1322" roughness={0.9} />
      </mesh>
      {windows.map((wn, i) => (
        <mesh key={i} position={wn.pos} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.28, 0.34]} />
          <meshStandardMaterial
            color={wn.lit ? '#fde68a' : '#111827'}
            emissive={wn.lit ? '#f59e0b' : '#000000'}
            emissiveIntensity={wn.lit ? 1.1 : 0}
          />
        </mesh>
      ))}
    </group>
  );
};

/** Star field. */
const Stars: React.FC = () => {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const N = 350;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 90;
      pos[i * 3 + 1] = 6 + Math.random() * 30;
      pos[i * 3 + 2] = -20 + Math.random() * 60;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geom}>
      <pointsMaterial color="#cbd5e1" size={0.09} sizeAttenuation transparent opacity={0.8} />
    </points>
  );
};

/* --------------------------------- Camera --------------------------------- */

const CameraRig: React.FC = () => {
  const mouse = useRef({ x: 0, y: 0 });
  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    const targetX = 3.2 + mouse.current.x * 0.9;
    const targetY = 2.1 - mouse.current.y * 0.5 + Math.sin(t * 0.5) * 0.08;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.position.z = 5.2;
    camera.lookAt(0, 0.7, -1.5);
  });
  return null;
};

/* --------------------------------- Scene ---------------------------------- */

const buildings = [
  { x: -8.5, z0: 4, w: 3, h: 7, d: 5, seed: 1 },
  { x: -9.5, z0: 14, w: 3.5, h: 10, d: 6, seed: 2 },
  { x: -8, z0: 26, w: 2.8, h: 5.5, d: 5, seed: 3 },
  { x: -9, z0: 38, w: 3.2, h: 8.5, d: 6, seed: 4 },
  { x: -8.7, z0: 50, w: 3, h: 6.5, d: 5, seed: 5 },
  { x: 8.5, z0: 8, w: 3, h: 9, d: 5, seed: 6 },
  { x: 9.2, z0: 20, w: 3.4, h: 6, d: 6, seed: 7 },
  { x: 8.2, z0: 32, w: 2.9, h: 11, d: 5, seed: 8 },
  { x: 9, z0: 44, w: 3.1, h: 7, d: 6, seed: 9 },
];

const lamps = [
  { x: -4.9, z0: 0 },
  { x: -4.9, z0: 15 },
  { x: -4.9, z0: 30 },
  { x: -4.9, z0: 45 },
  { x: 4.9, z0: 7.5 },
  { x: 4.9, z0: 22.5 },
  { x: 4.9, z0: 37.5 },
  { x: 4.9, z0: 52.5 },
];

const TaxiScene: React.FC = () => {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [3.2, 2.1, 5.2], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <fog attach="fog" args={['#0b1020', 14, 55]} />
      <ambientLight intensity={0.25} color="#93c5fd" />
      <directionalLight position={[6, 12, 4]} intensity={0.5} color="#bfdbfe" castShadow />

      <Stars />
      <Road />
      {lamps.map((l, i) => (
        <StreetLamp key={i} {...l} />
      ))}
      {buildings.map((b, i) => (
        <Building key={i} {...b} />
      ))}
      <Taxi />
      <CameraRig />
    </Canvas>
  );
};

export default TaxiScene;
