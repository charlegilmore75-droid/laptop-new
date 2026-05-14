'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Laptop, Loader2, ArrowRight, Eye, EyeOff, Lock, ShieldCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

type Step = 'email' | 'otp' | 'direct';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), lang: locale }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || (isRTL ? 'حدث خطأ' : 'An error occurred'));
      if (json.otpRequired === false) {
        setStep('direct');
      } else {
        setStep('otp');
        setResendCooldown(60);
        toast.success(isRTL ? `تم إرسال الكود إلى ${email}` : `Code sent to ${email}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (isRTL ? 'حدث خطأ' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendLoading(true);
    try {
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), lang: locale }),
      });
      setResendCooldown(60);
      toast.success(isRTL ? 'تم إعادة إرسال الكود' : 'Code resent');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error(isRTL ? 'أدخل الكود كاملاً (6 أرقام)' : 'Enter the full 6-digit code'); return; }
    if (password.length < 8) { toast.error(isRTL ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { toast.error(isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), otp, password, confirmPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || (isRTL ? 'حدث خطأ' : 'An error occurred'));
      toast.success(isRTL ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');
      const result = await signIn('credentials', { email: email.toLowerCase().trim(), password, redirect: false });
      if (result?.ok) { router.push(`/${locale}`); router.refresh(); }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (isRTL ? 'كود خاطئ أو منتهي الصلاحية' : 'Invalid or expired code'));
    } finally {
      setLoading(false);
    }
  };

  const handleDirectRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error(isRTL ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { toast.error(isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password, confirmPassword, lang: locale }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || (isRTL ? 'حدث خطأ' : 'An error occurred'));
      toast.success(isRTL ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');
      const result = await signIn('credentials', { email: email.toLowerCase().trim(), password, redirect: false });
      if (result?.ok) { router.push(`/${locale}`); router.refresh(); }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (isRTL ? 'حدث خطأ' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 bg-white/20 rounded-2xl items-center justify-center mb-4 backdrop-blur-sm border border-white/30">
              {step === 'email' ? <Laptop className="w-8 h-8 text-white" /> : <ShieldCheck className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-2xl font-black text-white">LaptopStore</h1>
            <p className="text-white/60 text-sm mt-1">
              {step === 'email'
                ? (isRTL ? 'أدخل بريدك الإلكتروني للتسجيل' : 'Enter your email to register')
                : step === 'otp'
                ? (isRTL ? `تم إرسال الكود إلى ${email}` : `Code sent to ${email}`)
                : (isRTL ? 'أنشئ كلمة مرور لحسابك' : 'Create a password for your account')}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.form key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSendOTP} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isRTL ? 'البريد الإلكتروني' : 'Email address'}
                    required
                    autoFocus
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl px-4 py-3 ps-11 outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-white text-blue-900 py-3.5 rounded-xl font-bold text-base hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  {isRTL ? 'متابعة' : 'Continue'}
                </button>
              </motion.form>
            )}

            {step === 'otp' && (
              <motion.form key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="text-white/70 text-xs mb-2 block">{isRTL ? 'كود التحقق (6 أرقام)' : 'Verification Code (6 digits)'}</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="○○○○○○"
                    autoFocus
                    maxLength={6}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-xl px-4 py-4 text-center text-3xl font-black tracking-[0.6em] outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isRTL ? 'كلمة المرور (8 أحرف على الأقل)' : 'Password (min. 8 chars)'}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl px-4 py-3 ps-11 pe-11 outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl px-4 py-3 ps-11 pe-11 outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute end-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length < 6 || !password || !confirmPassword}
                  className="w-full bg-white text-blue-900 py-3.5 rounded-xl font-bold text-base hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  {isRTL ? 'إنشاء الحساب' : 'Create Account'}
                </button>
                <div className="flex items-center justify-between text-sm">
                  <button type="button" onClick={() => setStep('email')} className="text-white/50 hover:text-white transition-colors">
                    ← {isRTL ? 'تغيير الإيميل' : 'Change email'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || resendCooldown > 0}
                    className="text-white/60 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {resendLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    {resendCooldown > 0 ? `(${resendCooldown}s)` : (isRTL ? 'إعادة إرسال الكود' : 'Resend Code')}
                  </button>
                </div>
              </motion.form>
            )}

            {step === 'direct' && (
              <motion.form key="direct" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleDirectRegister} className="space-y-4">
                <div className="bg-white/10 rounded-xl p-3 text-white/80 text-sm text-center border border-white/20">
                  <Mail className="w-4 h-4 inline me-2" />
                  {email}
                </div>
                <div className="relative">
                  <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isRTL ? 'كلمة المرور (8 أحرف على الأقل)' : 'Password (min. 8 chars)'}
                    autoFocus
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl px-4 py-3 ps-11 pe-11 outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-xl px-4 py-3 ps-11 pe-11 outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute end-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  className="w-full bg-white text-blue-900 py-3.5 rounded-xl font-bold text-base hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  {isRTL ? 'إنشاء الحساب' : 'Create Account'}
                </button>
                <button type="button" onClick={() => { setStep('email'); setPassword(''); setConfirmPassword(''); }} className="w-full text-white/50 hover:text-white text-sm transition-colors">
                  ← {isRTL ? 'تغيير الإيميل' : 'Change email'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center text-white/60 text-sm mt-6">
            {isRTL ? 'لديك حساب؟' : 'Already have an account?'}{' '}
            <Link href={`/${locale}/auth/login`} className="text-white hover:underline font-semibold">
              {isRTL ? 'تسجيل الدخول' : 'Sign in'}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
