import { getErrorMessage } from "@shared/utils/error";
import { useState } from "react";
import { Camera, Image as ImageIcon, Loader2, RotateCcw, ScanFace } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@ui/button";
import { useMyFacesEmbed } from "@features/faces/hooks/useMyFaceEmbed";
import { useResetFace } from "@features/faces/hooks/useResetFace";
import { fmtRelativeShort } from "@features/request/utils/format";

const FaceGallery = () => {
  const navigate = useNavigate();
  const { embeddings, total, isLoading } = useMyFacesEmbed();
  const { resetFace, isPending: resetting } = useResetFace();
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    try {
      const res = await resetFace();
      toast.success(res.message ?? "Wajah berhasil dihapus");
      setConfirmReset(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Gagal hapus wajah"));
    }
  };

  return (
    <section className="bg-paper-raised rounded-2xl p-5 shadow-sm border border-line">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-soft text-brand shrink-0">
            <ScanFace size={17} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink leading-tight">
              Wajah Terdaftar
            </h3>
            <p className="text-[11.5px] text-ink-muted mt-0.5">
              {isLoading
                ? "Memuat..."
                : total > 0
                  ? `${total} foto dipakai untuk verifikasi absensi`
                  : "Belum ada foto wajah terdaftar"}
            </p>
          </div>
        </div>

        {total > 0 && !isLoading && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-soft text-brand tabular-nums shrink-0">
            {total}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : embeddings.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
            <ImageIcon size={20} strokeWidth={1.5} className="text-ink-faint" />
          </div>
          <p className="text-[13px] font-medium text-ink">
            Belum daftar wajah
          </p>
          <p className="text-[12px] text-ink-muted mt-1 max-w-[240px]">
            Daftarkan wajah untuk bisa absensi dengan verifikasi otomatis.
          </p>
          <Button
            onClick={() => navigate("/auth/enrolled")}
            className="mt-4 h-10 px-4 rounded-lg bg-brand hover:bg-brand-bright text-white text-[13px] font-medium"
          >
            <Camera size={14} />
            Daftar Wajah
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2.5">
            {embeddings.map((face, idx) => (
              <figure key={face.id} className="space-y-1.5">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted ring-1 ring-inset ring-line">
                  {face.imageUrl_url && (
                    <img
                      src={face.imageUrl_url}
                      alt={`Foto wajah ${idx + 1}`}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                  <span className="absolute top-1.5 left-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-black/55 text-white text-[10px] font-semibold backdrop-blur-sm">
                    {idx + 1}
                  </span>
                </div>
                <figcaption className="text-[10.5px] text-ink-muted text-center tabular-nums">
                  {fmtRelativeShort(face.createdAt)}
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-line">
            {confirmReset ? (
              <div className="space-y-2">
                <p className="text-[12px] text-danger leading-relaxed">
                  Yakin hapus semua foto wajah? Anda harus daftar ulang sebelum
                  bisa absensi.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setConfirmReset(false)}
                    disabled={resetting}
                    className="h-10 rounded-lg bg-paper-raised hover:bg-muted text-ink-muted text-[13px] font-medium border border-line"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleReset}
                    disabled={resetting}
                    className="h-10 rounded-lg bg-danger hover:bg-danger/90 text-white text-[13px] font-medium disabled:opacity-60"
                  >
                    {resetting ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 size={13} className="animate-spin" />
                        Menghapus...
                      </span>
                    ) : (
                      "Ya, Hapus"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleReset}
                disabled={resetting}
                className="w-full h-10 rounded-lg bg-paper-raised hover:bg-danger-soft text-danger text-[13px] font-medium border border-danger/30"
              >
                <RotateCcw size={13} />
                Daftar Ulang Wajah
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default FaceGallery;
