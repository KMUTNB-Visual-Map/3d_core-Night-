export function startGPS(
  onUpdate: (position: {
    x: number;
    y: number;
  }) => void
) {
  if (!("geolocation" in navigator)) {
    console.error("Geolocation not supported");
    return;
  }

  navigator.geolocation.watchPosition(
    (pos) => {
      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;

      console.log("GPS:", latitude, longitude);

      // ตอนนี้ใช้ lat/long เป็น x/y ไปก่อน (mock mapping)
      onUpdate({
        x: latitude,
        y: longitude,
      });
    },
    (err) => {
      console.error("GPS Error:", err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    }
  );
}