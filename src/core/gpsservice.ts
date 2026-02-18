export type GPSData = {
  lat: number | null;
  lng: number | null;
  acc: number | null;
};

export function createGPSService() {
  const data: GPSData = {
    lat: null,
    lng: null,
    acc: null,
  };

  function request() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        data.lat = pos.coords.latitude;
        data.lng = pos.coords.longitude;
        data.acc = pos.coords.accuracy;
      },
      (err) => {
        console.warn("GPS error:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  function getInfo() {
    if (data.lat == null) return "No Data";

    return `Lat: ${data.lat.toFixed(6)}
Lng: ${data.lng?.toFixed(6)}
Acc: ${data.acc?.toFixed(1)} m`;
  }

  return { request, getInfo };
}
