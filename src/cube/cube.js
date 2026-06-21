export const FACE_COLORS = {
  U: 'yellow',
  D: 'white',
  F: 'green',
  B: 'blue',
  R: 'red',
  L: 'orange',
};

export const COLOR_HEX = {
  white: '#ffffff',
  yellow: '#ffd500',
  green: '#009b48',
  blue: '#0051ba',
  red: '#c41e3a',
  orange: '#ff5800',
  plastic: '#151515',
};

const FACE_TO_VECTOR = {
  R: [1, 0, 0],
  L: [-1, 0, 0],
  U: [0, 1, 0],
  D: [0, -1, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
};

const VECTOR_TO_FACE = Object.fromEntries(
  Object.entries(FACE_TO_VECTOR).map(([face, vector]) => [vector.join(','), face]),
);

const MOVE_DEFINITIONS = {
  R: { axis: 'x', layer: 1, direction: -1 },
  L: { axis: 'x', layer: -1, direction: 1 },
  U: { axis: 'y', layer: 1, direction: -1 },
  D: { axis: 'y', layer: -1, direction: 1 },
  F: { axis: 'z', layer: 1, direction: -1 },
  B: { axis: 'z', layer: -1, direction: 1 },
  X: { axis: 'x', layer: null, direction: -1 },
  Y: { axis: 'y', layer: null, direction: -1 },
  Z: { axis: 'z', layer: null, direction: -1 },
  M: { axis: 'x', layer: 0, direction: 1 },
  E: { axis: 'y', layer: 0, direction: 1 },
  S: { axis: 'z', layer: 0, direction: -1 },
};

export function getMoveDefinition(base) {
  return MOVE_DEFINITIONS[base];
}

export function getEffectiveQuarterTurns(move) {
  const definition = MOVE_DEFINITIONS[move.base];

  if (!definition) {
    throw new Error(`Notasi tidak didukung: ${move.base}`);
  }

  return normalizeQuarterSteps(definition.direction * move.turns);
}

export function isCubieAffected(cubie, move) {
  const definition = MOVE_DEFINITIONS[move.base];

  if (!definition) return false;
  return isCubieInMove(cubie, definition);
}

export function createSolvedCube() {
  const cubies = [];

  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
      for (let z = -1; z <= 1; z += 1) {
        const stickers = {};

        if (x === 1) stickers.R = FACE_COLORS.R;
        if (x === -1) stickers.L = FACE_COLORS.L;
        if (y === 1) stickers.U = FACE_COLORS.U;
        if (y === -1) stickers.D = FACE_COLORS.D;
        if (z === 1) stickers.F = FACE_COLORS.F;
        if (z === -1) stickers.B = FACE_COLORS.B;

        cubies.push({
          id: `${x},${y},${z}`,
          position: { x, y, z },
          stickers,
        });
      }
    }
  }

  return cubies;
}

export function moveCube(cube, move) {
  const definition = MOVE_DEFINITIONS[move.base];

  if (!definition) {
    throw new Error(`Notasi tidak didukung: ${move.base}`);
  }

  const quarterSteps = getEffectiveQuarterTurns(move);

  return cube.map((cubie) => {
    if (!isCubieInMove(cubie, definition)) {
      return cloneCubie(cubie);
    }

    return rotateCubie(cubie, definition.axis, quarterSteps);
  });
}

export function applyMoves(cube, moves) {
  return moves.reduce((currentCube, move) => moveCube(currentCube, move), cube);
}

export function getVisibleStickerColors(cube) {
  return {
    U: getCenterSticker(cube, 'U'),
    D: getCenterSticker(cube, 'D'),
    F: getCenterSticker(cube, 'F'),
    B: getCenterSticker(cube, 'B'),
    R: getCenterSticker(cube, 'R'),
    L: getCenterSticker(cube, 'L'),
  };
}

export function isCubeSolved(cube) {
  return cube.every((cubie) =>
    Object.entries(cubie.stickers).every(
      ([face, color]) => color === FACE_COLORS[face],
    ),
  );
}

function getCenterSticker(cube, face) {
  const [x, y, z] = FACE_TO_VECTOR[face];
  const cubie = cube.find(
    (item) =>
      item.position.x === x && item.position.y === y && item.position.z === z,
  );

  return cubie?.stickers[face];
}

function isCubieInMove(cubie, definition) {
  if (definition.layer === null) return true;
  return cubie.position[definition.axis] === definition.layer;
}

function rotateCubie(cubie, axis, quarterSteps) {
  let positionVector = [
    cubie.position.x,
    cubie.position.y,
    cubie.position.z,
  ];

  for (let index = 0; index < Math.abs(quarterSteps); index += 1) {
    positionVector = rotateVectorOnce(
      positionVector,
      axis,
      Math.sign(quarterSteps),
    );
  }

  const stickers = {};
  for (const [face, color] of Object.entries(cubie.stickers)) {
    let normalVector = FACE_TO_VECTOR[face];

    for (let index = 0; index < Math.abs(quarterSteps); index += 1) {
      normalVector = rotateVectorOnce(normalVector, axis, Math.sign(quarterSteps));
    }

    stickers[VECTOR_TO_FACE[normalVector.join(',')]] = color;
  }

  return {
    ...cubie,
    position: {
      x: positionVector[0],
      y: positionVector[1],
      z: positionVector[2],
    },
    stickers,
  };
}

function rotateVectorOnce([x, y, z], axis, direction) {
  if (axis === 'x') {
    return direction > 0 ? [x, -z, y] : [x, z, -y];
  }

  if (axis === 'y') {
    return direction > 0 ? [z, y, -x] : [-z, y, x];
  }

  return direction > 0 ? [-y, x, z] : [y, -x, z];
}

function normalizeQuarterSteps(steps) {
  if (steps === 0) return 0;
  return steps > 0 ? 1 : -1;
}

function cloneCubie(cubie) {
  return {
    ...cubie,
    position: { ...cubie.position },
    stickers: { ...cubie.stickers },
  };
}
