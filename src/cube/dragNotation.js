import * as THREE from 'three';

const EDGE_ZONE = 0.16;
const DRAG_THRESHOLD = 30;

const FACE_NORMALS = {
  R: { x: 1, y: 0, z: 0 },
  L: { x: -1, y: 0, z: 0 },
  U: { x: 0, y: 1, z: 0 },
  D: { x: 0, y: -1, z: 0 },
  F: { x: 0, y: 0, z: 1 },
  B: { x: 0, y: 0, z: -1 },
};

const LAYER_TO_BASE = {
  x: {
    '-1': 'L',
    0: 'M',
    1: 'R',
  },
  y: {
    '-1': 'D',
    0: 'E',
    1: 'U',
  },
  z: {
    '-1': 'B',
    0: 'S',
    1: 'F',
  },
};

const UPPERCASE_EFFECTIVE_SIGN = {
  R: -1,
  L: 1,
  U: -1,
  D: 1,
  F: -1,
  B: 1,
  M: 1,
  E: 1,
  S: -1,
};

export function isStickerEdge(uv, edgeZone = EDGE_ZONE) {
  if (!uv) return true;

  return (
    uv.x <= edgeZone ||
    uv.x >= 1 - edgeZone ||
    uv.y <= edgeZone ||
    uv.y >= 1 - edgeZone
  );
}

export function notationFromCubeDrag({ face, position, dragAxis, dragSign }) {
  const normal = FACE_NORMALS[face];
  if (!normal || !position || !dragAxis || !dragSign) return null;

  const naturalFaceMove = naturalFaceTurn(face, dragAxis, dragSign);
  if (naturalFaceMove) return naturalFaceMove;

  const centerFaceMove = naturalCenterFaceTurn(
    face,
    position,
    dragAxis,
    dragSign,
  );
  if (centerFaceMove) return centerFaceMove;

  const dragVector = { x: 0, y: 0, z: 0, [dragAxis]: dragSign };
  const rotationVector = cross(normal, dragVector);
  const { axis, sign } = dominantAxis(rotationVector);

  if (!axis || position[axis] === undefined) return null;

  const base = LAYER_TO_BASE[axis]?.[position[axis]];
  if (!base) return null;

  return UPPERCASE_EFFECTIVE_SIGN[base] === sign ? base : base.toLowerCase();
}

function naturalFaceTurn(face, dragAxis, dragSign) {
  if ((face === 'R' || face === 'L') && dragAxis === 'y') {
    return dragSign > 0 ? face : face.toLowerCase();
  }

  return null;
}

function naturalCenterFaceTurn(face, position, dragAxis, dragSign) {
  if (
    (face === 'F' || face === 'B') &&
    position.x === 0 &&
    position.y === 0 &&
    dragAxis === 'x'
  ) {
    return dragSign > 0 ? face : face.toLowerCase();
  }

  return null;
}

export function dragAxisFromScreenDelta({
  camera,
  delta,
  face,
  minDistance = DRAG_THRESHOLD,
  rootRotation,
  size,
}) {
  if (!camera || !delta || !face || Math.hypot(delta.x, delta.y) < minDistance) {
    return null;
  }

  const normal = FACE_NORMALS[face];
  const tangentAxes = ['x', 'y', 'z'].filter((axis) => normal[axis] === 0);
  const deltaLength = Math.hypot(delta.x, delta.y);
  const normalizedDelta = {
    x: delta.x / deltaLength,
    y: delta.y / deltaLength,
  };

  let bestAxis = null;
  let bestScore = 0;
  let bestSign = 1;

  for (const axis of tangentAxes) {
    const projected = projectAxisToScreen({ axis, camera, rootRotation, size });
    const score = normalizedDelta.x * projected.x + normalizedDelta.y * projected.y;

    if (Math.abs(score) > Math.abs(bestScore)) {
      bestAxis = axis;
      bestScore = score;
      bestSign = score >= 0 ? 1 : -1;
    }
  }

  if (Math.abs(bestScore) < 0.45) return null;
  return { axis: bestAxis, sign: bestSign };
}

function projectAxisToScreen({ axis, camera, rootRotation, size }) {
  const origin = new THREE.Vector3(0, 0, 0);
  const endpoint = new THREE.Vector3(
    axis === 'x' ? 1 : 0,
    axis === 'y' ? 1 : 0,
    axis === 'z' ? 1 : 0,
  );

  if (rootRotation) {
    origin.applyEuler(rootRotation);
    endpoint.applyEuler(rootRotation);
  }

  origin.project(camera);
  endpoint.project(camera);

  const vector = {
    x: (endpoint.x - origin.x) * (size?.width ?? 1),
    y: -(endpoint.y - origin.y) * (size?.height ?? 1),
  };
  const length = Math.hypot(vector.x, vector.y) || 1;

  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function dominantAxis(vector) {
  const entries = Object.entries(vector);
  const [axis, value] = entries.reduce((best, current) =>
    Math.abs(current[1]) > Math.abs(best[1]) ? current : best,
  );

  if (value === 0) return { axis: null, sign: 0 };
  return { axis, sign: value > 0 ? 1 : -1 };
}
