import { getErrorMessage } from "@shared/utils/error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@features/auth/validation/reset-password.validation";
import { useResetPassword } from "@features/auth/hooks/useResetPassword";
import { Label } from "@ui/label";
import { Input } from "@ui/input";
import { Button } from "@ui/button";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const isWelcome = searchParams.get("welcome") === "1";
  const [showPassword, setShowPassword] = useState(false);

  const { resetPassword, isPending } = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
  });

  const onSubmit = (data: ResetPasswordValues) => {
    toast.promise(
      new Promise<{ message?: string }>((resolve, reject) => {
        resetPassword(
          { token, newPassword: data.newPassword },
          {
            onSuccess: (res) => {
              resolve(res);
              navigate("/auth/login");
            },
            onError: (err) => reject(err),
          },
        );
      }),
      {
        loading: "Menyimpan password baru...",
        success: (res: { message?: string }) =>
          res?.message || "Password berhasil direset. Silakan login.",
        error: (err: unknown) => getErrorMessage(err, "Gagal reset password"),
      },
    );
  };

  if (!token) {
    return (
      <div className="min-h-dvh bg-paper-raised flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-[22px] font-semibold text-ink">
          Tautan tidak valid
        </h1>
        <p className="text-[15px] text-ink-muted mt-2 max-w-sm">
          Tautan reset password tidak lengkap atau sudah kedaluwarsa. Silakan
          minta tautan baru.
        </p>
        <Button
          onClick={() => navigate("/auth/forgot-password")}
          className="h-12 mt-8 px-6 rounded-lg bg-brand hover:bg-brand-bright text-white text-[15px] font-medium"
        >
          Minta tautan baru
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-paper-raised flex flex-col justify-between px-6 pt-4 pb-8">
      <button
        onClick={() => navigate(-1)}
        aria-label="Go back"
        className="self-start p-2 -ml-2 rounded-full hover:bg-muted active:bg-line transition-colors"
      >
        <ArrowLeft size={20} strokeWidth={1.75} />
      </button>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="mb-10">
          <h1 className="text-[28px] font-semibold text-ink tracking-tight leading-snug">
            {isWelcome ? "Selamat datang 👋" : "Atur password baru"}
          </h1>
          <p className="text-[15px] text-ink-muted mt-1.5">
            {isWelcome
              ? "Akunmu sudah dibuat. Demi keamanan, atur password pribadimu untuk menggantikan password default dari admin."
              : "Buat password baru untuk akunmu."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          <div className="space-y-2">
            <Label
              htmlFor="newPassword"
              className="text-[13px] font-medium text-ink-muted"
            >
              Password baru
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                autoFocus
                placeholder="Minimal 6 karakter"
                aria-invalid={!!errors.newPassword}
                autoComplete="new-password"
                {...register("newPassword")}
                className="h-12 pr-11 text-[15px] focus-visible:ring-brand/25 focus-visible:border-brand"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-ink-faint hover:text-brand transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && (
              <p role="alert" className="text-[13px] text-danger">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-[13px] font-medium text-ink-muted"
            >
              Konfirmasi password
            </Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Ulangi password baru"
              aria-invalid={!!errors.confirmPassword}
              autoComplete="new-password"
              {...register("confirmPassword")}
              className="h-12 text-[15px] focus-visible:ring-brand/25 focus-visible:border-brand"
            />
            {errors.confirmPassword && (
              <p role="alert" className="text-[13px] text-danger">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 mt-2 rounded-lg bg-brand hover:bg-brand-bright text-white text-[15px] font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Menyimpan...
              </span>
            ) : (
              "Simpan password"
            )}
          </Button>
        </form>

        <p className="text-[14px] text-ink-muted text-center mt-8">
          <Link
            to="/auth/login"
            className="text-brand font-medium hover:underline"
          >
            Kembali ke login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
