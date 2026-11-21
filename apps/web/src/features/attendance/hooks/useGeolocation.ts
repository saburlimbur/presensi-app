import { useCallback, useEffect, useState } from "react";

interface Coords {
  lat: number;
  lng: number;
  accuracy: number;
}

type GeoPermission = "unsupported" | "prompt" | "granted" | "denied";

const deniedMessage =
  "Izin lokasi ditolak. Aktifkan lewat pengaturan situs/aplikasi.";

const messageFor = (e: GeolocationPositionError): string => {
  if (e.code === e.PERMISSION_DENIED) return deniedMessage;
  if (e.code === e.POSITION_UNAVAILABLE)
    return "Lokasi tidak tersedia. Pastikan GPS perangkat menyala.";
  if (e.code === e.TIMEOUT) return "Waktu mendeteksi lokasi habis. Coba lagi.";
  return e.message || "Gagal mendapatkan lokasi";
};

export const useGeolocation = () => {
  const supported =
    typeof navigator !== "undefined" &&
    "geolocation" in navigator &&
    (window.isSecureContext ?? location.protocol === "https:");
  const canQueryPermission =
    supported && typeof navigator.permissions?.query === "function";

  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(supported && !canQueryPermission);
  const [error, setError] = useState<string | null>(
    supported ? null : "GPS butuh koneksi HTTPS dan dukungan browser.",
  );
  const [permission, setPermission] = useState<GeoPermission>(
    supported ? "prompt" : "unsupported",
  );
  const [checking, setChecking] = useState(canQueryPermission);

  const locate = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
        });
        setPermission("granted");
        setLoading(false);
      },
      (e) => {
        if (e.code === e.PERMISSION_DENIED) setPermission("denied");
        setError(messageFor(e));
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  const request = useCallback(() => {
    if (!supported) return;
    setLoading(true);
    setError(null);
    locate();
  }, [supported, locate]);

  useEffect(() => {
    if (!supported) return;
    if (!canQueryPermission) {
      locate();
      return;
    }
    let cancelled = false;
    let statusRef: PermissionStatus | null = null;

    const sync = (state: GeoPermission) => {
      setPermission(state);
      if (state === "granted") {
        setError(null);
        request();
      } else if (state === "denied") {
        setError(deniedMessage);
      } else {
        setError(null);
      }
    };

    navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        if (cancelled) return;
        statusRef = status;
        setChecking(false);
        sync(status.state as GeoPermission);
        status.onchange = () => sync(status.state as GeoPermission);
      })
      .catch(() => {
        if (cancelled) return;
        setChecking(false);
        request();
      });

    return () => {
      cancelled = true;
      if (statusRef) statusRef.onchange = null;
    };
  }, [supported, canQueryPermission, locate, request]);

  return { coords, loading, error, permission, supported, checking, request };
};
