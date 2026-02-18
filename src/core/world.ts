const MAP_SCALE = 2.18399076503;
const FLOOR_HEIGHT = 3;

export function mapToWorld(dbX: number, dbY: number, floor: number) {
  return {
    x: dbX / MAP_SCALE,
    y: floor * FLOOR_HEIGHT,
    z: dbY / MAP_SCALE,
  };
}

export { FLOOR_HEIGHT };
