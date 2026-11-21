import { getErrorMessage } from "@shared/utils/error";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
  updatePasswordSchema,
  type UpdatePasswordValues,
} from "@features/users/validation/profile.validation";
import { useUpdatePassword } from "@features/users/hooks/useUpdatePassword";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChangePasswordSheet = ({ open, onOpenChange }: Props) => {
  const { updatePassword, isPending } = useUpdatePassword();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
    mode: "onTouched",
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset();
      setShowOld(false);
      setShowNew(false);
    }
    onOpenChange(next);
  };

  const onSubmit = async (data: UpdatePasswordValues) => {
    try {
      await updatePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password berhasil diperbarui");
      handleOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal memperbarui password"));
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-w-[420px] mx-auto rounded-t-2xl max-h-[92dvh] overflow-y-auto bg-slate-50"
      >
        <SheetHeader className="pt-5 pb-2">
          <SheetTitle className="text-lg">Ganti Password</SheetTitle>
          <SheetDescription>
            Masukkan password lama, lalu password baru minimal 6 karakter.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="px-4 pb-6 space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label
              htmlFor="oldPassword"
              className="text-[13px] font-medium text-slate-700"
            >
              Password Lama
            </Label>
            <div className="relative">
              <Input
                id="oldPassword"
                type={showOld ? "text" : "password"}
                autoComplete="current-password"
                aria-invalid={!!errors.oldPassword}
                className="h-11 text-[14px] bg-white pr-10"
                {...register("oldPassword")}
              />
              <button
                type="button"
                onClick={() => setShowOld((v) => !v)}
                aria-label={showOld ? "Sembunyikan" : "Tampilkan"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600"
              >
                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.oldPassword && (
              <p className="text-[12px] text-rose-600">
                {errors.oldPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="newPassword"
              className="text-[13px] font-medium text-slate-700"
            >
              Password Baru
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={!!errors.newPassword}
                className="h-11 text-[14px] bg-white pr-10"
                {...register("newPassword")}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? "Sembunyikan" : "Tampilkan"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-[12px] text-rose-600">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="confirmPassword"
              className="text-[13px] font-medium text-slate-700"
            >
              Konfirmasi Password Baru
            </Label>
            <Input
              id="confirmPassword"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              className="h-11 text-[14px] bg-white"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-[12px] text-rose-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 rounded-lg bg-cta hover:bg-cta/90 text-white text-[15px] font-medium disabled:opacity-60"
          >
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Memperbarui...
              </span>
            ) : (
              "Perbarui Password"
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default ChangePasswordSheet;
