export async function fetchLocation() {
  const res = await fetch("/config/location.json");
  return await res.json();
}

export function startLocationPolling(
  callback: (location: any) => void,
  interval = 1500
) {
  setInterval(async () => {
    const loc = await fetchLocation();
    callback(loc);
  }, interval);
}
