import { useNavStore } from '../store/useNavStore';
import { requestLocationPermission } from '../core/gps';

export default function GPSButton() {
  const isFollowing = useNavStore((state) => state.isFollowing);
  const toggleFollowing = useNavStore((state) => state.toggleFollowing);

  const baseButton = 'px-5 py-3 rounded-xl shadow-2xl transition-all active:scale-95 pointer-events-auto flex items-center justify-center border-2 font-black text-sm fixed bottom-6 left-6 z-[9999]';

  return (
    <button
      onClick={() => {
        console.log("🛰️ GPS Clicked!");
        if (!isFollowing) {
          // Fire-and-forget to keep it within the same user gesture
          requestLocationPermission().catch((err) => {
            console.warn("Location permission request failed", err);
          });
        }
        toggleFollowing();
      }}
      className={`${baseButton} ${
        isFollowing
          ? 'bg-blue-600 text-white border-blue-400 scale-105'
          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${isFollowing ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
        {isFollowing ? 'GPS: TRACKING' : 'GPS: OFF'}
      </div>
    </button>
  );
}