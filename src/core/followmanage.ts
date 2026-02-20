// core/followManager.ts

export type FollowMode = "IDLE" | "FOLLOW_USER";

let followMode: FollowMode = "IDLE";

/* =============================
   STATE GETTERS
============================= */

export function getFollowMode(): FollowMode {
  return followMode;
}

export function isFollowing(): boolean {
  return followMode === "FOLLOW_USER";
}

/* =============================
   STATE MUTATORS
============================= */

export function enableFollow(): void {
  if (followMode === "FOLLOW_USER") return;

  followMode = "FOLLOW_USER";
  console.log("[FollowManager] FOLLOW_USER enabled");
}

export function disableFollow(): void {
  if (followMode === "IDLE") return;

  followMode = "IDLE";
  console.log("[FollowManager] Follow disabled");
}

export function toggleFollow(): void {
  if (followMode === "FOLLOW_USER") {
    disableFollow();
  } else {
    enableFollow();
  }
}

/* =============================
   OPTIONAL: AUTO CANCEL HOOK
   (เผื่ออนาคตใช้)
============================= */

export function cancelFollowOnUserInteraction(): void {
  if (followMode === "FOLLOW_USER") {
    followMode = "IDLE";
    console.log("[FollowManager] Cancelled due to user interaction");
  }
}