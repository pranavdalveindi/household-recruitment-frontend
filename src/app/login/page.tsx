"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";

const loginSchema = z.object({
  email: z.string().email("Enter a valid work email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@panelsphere.internal",
      password: "Password@123",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await apiFetch<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      });

      if (res.data) {
        login(res.data.token, res.data.user);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040a16] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.18),_transparent_40%)]" />
          <div className="relative w-full max-w-xl">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-black text-white shadow-lg shadow-blue-500/20">
                IA
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight">Indirex AM</div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Recruitment Portal</div>
              </div>
            </div>

            <div className="mt-12 max-w-md">
              <h1 className="text-4xl font-bold tracking-tight text-white">Welcome back</h1>
              <p className="mt-2 text-sm text-slate-400">Enter your credentials to access the Indirex AM platform</p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
                {errorMsg && (
                  <Alert variant="destructive" title="Authentication Error" description={errorMsg} />
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-200">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@inditronics.com"
                      className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950/60 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-200">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950/60 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-rose-400">{errors.password.message}</p>}
                </div>

                <Button type="submit" className="h-11 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500" isLoading={isLoading}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>

                <div className="pt-2 text-center text-[11px] text-slate-500">
                  Internal tool for authorized personnel only
                </div>
              </form>
            </div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden border-l border-slate-800 bg-[#050d1d] lg:flex lg:flex-col lg:justify-center">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(59,130,246,0.10),_rgba(15,23,42,0.05)),radial-gradient(circle_at_top,_rgba(96,165,250,0.18),_transparent_35%)]" />
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

          <div className="relative z-10 px-8 py-10 xl:px-12">
            <div className="max-w-xl ml-auto mr-0">
              <h2 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-[3.1rem]">
                Manage, monitor, and scale your fleet with confidence
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
                Unified command center designed for real-time telemetry, remote diagnostics, and automated fleet compliance reporting.
              </p>
            </div>

            <div className="mt-10 max-w-[820px] rounded-[22px] border border-slate-700/80 bg-slate-950/80 p-3 shadow-2xl shadow-blue-900/30 backdrop-blur-xl">
              <div className="rounded-[16px] border border-slate-800 bg-[#061322] p-3">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <div className="ml-auto text-[10px] uppercase tracking-[0.2em] text-slate-500">indirex.io</div>
                </div>

                <div className="grid gap-3 xl:grid-cols-[1.1fr_2.2fr]">
                  <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                    {[
                      { label: 'Devices', value: '384' },
                      { label: 'Active', value: '258' },
                      { label: 'Alerts', value: '46' },
                      { label: 'Maintenance', value: '29' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{item.label}</div>
                        <div className="mt-1 text-xl font-semibold text-white">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <div className="mb-3 h-48 rounded-lg border border-slate-800 bg-[radial-gradient(circle_at_50%_55%,rgba(96,165,250,0.42),rgba(15,23,42,1)_55%)]" />
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        ['Device Activity', '258'],
                        ['Fuel Efficiency', '94.2%'],
                        ['Regional', 'Yerevan'],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-slate-800 bg-slate-900/80 p-2">
                          <div className="text-[10px] uppercase tracking-[0.15em] text-slate-500">{label}</div>
                          <div className="mt-1 text-lg font-semibold text-white">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

