let currentFloor: number | null = null;

export function setFloor(floor: number): boolean {
  if (currentFloor === floor) return false;

  const previous = currentFloor;
  currentFloor = floor;

  console.log(`🏢 Floor changed: ${previous ?? "None"} → ${floor}`);

  return true;
}

export function getCurrentFloor(): number | null {
  return currentFloor;
}