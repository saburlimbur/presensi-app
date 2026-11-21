import { Loader2, MapPin } from "lucide-react";
import LocationMap from "@features/attendance/components/LocationMap";
import type { Location } from "@features/attendance/@types";

interface Props {
  userCoords: { lat: number; lng: number } | null;
  location: Location | null;
  distance: number | null;
  inRadius: boolean;
  loading?: boolean;
}

const LocationCard = ({
  userCoords,
  location,
  distance,
  inRadius,
  loading,
}: Props) => {
  if (loading) {
    return (
      <div className="bg-paper-raised rounded-xl border border-line p-4 flex items-center gap-3">
        <Loader2 size={16} className="animate-spin text-ink-faint" />
        <p className="text-sm text-ink-muted">Mendeteksi lokasi kamu…</p>
      </div>
    );
  }

  if (!userCoords || !location) {
    return (
      <div className="bg-paper-raised rounded-xl border border-line p-4 flex items-center gap-3">
        <MapPin size={16} className="text-ink-faint" />
        <p className="text-sm text-ink-muted">
          {userCoords
            ? "Lokasi kantor belum tersedia"
            : "Izinkan akses lokasi untuk cek radius"}
        </p>
      </div>
    );
  }

  const dist = distance ?? 0;

  return (
    <div className="bg-paper-raised rounded-xl border border-line overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <MapPin size={16} className="text-ink-muted shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink truncate">
              {location.name}
            </p>
            {location.address && (
              <p className="text-xs text-ink-muted truncate">
                {location.address}
              </p>
            )}
          </div>
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
            inRadius
              ? "bg-brand-soft text-brand"
              : "bg-danger-soft text-danger"
          }`}
        >
          {inRadius ? "In Range" : "Out of Range"}
        </span>
      </div>

      <div className="h-44 border-y border-line">
        <LocationMap
          userLat={userCoords.lat}
          userLng={userCoords.lng}
          officeLat={location.lat}
          officeLng={location.lng}
          radiusMeters={location.radiusMeters}
          className="h-full"
        />
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 text-xs">
        <span className="text-ink-muted">
          Jarak:{" "}
          <span className="text-ink font-semibold tabular-nums">
            {Math.round(dist)} m
          </span>
        </span>
        <span className="text-ink-muted">
          Radius:{" "}
          <span className="text-ink font-semibold tabular-nums">
            {location.radiusMeters} m
          </span>
        </span>
      </div>
    </div>
  );
};

export default LocationCard;
