let isLocked = false;

function preventCtrlZoom(e: WheelEvent) {
  if (e.ctrlKey) e.preventDefault();
}

export function setBrowserZoomLock(lock: boolean) {
  if (lock === isLocked) return;

  if (lock) {
    document.body.style.touchAction = "none";
    document.documentElement.style.overflow = "hidden";

    window.addEventListener("wheel", preventCtrlZoom, { passive: false });
  } else {
    document.body.style.touchAction = "";
    document.documentElement.style.overflow = "";

    window.removeEventListener("wheel", preventCtrlZoom);
  }

  isLocked = lock;
}
