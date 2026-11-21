import { getErrorMessage } from "@shared/utils/error";
import { useState } from "react";
import { Loader2, ScanFace, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@ui/sheet";
import { Button } from "@ui/button";
import FaceCamera from "@features/attendance/components/FaceCamera";
import CheckInOutForm from "@features/attendance/components/CheckInOutForm";
import VerifiedIdentityCard from "@features/attendance/components/VerifiedIdentityCard";
import { useRecognize } from "@features/faces/hooks/useRecognize";
import { useAuthStore } from "@features/auth/store/auth.store";
import { useCheckIn } from "@features/attendance/hooks/useCheckIn";
import { useCheckOut } from "@features/attendance/hooks/useCheckOut";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "in" | "out";
}

type Step = "verify" | "form";

const AttendanceSheet = ({ open, onOpenChange, mode }: Props) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("verify");
  const [verifying, setVerifying] = useState(false);
  const [faceToken, setFaceToken] = useState("");
  const { recognize } = useRecognize();
  const user = useAuthStore((s) => s.user);
  const faceRegistered = !!user?.isFaceRegistered;
  const { checkIn, isPending: checkingIn } = useCheckIn();
  const { checkOut, isPending: checkingOut } = useCheckOut();
  const submitting = mode === "in" ? checkingIn : checkingOut;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setStep("verify");
      setVerifying(false);
      setFaceToken("");
    }
    onOpenChange(next);
  };

  const handleVerifyCapture = async (file: File) => {
    setVerifying(true);
    try {
      const res = await recognize(file);
      if (!res.success) {
        toast.error(res.message ?? "Wajah tidak dikenali, coba lagi");
        return;
      }
      if (res.data?.userId !== user?.id || !res.data?.verificationToken) {
        toast.error("Wajah tidak cocok dengan akunmu");
        return;
      }
      setFaceToken(res.data.verificationToken);
      toast.success(res.message ?? "Wajah dikenali");
      setStep("form");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Verifikasi gagal"));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-w-[420px] mx-auto rounded-t-2xl max-h-[92dvh] overflow-y-auto no-scrollbar bg-slate-50"
      >
        <SheetHeader className="pt-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-1">
            <ShieldCheck size={14} className="text-cta" />
            <span>
              {step === "verify" ? "Langkah 1 dari 2" : "Langkah 2 dari 2"}
            </span>
          </div>
          <SheetTitle className="text-lg">
            {step === "verify"
              ? `Verifikasi Wajah`
              : `Form ${mode === "in" ? "Check-In" : "Check-Out"}`}
          </SheetTitle>
          <SheetDescription>
            {step === "verify"
              ? `Pindai wajahmu dulu untuk ${mode === "in" ? "check-in" : "check-out"}.`
              : "Lengkapi lokasi, foto, dan tipe kerja lalu submit."}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          {step === "verify" && !faceRegistered ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-8 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cta/10 text-cta">
                <ScanFace size={22} />
              </span>
              <div className="space-y-1">
                <p className="text-[15px] font-semibold text-gray-900">
                  Kamu belum mendaftarkan wajah
                </p>
                <p className="text-[13px] text-gray-500">
                  Daftarkan wajahmu dulu agar bisa diverifikasi saat absensi.
                </p>
              </div>
              <Button
                onClick={() => {
                  handleOpenChange(false);
                  navigate("/auth/enrolled");
                }}
                className="h-11 w-full rounded-xl bg-cta text-[14px] font-medium text-white hover:bg-cta/90"
              >
                Daftar Wajah
              </Button>
            </div>
          ) : step === "verify" ? (
            <div className="space-y-3">
              <FaceCamera
                onCapture={handleVerifyCapture}
                captureLabel={
                  verifying ? "Memverifikasi..." : "Verifikasi Wajah"
                }
                hint="Pastikan wajah terlihat jelas"
                disabled={verifying}
              />
              {verifying && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Loader2 size={16} className="animate-spin" />
                  Memeriksa kesamaan...
                </div>
              )}
            </div>
          ) : (
            <>
              <VerifiedIdentityCard />
              {mode === "in" ? (
                <CheckInOutForm
                  mode="in"
                  submitLabel="Submit Check-In"
                  submitting={submitting}
                  onSubmit={async (payload) => {
                    await checkIn({ ...payload, faceToken });
                    handleOpenChange(false);
                  }}
                />
              ) : (
                <CheckInOutForm
                  mode="out"
                  submitLabel="Submit Check-Out"
                  submitting={submitting}
                  onSubmit={async (payload) => {
                    await checkOut({ ...payload, faceToken });
                    handleOpenChange(false);
                  }}
                />
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AttendanceSheet;
