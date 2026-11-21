import { getErrorMessage } from "@shared/utils/error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  loginUserSchema,
  type LoginFormValues,
} from "@features/auth/validation/login.validation";
import { useForm } from "react-hook-form";
import { Label } from "@ui/label";
import { Input } from "@ui/input";
import { Button } from "@ui/button";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useLogin } from "@features/auth/hooks/useLogin";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const { loginUser, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginUserSchema),
    mode: "onTouched",
  });

  const onSubmit = (data: LoginFormValues) => {
    const payload = { ...data, email: data.email.trim().toLowerCase() };

    toast.promise(
      new Promise<{ message?: string }>((resolve, reject) => {
        loginUser(payload, {
          onSuccess: (res) => resolve(res),
          onError: (err) => reject(err),
        });
      }),
      {
        loading: "Signing you in...",
        success: (res: { message?: string }) => res?.message || "Logged in",
        error: (err: unknown) => getErrorMessage(err, "Login failed"),
      },
    );
  };

  const detectCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(e.getModifierState?.("CapsLock") ?? false);
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
        <div className="mb-10">
          <h1 className="text-[28px] font-semibold text-ink tracking-tight leading-snug">
            Welcome back
          </h1>
          <p className="text-[15px] text-ink-muted mt-1.5">
            Sign in to continue to your account
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-[13px] font-medium text-ink-muted"
              >
                Password
              </Label>
              <Link
                to="/auth/forgot-password"
                className="text-[13px] text-brand font-medium hover:underline"
              >
                Forgot?
              </Link>
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                aria-invalid={!!errors.password}
                autoComplete="current-password"
                onKeyDown={detectCapsLock}
                onKeyUp={detectCapsLock}
                {...register("password")}
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

            {capsLock && !errors.password && (
              <p className="text-[12px] text-warning">Caps Lock is on</p>
            )}
            {errors.password && (
              <p role="alert" className="text-[13px] text-danger">
                {errors.password.message}
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
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
