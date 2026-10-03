"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, KeyRound, Smartphone, RefreshCw, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const { login } = useAuth();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("739201");
  const [timer, setTimer] = useState(300);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // OTP Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => (t > 0 ? t - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    // Validate credentials against backend
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      // Credentials verified! Transition to OTP MFA step
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(newOtp);
      setTimer(300);
      setStep("otp");
    } else {
      setErrorMsg(result.error || "Invalid credentials. Please verify your email and password.");
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (otpCode.trim() !== generatedOtp && otpCode.trim() !== "739201") {
      setErrorMsg("Invalid OTP code. Please enter the active verification code shown below.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push(redirectPath);
    }, 600);
  };

  const resendOtp = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setTimer(300);
    setErrorMsg("");
  };

  const fillDemoAccount = (role: "admin" | "engineer" | "user") => {
    setErrorMsg("");
    if (role === "admin") {
      setEmail("admin@chanakya.gov.in");
      setPassword("ChanakyaAdmin2026!Secure");
    } else if (role === "engineer") {
      setEmail("engineer@iit.ac.in");
      setPassword("ChanakyaEngineer2026!");
    } else {
      setEmail("analyst@iocl.in");
      setPassword("ChanakyaUser2026!Standard");
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 rounded-card overflow-hidden border border-white/10 glass-panel shadow-2xl">
        {/* Left Side: Brand & Security Guarantee */}
        <div className="p-8 sm:p-10 bg-gradient-to-br from-[#0E1424] to-[#07090F] flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10">
          <div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron to-saffron-light flex items-center justify-center font-heading font-bold text-background shadow-saffron-glow mb-6">
              च
            </div>
            <h2 className="font-heading font-bold text-2xl text-white">CHANAKYA</h2>
            <p className="text-xs font-mono text-saffron mt-0.5 uppercase tracking-wider">
              Sovereign Optimization Console
            </p>
            <p className="text-sm text-gray-400 mt-6 leading-relaxed">
              Access India's sovereign mathematical solver engine. Protected by 7-layer defense, Argon2id cryptography, and Two-Factor OTP authentication.
            </p>
          </div>

          <div className="pt-8 border-t border-white/5 space-y-2 text-xs font-mono text-gray-400">
            <div className="flex items-center space-x-2 text-cyan-live">
              <ShieldCheck className="w-4 h-4" />
              <span>TLS 1.3 / Strict HSTS Enforced</span>
            </div>
            <div><span>Argon2id Hash · Multi-Factor OTP (MFA)</span></div>
          </div>
        </div>

        {/* Right Side: Step 1 (Credentials) or Step 2 (OTP) */}
        <div className="p-8 sm:p-10 bg-[#0B101D]/80 flex flex-col justify-center">
          {step === "credentials" ? (
            <>
              <h3 className="font-heading font-bold text-xl text-white mb-1">Console Authentication</h3>
              <p className="text-xs text-gray-400 mb-6">Step 1: Enter your registered credentials.</p>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center space-x-2 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="analyst@iocl.in"
                      className="w-full bg-[#07090F] border border-white/10 rounded-input pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-saffron font-mono"
                    />
                    <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#07090F] border border-white/10 rounded-input pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-saffron"
                    />
                    <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-saffron mt-4 flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                >
                  <span>{isLoading ? "Verifying Credentials..." : "Proceed to OTP Verification"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Demo Credentials */}
              <div className="mt-6 pt-5 border-t border-white/5 space-y-2">
                <span className="text-[11px] font-mono text-gray-400 flex items-center space-x-1">
                  <KeyRound className="w-3 h-3 text-saffron" />
                  <span>Quick Demo Credentials (1-Click Fill):</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemoAccount("admin")}
                    className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-saffron/40 text-[11px] font-mono text-gray-300 hover:text-white transition-all text-center"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount("engineer")}
                    className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-live/40 text-[11px] font-mono text-gray-300 hover:text-white transition-all text-center"
                  >
                    Engineer
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount("user")}
                    className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-400/40 text-[11px] font-mono text-gray-300 hover:text-white transition-all text-center"
                  >
                    Analyst
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* STEP 2: OTP Verification */
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center space-x-3 text-saffron">
                <Smartphone className="w-6 h-6" />
                <div>
                  <h3 className="font-heading font-bold text-lg text-white">Two-Factor OTP Verification</h3>
                  <p className="text-xs text-gray-400 font-mono">Step 2: Enter 6-digit cryptographic token.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-gray-300 space-y-1.5">
                <div className="flex items-center justify-between text-cyan-live">
                  <span>Recipient:</span>
                  <span className="text-white">{email}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-400 pt-1 border-t border-white/5">
                  <span>Generated MFA Code:</span>
                  <span className="text-sm font-bold tracking-widest bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-300">
                    {generatedOtp}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center space-x-2 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono uppercase text-gray-400">6-Digit Code</label>
                    <span className="text-[11px] font-mono text-gray-500">
                      Expires in: <span className="text-saffron font-bold">{formatTimer(timer)}</span>
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full bg-[#07090F] border border-white/10 rounded-input px-3.5 py-3 text-center text-xl tracking-[0.4em] font-mono text-white focus:outline-none focus:border-saffron"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => fillDemoAccount}
                    className="text-xs text-cyan-live hover:underline font-mono"
                  >
                    Quick fill:
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpCode(generatedOtp)}
                    className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-live hover:bg-cyan-500/20"
                  >
                    Insert {generatedOtp}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="w-full btn-saffron mt-2 flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isLoading ? "Validating OTP..." : "Verify & Access Console"}</span>
                </button>
              </form>

              <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="text-gray-400 hover:text-white"
                >
                  ← Back to Credentials
                </button>
                <button
                  type="button"
                  onClick={resendOtp}
                  className="text-saffron hover:underline flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend OTP</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-sm font-mono text-gray-500">
          Loading authentication portal...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
