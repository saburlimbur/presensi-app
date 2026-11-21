import { getErrorMessage } from "@shared/utils/error";
import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@ui/button";
import { Textarea } from "@ui/textarea";
import LocationCard from "@features/attendance/components/LocationCard";
import { findNearestLocation } from "@features/attendance/utils/geo";
import type { CheckInPayload, CheckOutPayload, WorkType } from "@features/attendance/@types";
import { useReadLocation } from "@features/attendance/hooks/useReadLocation";
import { useGeolocation } from "@features/attendance/hooks/useGeolocation";
import { useTodayResolved } from "@features/attendance/hooks/useTodayResolved";

type Props =
  | {
      mode: "in";
      submitLabel: string;
      submitting?: boolean;
      onSubmit: (payload: Omit<CheckInPayload, "faceToken">) => Promise<unknown>;
    }
  | {
      mode: "out";
      submitLabel: string;
      submitting?: boolean;
      onSubmit: (payload: Omit<CheckOutPayload, "faceToken">) => Promise<unknown>;
    };

const CheckInOutForm = (props: Props) => {
  const { mode, submitLabel, submitting } = props;
  const { readLocation, isLoading: locLoading } = useReadLocation();
  const {
    coords,
    loading: geoLoading,
    error: geoError,
    permission,
    checking: geoChecking,
    request: requestLocation,
  } = useGeolocation();
  const [note, setNote] = useState("");
  const { isWfhDay } = useTodayResolved();
  const [selectedWorkType, setWorkType] = useState<WorkType>("WFO");
  const workType: WorkType = isWfhDay ? "WFA" : selectedWorkType;

  const locations = useMemo(() => readLocation?.data ?? [], [readLocation]);
  const nearest = useMemo(
    () => (coords ? findNearestLocation(coords, locations) : null),
    [coords, locations],
  );
  const distance = nearest?.distance ?? null;
  const inRadius = nearest?.inRadius ?? false;
  const location = nearest?.location ?? null;

  const radiusOk = mode === "out" || workType === "WFA" || inRadius;
  const canSubmit = !!coords && radiusOk && !submitting;

  const wfoCheckIn = mode === "in" && workType === "WFO" && !!coords;
  const noOfficeLocation = wfoCheckIn && !location;
  const wfoOutOfRange = wfoCheckIn && !!location && !inRadius;

  const overshoot =
    nearest && nearest.distance && nearest.location
      ? Math.max(
          0,
          Math.round(nearest.distance - nearest.location.radiusMeters),
        )
      : 0;

  const buttonLabel = (() => {
    if (submitting) return "Menyimpan...";
    if (geoLoading || geoChecking) return "Mendeteksi lokasi...";
    if (!coords) return "Lokasi belum tersedia";
    if (noOfficeLocation) return "Lokasi kantor belum tersedia";
    if (wfoOutOfRange) return "Di luar radius kantor";
    return submitLabel;
  })();

  const handleSubmit = async () => {
    if (!coords) return;
    if (!radiusOk) {
      toast.error("Kamu berada di luar radius kantor");
      return;
    }
    try {
      if (props.mode === "in") {
        await props.onSubmit({
          workMode: workType,
          latitude: coords.lat,
          longitude: coords.lng,
          gpsAccuracy: coords.accuracy,
          deviceInfo: navigator.userAgent,
          note: note.trim() || undefined,
        });
      } else {
        await props.onSubmit({
          latitude: coords.lat,
          longitude: coords.lng,
          gpsAccuracy: coords.accuracy,
        });
      }
      toast.success(mode === "in" ? "Check-in berhasil" : "Check-out berhasil");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Gagal menyimpan absensi"));
    }
  };

  return (
    <div className="space-y-4">
      <LocationCard
        userCoords={coords}
        location={location}
        distance={distance}
        inRadius={inRadius}
        loading={locLoading || geoLoading || geoChecking}
      />
      {geoError && !geoChecking && (
        <p className="text-[11px] text-rose-600 -mt-2 px-1">{geoError}</p>
      )}

      {!coords && !geoLoading && !geoChecking && permission !== "unsupported" && (
        <Button
          type="button"
          onClick={requestLocation}
          variant="outline"
          className="w-full border-cta text-cta hover:bg-cta/5"
        >
          {permission === "denied"
            ? "Coba Aktifkan Lokasi Lagi"
            : "Aktifkan Lokasi"}
        </Button>
      )}

      {mode === "in" && (
        <>
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <p className="text-sm font-semibold text-gray-900">Work Type</p>
            <div className="grid grid-cols-2 gap-2">
              {(["WFO", "WFA"] as WorkType[]).map((t) => {
                const active = workType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setWorkType(t)}
                    disabled={isWfhDay}
                    className={`py-3 rounded-lg text-sm font-semibold border transition disabled:cursor-not-allowed ${
                      active
                        ? "bg-cta text-white border-cta"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            {wfoOutOfRange ? (
              <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5">
                <AlertTriangle
                  size={14}
                  className="text-rose-600 shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0 text-[12px] text-rose-700 leading-relaxed">
                  <p className="font-semibold">
                    Posisi Anda{overshoot > 0 ? ` ${overshoot}m` : ""} di luar
                    radius kantor.
                  </p>
                  <p className="mt-0.5">
                    Pindah ke area kantor, atau{" "}
                    <button
                      type="button"
                      onClick={() => setWorkType("WFA")}
                      className="font-semibold underline underline-offset-2 hover:no-underline"
                    >
                      pakai WFA
                    </button>{" "}
                    untuk absen dari sini.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500">
                {isWfhDay
                  ? "Izin Work From Home aktif — mode kerja dikunci ke WFA."
                  : workType === "WFO"
                  ? "Work From Office — absen dari kantor."
                  : "Work From Anywhere — absen dari lokasi lain."}
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
            <label className="text-sm font-semibold text-gray-900">
              Catatan (opsional)
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="mis. WFH / ada meeting"
              rows={3}
            />
          </div>
        </>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full bg-cta hover:bg-sage-700 text-white py-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonLabel}
      </Button>
    </div>
  );
};

export default CheckInOutForm;
