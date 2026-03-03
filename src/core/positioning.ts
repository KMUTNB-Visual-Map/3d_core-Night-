import { startGPS } from "./gps";
import { sendPosition } from "./socket";

export type PositionMode = "GPS" | "MANUAL";

export interface Position {
  x: number;
  y: number;
  floor_id: number;
}

export class PositioningManager {

  constructor(private guestId: string) {}

  private readonly gpsUpdateIntervalMs = 2000;
  private lastGpsUpdateAt = 0;

  private mode: PositionMode = "GPS";

  private currentPosition: Position = {
    x: 0,
    y: 0,
    floor_id: 1,
  };

  /* =======================
     Route Path Integration
  ======================= */

  private routePath: Position[] = [];

  setRoutePath(path: Position[]) {
    this.routePath = path;

    if (path.length > 0) {
      const lastPoint = path[path.length - 1];
      this.setDestination(lastPoint);
    }
  }

  getRoutePath() {
    return this.routePath;
  }

  /* =======================
     Arrival Logic
  ======================= */

  private destination: Position | null = null;
  private arrivalThreshold = 5;

  private hasArrived = false;

  private onArrivedCallback?: () => void;

  setDestination(dest: Position) {
    this.destination = dest;
    this.hasArrived = false;
  }

  onArrived(callback: () => void) {
    this.onArrivedCallback = callback;
  }

  private calculateDistance(a: Position, b: Position): number {
    return Math.sqrt(
      (a.x - b.x) ** 2 +
      (a.y - b.y) ** 2
    );
  }

  private checkArrival() {
    if (!this.destination) return;

    const distance = this.calculateDistance(
      this.currentPosition,
      this.destination
    );

    if (distance < this.arrivalThreshold && !this.hasArrived) {
      this.hasArrived = true;

      console.log("🎉 Arrived at destination");

      if (this.onArrivedCallback) {
        this.onArrivedCallback();
      }
    }
  }

  /* =======================
     Manual Mode
  ======================= */

  startManualMode() {
    this.mode = "MANUAL";
  }

  updateManualPosition(x: number, y: number) {
    const position: Position = {
      x,
      y,
      floor_id: 1,
    };

    this.currentPosition = position;

    sendPosition({
      guest_id: this.guestId,
      mode: "MANUAL",
      geom: { x, y },
      floor_id: 1,
    });

    this.checkArrival();
  }

  /* =======================
     GPS Mode
  ======================= */

  startGPSMode(onUpdate: (pos: Position) => void) {
    this.mode = "GPS";
    this.lastGpsUpdateAt = 0;

    startGPS((gpsPos) => {
      const now = Date.now();
      if (now - this.lastGpsUpdateAt < this.gpsUpdateIntervalMs) {
        return;
      }
      this.lastGpsUpdateAt = now;

      const position: Position = {
        x: gpsPos.x,
        y: gpsPos.y,
        floor_id: 1,
      };

      this.currentPosition = position;

      sendPosition({
        guest_id: this.guestId,
        mode: "GPS",
        geom: {
          x: position.x,
          y: position.y,
        },
        floor_id: position.floor_id,
      });

      this.checkArrival();
      onUpdate(position);
    });
  }

  /* =======================
     Getter
  ======================= */

  getPosition() {
    return this.currentPosition;
  }

  getMode() {
    return this.mode;
  }
}