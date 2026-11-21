import { getErrorMessage } from "@shared/utils/error";
import { useRef, useState } from "react";
import {
  Building2,
  Camera,
  CalendarDays,
  ChevronRight,
  KeyRound,
  Loader2,
  Mail,
  Pencil,
  Phone,
  UserCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { useProfileUser } from "@features/users/hooks/useProfile";
import { useUpdatePhoto } from "@features/users/hooks/useUpdatePhoto";
import FaceGallery from "@features/faces/components/FaceGallery";
import EditProfileSheet from "@features/users/components/EditProfileSheet";
import ChangePasswordSheet from "@features/users/components/ChangePasswordSheet";


const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const initials = (name?: string | null) => {
  if (!name) return "U";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => {
  return (
    <h2 className="text-[10px] uppercase tracking-wider font-semibold text-ink-faint mb-2 px-1">
      {children}
    </h2>
  );
};

const StatusPill = ({
  active,
  label,
}: {
  active: boolean;
  label: string;
}) => {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active ? "bg-brand" : "bg-line"
        }`}
      />
      <span
        className={`text-[11.5px] font-medium ${
          active ? "text-ink-muted" : "text-ink-faint"
        }`}
      >
        {label}
      </span>
    </div>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <div className="flex items-start gap-3 py-3.5">
      <div className="mt-0.5 text-ink-faint shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-ink-muted mb-0.5">{label}</p>
        <div className="text-[13.5px] font-medium text-ink break-words">
          {value}
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { userProfile, isLoading } = useProfileUser();

  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updatePhoto, isPending: isUploadingPhoto } = useUpdatePhoto();

  const handlePickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Format foto harus JPG atau PNG");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5MB");
      return;
    }

    try {
      await updatePhoto(file);
      toast.success("Foto profil diperbarui");
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal memperbarui foto profil"));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 mt-4 animate-pulse">
        <div className="h-44 rounded-2xl bg-muted" />
        <div className="h-56 rounded-2xl bg-muted" />
        <div className="h-20 rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <p className="py-16 text-center text-sm text-ink-muted">
        Gagal memuat profil. Periksa koneksi lalu buka ulang halaman ini.
      </p>
    );
  }

  const {
    fullName,
    email,
    phone,
    employeeId,
    position,
    role,
    joinDate,
    createdAt,
    isActive,
    isFaceRegistered,
    department,
    profilePhoto_url,
  } = userProfile;

  return (
    <div className="pb-10 space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-4 min-w-0">
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                aria-label="Ganti foto profil"
                className="relative block w-16 h-16 rounded-2xl overflow-hidden active:scale-95 transition disabled:opacity-70"
              >
                {profilePhoto_url ? (
                  <img
                    src={profilePhoto_url}
                    alt={fullName ?? "Foto profil"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="w-full h-full bg-cta text-white flex items-center justify-center text-[18px] font-semibold tracking-wide">
                    {initials(fullName)}
                  </span>
                )}
                {isUploadingPhoto && (
                  <span className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 size={18} className="text-white animate-spin" />
                  </span>
                )}
              </button>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cta text-white flex items-center justify-center ring-2 ring-white pointer-events-none">
                <Camera size={12} />
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handlePickPhoto}
                className="hidden"
              />
            </div>

            <div className="min-w-0 pt-0.5">
              <h1 className="text-[18px] font-semibold text-slate-900 leading-tight truncate">
                {fullName}
              </h1>
              <p className="text-[12px] text-slate-500 mt-1 tabular-nums">
                {employeeId}
              </p>

              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <span className="px-2 py-0.5 rounded-md border border-slate-200 text-slate-700 text-[10.5px] font-semibold tracking-wide">
                  {role}
                </span>
                <span className="px-2 py-0.5 rounded-md border border-slate-200 text-slate-700 text-[10.5px] font-semibold tracking-wide">
                  {position}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setEditOpen(true)}
            aria-label="Edit profil"
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 active:scale-95 transition shrink-0"
          >
            <Pencil size={15} />
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-5 gap-y-2">
          <StatusPill
            active={isActive}
            label={isActive ? "Akun aktif" : "Tidak aktif"}
          />
          <StatusPill
            active={!!isFaceRegistered}
            label={
              isFaceRegistered ? "Wajah terdaftar" : "Wajah belum terdaftar"
            }
          />
        </div>
      </section>

      <section>
        <SectionLabel>Informasi Pribadi</SectionLabel>
        <div className="bg-white border border-slate-200 rounded-2xl px-5 divide-y divide-slate-100">
          <InfoRow icon={<Mail size={16} />} label="Email" value={email} />
          <InfoRow
            icon={<Phone size={16} />}
            label="Telepon"
            value={phone || "-"}
          />
          <InfoRow
            icon={<Building2 size={16} />}
            label="Departemen"
            value={
              department ? (
                <span className="inline-flex items-center gap-2">
                  <span>{department.name}</span>
                  {department.code && (
                    <span className="text-[10.5px] text-slate-400 font-normal tabular-nums">
                      {department.code}
                    </span>
                  )}
                </span>
              ) : (
                "-"
              )
            }
          />
          <InfoRow
            icon={<CalendarDays size={16} />}
            label="Tanggal Bergabung"
            value={formatDate(joinDate)}
          />
          <InfoRow
            icon={<UserCircle2 size={16} />}
            label="Terdaftar Sejak"
            value={formatDate(createdAt)}
          />
        </div>
      </section>

      <section>
        <SectionLabel>Keamanan</SectionLabel>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setPasswordOpen(true)}
            className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 active:bg-slate-100 transition"
          >
            <div className="text-slate-400 shrink-0">
              <KeyRound size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-medium text-slate-900">
                Ganti Password
              </p>
              <p className="text-[11.5px] text-slate-500 mt-0.5">
                Perbarui password akun secara berkala
              </p>
            </div>
            <ChevronRight size={17} className="text-slate-300 shrink-0" />
          </button>
        </div>
      </section>

      <FaceGallery />

      <EditProfileSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        initialValues={{
          fullName: fullName ?? "",
          phone: phone ?? "",
        }}
      />
      <ChangePasswordSheet open={passwordOpen} onOpenChange={setPasswordOpen} />
    </div>
  );
};

export default ProfilePage;
