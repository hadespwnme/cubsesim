import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  COLOR_HEX,
  getEffectiveQuarterTurns,
  getMoveDefinition,
  isCubieAffected,
} from '../cube/cube.js';
import {
  dragAxisFromScreenDelta,
  notationFromCubeDrag,
} from '../cube/dragNotation.js';

const CUBIE_GAP = 1.04;
const CUBIE_SIZE = 0.96;
const STICKER_OFFSET = 0.486;
const STICKER_SIZE = 0.7;
const ANIMATION_SECONDS = 0.24;

const STICKER_TRANSFORMS = {
  U: { position: [0, STICKER_OFFSET, 0], rotation: [-Math.PI / 2, 0, 0] },
  D: { position: [0, -STICKER_OFFSET, 0], rotation: [Math.PI / 2, 0, 0] },
  F: { position: [0, 0, STICKER_OFFSET], rotation: [0, 0, 0] },
  B: { position: [0, 0, -STICKER_OFFSET], rotation: [0, Math.PI, 0] },
  R: { position: [STICKER_OFFSET, 0, 0], rotation: [0, Math.PI / 2, 0] },
  L: { position: [-STICKER_OFFSET, 0, 0], rotation: [0, -Math.PI / 2, 0] },
};

export default function CubeScene({
  activeMove,
  cube,
  onMoveComplete,
  onMoveRequest,
}) {
  const [cubeDragActive, setCubeDragActive] = useState(false);
  const [viewRotation, setViewRotation] = useState({ x: 0, y: 0, z: 0 });
  const rootRotation = useMemo(
    () => new THREE.Euler(viewRotation.x, viewRotation.y, viewRotation.z),
    [viewRotation],
  );

  return (
    <Canvas
      camera={{ position: [5, 5, 6], fov: 42 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      shadows
    >
      <color attach="background" args={['#fff7d6']} />
      <CameraSetup />
      <ambientLight intensity={1.6} />
      <directionalLight position={[5, 8, 6]} intensity={2.4} castShadow />
      <directionalLight position={[-6, -4, -5]} intensity={1.1} />
      <ViewDragPlane
        disabled={cubeDragActive}
        setViewRotation={setViewRotation}
      />
      <RubikAssembly
        activeMove={activeMove}
        cube={cube}
        onMoveComplete={onMoveComplete}
        onMoveRequest={onMoveRequest}
        rootRotation={rootRotation}
        setCubeDragActive={setCubeDragActive}
        viewRotation={viewRotation}
      />
    </Canvas>
  );
}

function CameraSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}

function ViewDragPlane({ disabled, setViewRotation }) {
  const dragRef = useRef(null);

  function handlePointerDown(event) {
    if (disabled) return;

    event.stopPropagation();
    event.target.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
    };
  }

  function handlePointerMove(event) {
    if (disabled || !dragRef.current) return;

    event.stopPropagation();
    const nextX = event.nativeEvent.clientX;
    const nextY = event.nativeEvent.clientY;
    const deltaX = nextX - dragRef.current.x;
    const deltaY = nextY - dragRef.current.y;

    dragRef.current = {
      ...dragRef.current,
      x: nextX,
      y: nextY,
    };

    setViewRotation((current) => ({
      x: clamp(current.x + deltaY * 0.006, -1.2, 1.2),
      y: current.y + deltaX * 0.006,
      z: 0,
    }));
  }

  function handlePointerUp(event) {
    if (!dragRef.current) return;

    event.stopPropagation();
    event.target.releasePointerCapture(dragRef.current.pointerId);
    dragRef.current = null;
  }

  return (
    <mesh
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      position={[0, 0, -3.2]}
    >
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function RubikAssembly({
  activeMove,
  cube,
  onMoveComplete,
  onMoveRequest,
  rootRotation,
  setCubeDragActive,
  viewRotation,
}) {
  const movingCubies = useMemo(
    () =>
      activeMove
        ? cube.filter((cubie) => isCubieAffected(cubie, activeMove))
        : [],
    [activeMove, cube],
  );
  const staticCubies = useMemo(
    () =>
      activeMove
        ? cube.filter((cubie) => !isCubieAffected(cubie, activeMove))
        : cube,
    [activeMove, cube],
  );

  return (
    <group rotation={[viewRotation.x, viewRotation.y, viewRotation.z]}>
      {staticCubies.map((cubie) => (
        <Cubie
          cubie={cubie}
          key={cubie.id}
          onMoveRequest={onMoveRequest}
          rootRotation={rootRotation}
          setCubeDragActive={setCubeDragActive}
        />
      ))}
      {activeMove ? (
        <MoveGroup move={activeMove} onMoveComplete={onMoveComplete}>
          {movingCubies.map((cubie) => (
            <Cubie cubie={cubie} key={cubie.id} />
          ))}
        </MoveGroup>
      ) : null}
    </group>
  );
}

function MoveGroup({ children, move, onMoveComplete }) {
  const groupRef = useRef();
  const elapsedRef = useRef(0);
  const completedRef = useRef(false);
  const moveKey = `${move.notation}-${move.startedAt}`;

  useEffect(() => {
    elapsedRef.current = 0;
    completedRef.current = false;
    if (groupRef.current) {
      groupRef.current.rotation.set(0, 0, 0);
    }
  }, [moveKey]);

  useFrame((_, delta) => {
    elapsedRef.current = Math.min(
      elapsedRef.current + delta,
      ANIMATION_SECONDS,
    );
    const progress = easeOutCubic(elapsedRef.current / ANIMATION_SECONDS);
    const definition = getMoveDefinition(move.base);
    const angle = getEffectiveQuarterTurns(move) * (Math.PI / 2) * progress;

    groupRef.current.rotation.set(0, 0, 0);
    groupRef.current.rotation[definition.axis] = angle;

    if (elapsedRef.current >= ANIMATION_SECONDS && !completedRef.current) {
      completedRef.current = true;
      onMoveComplete(move);
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

function Cubie({ cubie, onMoveRequest, rootRotation, setCubeDragActive }) {
  const dragRef = useRef(null);
  const { camera, size } = useThree();

  function handlePointerDown(event, face) {
    if (!onMoveRequest) return;

    event.stopPropagation();
    event.target.setPointerCapture(event.pointerId);
    setCubeDragActive(true);
    dragRef.current = {
      face,
      pointerId: event.pointerId,
      position: cubie.position,
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
    };
  }

  function handlePointerUp(event, face) {
    const dragStart = dragRef.current;
    if (!dragStart || dragStart.face !== face) return;

    event.stopPropagation();
    event.target.releasePointerCapture(dragStart.pointerId);
    setCubeDragActive(false);
    dragRef.current = null;

    const delta = {
      x: event.nativeEvent.clientX - dragStart.x,
      y: event.nativeEvent.clientY - dragStart.y,
    };
    const dragAxis = dragAxisFromScreenDelta({
      camera,
      delta,
      face,
      rootRotation,
      size,
    });
    const notation = dragAxis
      ? notationFromCubeDrag({
          face,
          position: dragStart.position,
          dragAxis: dragAxis.axis,
          dragSign: dragAxis.sign,
        })
      : null;

    if (notation) {
      onMoveRequest(notation);
    }
  }

  function handlePointerCancel() {
    if (!dragRef.current) return;

    dragRef.current = null;
    setCubeDragActive(false);
  }

  function blockViewRotation(event) {
    event.stopPropagation();
  }

  return (
    <group
      position={[
        cubie.position.x * CUBIE_GAP,
        cubie.position.y * CUBIE_GAP,
        cubie.position.z * CUBIE_GAP,
      ]}
    >
      <mesh
        castShadow
        onPointerDown={blockViewRotation}
        onPointerMove={blockViewRotation}
        onPointerUp={blockViewRotation}
        receiveShadow
      >
        <boxGeometry args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]} />
        <meshStandardMaterial color={COLOR_HEX.plastic} roughness={0.58} />
      </mesh>
      {Object.entries(cubie.stickers).map(([face, color]) => {
        const transform = STICKER_TRANSFORMS[face];

        return (
          <mesh
            key={face}
            position={transform.position}
            rotation={transform.rotation}
            onPointerCancel={handlePointerCancel}
            onPointerDown={(event) => handlePointerDown(event, face)}
            onPointerMove={blockViewRotation}
            onPointerUp={(event) => handlePointerUp(event, face)}
            receiveShadow
          >
            <planeGeometry args={[STICKER_SIZE, STICKER_SIZE]} />
            <meshStandardMaterial
              color={COLOR_HEX[color]}
              roughness={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
