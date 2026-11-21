import { Check } from "lucide-react";
import { useMyFacesEmbed } from "@features/faces/hooks/useMyFaceEmbed";
import { useProfileUser } from "@features/users/hooks/useProfile";

const VerifiedIdentityCard = () => {
  const { embeddings, isLoading: facesLoading } = useMyFacesEmbed();
  const { userProfile, isLoading: profileLoading } = useProfileUser();
  const firstFace = embeddings[0];
  const isLoading = profileLoading || facesLoading;
  const initial = userProfile?.fullName?.charAt(0)?.toUpperCase() ?? "?";

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-paper-raised border border-line mb-3 overflow-hidden">
        <div className="flex items-center gap-3.5 px-4 py-4">
          <div className="w-14 h-14 rounded-xl bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 rounded-full bg-muted animate-pulse" />
            <div className="h-3 w-28 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
        <div className="border-t border-line px-4 py-3 grid grid-cols-2 gap-y-1.5">
          <div className="h-2.5 w-10 rounded-full bg-muted animate-pulse" />
          <div className="h-2.5 w-16 rounded-full bg-muted animate-pulse justify-self-end" />
          <div className="h-2.5 w-16 rounded-full bg-muted animate-pulse" />
          <div className="h-2.5 w-20 rounded-full bg-muted animate-pulse justify-self-end" />
        </div>
      </div>
    );
  }

  const positionLabel = userProfile?.position?.replace(/_/g, " ");

  return (
    <div className="rounded-2xl bg-paper-raised border border-line mb-3 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-300">
      <div className="flex items-center gap-3.5 px-4 pt-4 pb-3.5">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-brand text-white flex items-center justify-center text-lg font-semibold ring-1 ring-line shrink-0">
          {firstFace?.imageUrl_url ? (
            <img
              src={firstFace.imageUrl_url}
              alt={userProfile?.fullName ?? "Profil"}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <span>{initial}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[15.5px] font-semibold text-ink leading-tight truncate">
            {userProfile?.fullName ?? "—"}
          </p>
          {positionLabel && (
            <p className="text-[12px] text-ink-muted truncate mt-1">
              {positionLabel}
            </p>
          )}
        </div>

        <div className="shrink-0 inline-flex items-center gap-1 rounded-full bg-brand-soft text-brand px-2 h-6">
          <Check size={11} strokeWidth={3} />
          <span className="text-[10px] uppercase tracking-wider font-semibold">
            Verified
          </span>
        </div>
      </div>

      <div className="border-t border-line px-4 py-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[11.5px]">
        {userProfile?.employeeId && (
          <>
            <span className="text-ink-faint uppercase tracking-wider font-semibold text-[10px]">
              NIP
            </span>
            <span className="text-ink-muted font-semibold tabular-nums text-right truncate">
              {userProfile.employeeId}
            </span>
          </>
        )}
        {userProfile?.department?.name && (
          <>
            <span className="text-ink-faint uppercase tracking-wider font-semibold text-[10px]">
              Unit
            </span>
            <span className="text-ink-muted font-medium text-right truncate">
              {userProfile.department.name}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifiedIdentityCard;
