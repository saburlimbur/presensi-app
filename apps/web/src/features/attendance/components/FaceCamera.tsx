import { useEffect, useRef, useState } from "react";
import { Camera, FlipHorizontal } from "lucide-react";
import { Button } from "@ui/button";

interface Props {
  onCapture: (file: File) => void;
  captureLabel?: string;
  hint?: string;
  disabled?: boolean;
}

const FaceCamera = ({
  onCapture,
  captureLabel = "Ambil Foto",
  hint,
  disabled,
}: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [mirrored, setMirrored] = useState(true);

  const unmounted = useRef(false);
  useEffect(
    () => () => {
      unmounted.current = true;
    },
    [],
  );

  const start = async () => {
    setStarting(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      if (unmounted.current) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      setStream(s);
      setActive(true);
    } catch {
      alert("Izin kamera ditolak.");
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const capture = async () => {
    const v = videoRef.current;
    if (!v || v.videoWidth === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onCapture(file);
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-ink shadow-sm">
        {active ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${
              mirrored ? "scale-x-[-1]" : ""
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/60">
            <Camera size={56} strokeWidth={1} />
          </div>
        )}
        {active && (
          <button
            type="button"
            onClick={() => setMirrored((m) => !m)}
            aria-pressed={mirrored}
            aria-label="Cermin kamera"
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            <FlipHorizontal size={18} />
          </button>
        )}
        {hint && active && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
            {hint}
          </div>
        )}
      </div>

      {!active ? (
        <Button
          onClick={start}
          disabled={starting}
          className="w-full bg-cta hover:bg-sage-700 text-white py-5 rounded-lg"
        >
          <Camera size={18} />
          {starting ? "Membuka kamera..." : "Buka Kamera"}
        </Button>
      ) : (
        <Button
          onClick={capture}
          disabled={disabled}
          className="w-full bg-cta hover:bg-sage-700 text-white py-5 rounded-lg disabled:opacity-50"
        >
          <Camera size={18} />
          {captureLabel}
        </Button>
      )}
    </div>
  );
};

export default FaceCamera;
