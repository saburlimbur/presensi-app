import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  Clock,
  FlipHorizontal,
  Lock,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@ui/button";
import { useNavigate } from "react-router-dom";
import { useEnrollFace } from "@features/faces/hooks/useEnroll";
import { useAuthStore } from "@features/auth/store/auth.store";
import { toast } from "sonner";

const TARGET_CAPTURES = 5;

const POSES = [
  { title: "Hadap lurus", hint: "Wajah menghadap kamera" },
  { title: "Sedikit ke kiri", hint: "Palingkan wajah ke kiri" },
  { title: "Sedikit ke kanan", hint: "Palingkan wajah ke kanan" },
  { title: "Angkat dagu", hint: "Sedikit ke atas" },
  { title: "Tundukkan dagu", hint: "Sedikit ke bawah" },
];

const FaceEnrollPage = () => {
  const navigate = useNavigate();

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [captureCooldown, setCaptureCooldown] = useState(false);
  const [flash, setFlash] = useState(false);
  const [mirrored, setMirrored] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { enrollFace, isPending } = useEnrollFace();

  const captured = capturedImages.length;
  const captureFull = captured >= TARGET_CAPTURES;
  const currentPose = POSES[Math.min(captured, POSES.length - 1)];

  const startCamera = async () => {
    setIsLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (error) {
      console.error("Camera access denied:", error);
      toast.error("Akses kamera ditolak. Aktifkan izin kamera dulu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  const previewsRef = useRef(previews);
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);
  useEffect(
    () => () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setStream(null);
    setIsCameraActive(false);
  };

  const resetCaptures = () => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPreviews([]);
    setCapturedImages([]);
  };

  const removePreview = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
    setCapturedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const captureToFile = async (): Promise<File | null> => {
    const video = videoRef.current;
    if (!video) return null;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(null);
          resolve(
            new File([blob], `face-${Date.now()}.jpg`, { type: "image/jpeg" }),
          );
        },
        "image/jpeg",
        0.92,
      );
    });
  };

  const handleCapture = async () => {
    if (captureCooldown || captureFull) return;

    const file = await captureToFile();
    if (!file) {
      toast.error("Gagal mengambil foto, coba lagi");
      return;
    }

    setFlash(true);
    setTimeout(() => setFlash(false), 180);

    const previewUrl = URL.createObjectURL(file);
    setPreviews((prev) => [...prev, previewUrl]);
    setCapturedImages((prev) => [...prev, file]);

    setCaptureCooldown(true);
    setTimeout(() => setCaptureCooldown(false), 700);
  };

  const handleClose = () => {
    stopCamera();
    resetCaptures();
  };

  const handleSubmitEnroll = async () => {
    const { accessToken: token, user } = useAuthStore.getState();

    if (!token && !user) {
      toast.error("Sesi tidak ditemukan, silakan login terlebih dahulu", {
        style: {
          background: "transparent",
          border: "1px solid #BC4A3C",
          color: "#BC4A3C",
        },
        onAutoClose: () => navigate("/auth/login", { replace: true }),
        onDismiss: () => navigate("/auth/login", { replace: true }),
      });
      return;
    }

    if (!token && user) {
      toast.error("Sesi kamu sudah berakhir, silakan login kembali", {
        style: {
          background: "transparent",
          border: "1px solid #BC4A3C",
          color: "#BC4A3C",
        },
        onAutoClose: () => navigate("/auth/login", { replace: true }),
        onDismiss: () => navigate("/auth/login", { replace: true }),
      });
      return;
    }

    if (capturedImages.length < TARGET_CAPTURES) {
      toast.error(`Lengkapi ${TARGET_CAPTURES} foto wajah dulu`);
      return;
    }

    try {
      const res = await enrollFace(capturedImages);
      const data = res.data;

      if (data.success) {
        useAuthStore.getState().setFaceRegistered(true);
        toast.success(data.message ?? "Pendaftaran wajah berhasil");
        resetCaptures();
        stopCamera();
        navigate("/home");
      } else {
        toast.error(data.message ?? "Pendaftaran wajah gagal");
      }
    } catch (error: unknown) {
      console.error(error);
      const e = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      if (e?.response?.status === 401) {
        toast.error("Sesi kamu sudah berakhir, silakan login kembali", {
          style: {
            background: "transparent",
            border: "1px solid #BC4A3C",
            color: "#BC4A3C",
          },
          onAutoClose: () => navigate("/auth/login", { replace: true }),
          onDismiss: () => navigate("/auth/login", { replace: true }),
        });
        return;
      }
      toast.error(e?.response?.data?.message ?? "Gagal upload wajah");
    }
  };

  if (!isCameraActive) {
    return (
      <div className="relative flex flex-col px-6 py-6 antialiased min-h-screen bg-gradient-to-b from-success-soft/60 via-white to-white">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand/70">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            Setup Face ID
          </span>
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="text-xs font-medium text-ink-muted hover:text-ink-muted px-2 py-1"
          >
            Lewati
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto">
          <div className="relative mb-7">
            <div className="absolute inset-0 -m-6 rounded-full bg-success/30 blur-3xl" />
            <div className="relative w-44 h-44 rounded-full overflow-hidden ring-1 ring-brand/10 shadow-xl shadow-ink/10">
              <img
                src="/faced.png"
                alt="Face scan preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-11 h-11 rounded-full bg-brand flex items-center justify-center shadow-lg ring-4 ring-white">
              <ShieldCheck size={20} className="text-white" />
            </div>
          </div>

          <div className="text-center space-y-2 mb-6">
            <h1 className="text-brand text-3xl font-serif leading-tight tracking-tight">
              Daftarkan <span className="italic">wajahmu</span>
            </h1>
            <p className="text-ink-muted text-sm leading-relaxed">
              Sekali daftar, absen tanpa kontak setiap hari.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full">
            {[
              { icon: Camera, label: `${TARGET_CAPTURES} pose foto` },
              { icon: Clock, label: "± 30 detik" },
              { icon: Lock, label: "Tersimpan aman" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-paper-raised border border-line/80 shadow-sm shadow-ink/10"
              >
                <div className="w-9 h-9 rounded-full bg-success-soft flex items-center justify-center">
                  <Icon size={16} className="text-brand" />
                </div>
                <span className="text-[10px] font-semibold text-ink-muted text-center leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-sm mx-auto space-y-3 pt-6">
          <Button
            onClick={startCamera}
            disabled={isLoading}
            className="w-full bg-brand hover:bg-brand-bright text-white py-7 rounded-xl font-semibold text-md active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-ink/10"
          >
            <ShieldCheck size={20} />
            {isLoading ? "Membuka kamera..." : "Mulai Daftarkan Wajah"}
          </Button>

          <p className="text-center text-[11px] text-ink-faint">
            Foto hanya dipakai untuk verifikasi absensi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen px-5 py-4 antialiased bg-muted">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handleClose}
          className="w-9 h-9 rounded-full bg-paper-raised border border-line text-ink-muted flex items-center justify-center hover:bg-muted active:scale-95 transition shadow-sm"
          aria-label="Tutup"
        >
          <X size={16} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ink-muted font-medium">
            Foto wajah
          </span>
          <span className="text-xs font-semibold text-brand tabular-nums">
            {captured} / {TARGET_CAPTURES}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto">
        <div className="relative w-full aspect-square overflow-hidden rounded-[2rem] shadow-xl shadow-ink/10 bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => videoRef.current?.play()}
            className={`w-full h-full object-cover ${
              mirrored ? "scale-x-[-1]" : ""
            }`}
          />

          <button
            type="button"
            onClick={() => setMirrored((m) => !m)}
            aria-pressed={mirrored}
            aria-label={mirrored ? "Matikan cermin" : "Nyalakan cermin"}
            className={`absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-95 ${
              mirrored
                ? "bg-white/90 text-ink shadow-sm"
                : "bg-black/45 text-white hover:bg-black/60"
            }`}
          >
            <FlipHorizontal size={16} />
          </button>

          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <mask id="face-mask">
                <rect width="100" height="100" fill="white" />
                <ellipse cx="50" cy="50" rx="32" ry="40" fill="black" />
              </mask>
            </defs>
            <rect
              width="100"
              height="100"
              fill="rgba(0,0,0,0.35)"
              mask="url(#face-mask)"
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={`w-[64%] h-[80%] rounded-[50%] border-2 transition-colors duration-300 ${
                captureFull
                  ? "border-success/40"
                  : captureCooldown
                    ? "border-white/40"
                    : "border-white/85 border-dashed"
              }`}
            />
          </div>

          {flash && (
            <div className="absolute inset-0 bg-white animate-pulse pointer-events-none" />
          )}

          {captureCooldown && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-success text-white text-[10px] font-semibold flex items-center gap-1 shadow-md">
              <Check size={11} />
              Tersimpan
            </div>
          )}
        </div>

        <div className="text-center mt-5 mb-4 min-h-[60px]">
          {captureFull ? (
            <>
              <p className="text-brand text-xl font-semibold">
                Semua pose terkumpul
              </p>
              <p className="text-ink-muted text-xs mt-1">
                Tap Submit untuk menyimpan
              </p>
            </>
          ) : (
            <>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-ink-faint">
                Pose {captured + 1}
              </p>
              <p className="text-brand text-xl font-semibold mt-1 leading-tight">
                {currentPose.title}
              </p>
              <p className="text-ink-muted text-xs mt-0.5">
                {currentPose.hint}
              </p>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          {Array.from({ length: TARGET_CAPTURES }).map((_, i) => {
            const src = previews[i];
            const isCurrent = i === captured && !captureFull;
            return (
              <div
                key={i}
                className={`relative w-12 h-12 rounded-lg overflow-hidden transition-all ${
                  src
                    ? "border-2 border-success/40"
                    : isCurrent
                      ? "border-2 border-brand bg-muted"
                      : "border border-dashed border-line bg-muted"
                }`}
              >
                {src ? (
                  <>
                    <img
                      src={src}
                      alt={`capture-${i}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePreview(i)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                      aria-label={`Hapus foto ${i + 1}`}
                    >
                      <X size={8} />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-ink-faint">
                    {i + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto pt-4 pb-2 space-y-2">
        {captureFull ? (
          <Button
            onClick={handleSubmitEnroll}
            disabled={isPending}
            className="w-full bg-brand hover:bg-brand-bright text-white py-6 rounded-lg font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition"
          >
            {isPending ? "Mengupload..." : `Submit Foto`}
          </Button>
        ) : (
          <Button
            onClick={handleCapture}
            disabled={captureCooldown}
            className="w-full bg-brand hover:bg-brand-bright text-white py-6 rounded-lg font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition"
          >
            {captureCooldown ? "Mengambil…" : `Ambil Foto`}
          </Button>
        )}

        <div className="flex items-center justify-center gap-4 pt-1">
          {captured > 0 && (
            <button
              type="button"
              onClick={resetCaptures}
              className="text-xs text-ink-muted hover:text-ink-muted flex items-center gap-1"
            >
              <RotateCcw size={11} />
              Mulai ulang
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceEnrollPage;
