import { getErrorMessage } from "@shared/utils/error";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@ui/sheet";
import { Button } from "@ui/button";
import { Input } from "@ui/input";
import { Label } from "@ui/label";
import {
  updateProfileSchema,
  type UpdateProfileValues,
} from "@features/users/validation/profile.validation";
import { useUpdateProfile } from "@features/users/hooks/useUpdateProfile";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: UpdateProfileValues;
}

const EditProfileSheet = ({ open, onOpenChange, initialValues }: Props) => {
  const { updateProfile, isPending } = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    values: initialValues,
    resetOptions: { keepDirtyValues: true },
    mode: "onTouched",
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) reset(initialValues);
    onOpenChange(next);
  };

  const onSubmit = async (data: UpdateProfileValues) => {
    try {
      await updateProfile(data);
      toast.success("Profil berhasil diperbarui");
      handleOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal memperbarui profil"));
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-w-[420px] mx-auto rounded-t-2xl max-h-[92dvh] overflow-y-auto bg-slate-50"
      >
        <SheetHeader className="pt-5 pb-2">
          <SheetTitle className="text-lg">Edit Profil</SheetTitle>
          <SheetDescription>Perbarui nama dan nomor telepon.</SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="px-4 pb-6 space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label
              htmlFor="fullName"
              className="text-[13px] font-medium text-slate-700"
            >
              Nama Lengkap
            </Label>
            <Input
              id="fullName"
              autoComplete="name"
              aria-invalid={!!errors.fullName}
              className="h-11 text-[14px] bg-white"
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="text-[12px] text-rose-600">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="phone"
              className="text-[13px] font-medium text-slate-700"
            >
              Nomor Telepon
            </Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              aria-invalid={!!errors.phone}
              className="h-11 text-[14px] bg-white"
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-[12px] text-rose-600">
                {errors.phone.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending || !isDirty}
            className="w-full h-12 rounded-lg bg-cta hover:bg-cta/90 text-white text-[15px] font-medium disabled:opacity-60"
          >
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Menyimpan...
              </span>
            ) : (
              "Simpan Perubahan"
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EditProfileSheet;
