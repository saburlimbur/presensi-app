import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";

import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@features/auth/validation/forgot-password.validation";
import { useForgotPassword } from "@features/auth/hooks/useForgotPassword";
import { Label } from "@ui/label";
import { Input } from "@ui/input";
import { Button } from "@ui/button";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { forgotPassword, isPending } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
  });

  const onSubmit = (data: ForgotPasswordValues) => {
    const email = data.email.trim().toLowerCase();
    forgotPassword(
      { email },
      {
        onSuccess: () => setSentTo(email),
        onError: () =>
          toast.error("Gagal mengirim permintaan. Periksa koneksi lalu coba lagi."),
      },
    );
  };

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
        {sentTo ? (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft">
              <MailCheck size={26} className="text-brand" />
            </div>
            <h1 className="text-[24px] font-semibold text-ink tracking-tight">
              Cek email kamu
            </h1>
            <p className="text-[15px] text-ink-muted mt-2">
              Jika <span className="font-medium text-ink-muted">{sentTo}</span>{" "}
              terdaftar, kami sudah mengirim tautan reset password. Tautan
              berlaku terbatas waktu.
            </p>
            <Button
              onClick={() => navigate("/auth/login")}
              className="w-full h-12 mt-8 rounded-lg bg-brand hover:bg-brand-bright text-white text-[15px] font-medium"
            >
              Kembali ke login
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <h1 className="text-[28px] font-semibold text-ink tracking-tight leading-snug">
                Lupa password
              </h1>
              <p className="text-[15px] text-ink-muted mt-1.5">
                Masukkan email akunmu, kami kirim tautan untuk mengatur password
                baru.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-[13px] font-medium text-ink-muted"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoFocus
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  {...register("email")}
                  className="h-12 text-[15px] focus-visible:ring-brand/25 focus-visible:border-brand"
                />
                {errors.email && (
                  <p role="alert" className="text-[13px] text-danger">
                    {errors.email.message}
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
                    Mengirim...
                  </span>
                ) : (
                  "Kirim tautan reset"
                )}
              </Button>
            </form>

            <p className="text-[14px] text-ink-muted text-center mt-8">
              Ingat password kamu?{" "}
              <Link
                to="/auth/login"
                className="text-brand font-medium hover:underline"
              >
                Masuk
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
