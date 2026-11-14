import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { SSO_ROLES } from '../constants/modules';
import {
  getSupabaseClient,
  isPlaceholderKey,
  signInWithSso,
  signUpDosenOrKps,
} from '../lib/ssoAuth';
import { SsoRole, SupabaseSettings } from '../types/obe';

interface SsoAuthGateProps {
  supabaseSettings: SupabaseSettings;
  onOpenSupabaseConfig: () => void;
}

export function SsoAuthGate({
  supabaseSettings,
  onOpenSupabaseConfig,
}: SsoAuthGateProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [fullName, setFullName] = useState('');
  const [nidn, setNidn] = useState('');
  const [prodi, setProdi] = useState('');
  const [role, setRole] = useState<SsoRole>('Dosen Pengampu');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const keyMissing = isPlaceholderKey(supabaseSettings.publishableKey);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const client = getSupabaseClient(supabaseSettings);
    if (!client) {
      setErrorMsg(
        'Publishable Key Supabase belum dikonfigurasi. Klik tombol "Konfigurasi Kunci Supabase" di bawah untuk memasukkan kunci Anda.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await signInWithSso(client, loginEmail, loginPassword);
      if (error) {
        setErrorMsg(
          error.message === 'Invalid login credentials'
            ? 'Email atau password tidak sesuai. Silakan periksa kembali.'
            : error.message
        );
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal masuk ke sistem SSO.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const client = getSupabaseClient(supabaseSettings);
    if (!client) {
      setErrorMsg(
        'Publishable Key Supabase belum dikonfigurasi. Klik tombol "Konfigurasi Kunci Supabase" di bawah untuk memasukkan kunci Anda.'
      );
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password minimal 6 karakter.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await signUpDosenOrKps(client, {
        fullName,
        nidn,
        prodi,
        role,
        email: regEmail,
        password: regPassword,
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data.user && !data.session) {
        setSuccessMsg(
          `Pendaftaran berhasil untuk ${fullName}. Silakan periksa email (${regEmail}) untuk konfirmasi akun sebelum masuk.`
        );
        setActiveTab('login');
        setLoginEmail(regEmail);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal mendaftarkan akun baru.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      aria-label="Gerbang Autentikasi SSO SIMPEL-OBE"
      className="max-w-xl mx-auto w-full"
    >
      <div className="bg-white/95 backdrop-blur-md border border-white/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Accent Top Bar */}
        <div className="bg-[#0b3d91] text-white px-6 py-5 border-b-4 border-[#ffcc00]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ffcc00] text-[#0b3d91] flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                  Gerbang Single Sign-On (SSO)
                </h3>
                <p className="text-xs text-blue-200">
                  Satu akun terintegrasi untuk 7 modul Ekosistem SIMPEL-OBE (.simpatti.site)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 bg-slate-100/90 p-1.5 gap-1.5 border-b border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
            }}
            className={`inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'login'
                ? 'bg-[#0b3d91] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <LogIn className="w-4 h-4 shrink-0" />
            <span>Masuk (Login SSO)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'register'
                ? 'bg-[#0b3d91] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>Daftar Akun Baru</span>
          </button>
        </div>

        <div className="p-6 sm:p-7">
          {keyMissing && (
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-900">
              <div className="flex items-start sm:items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  Publishable Key Supabase belum diatur. Masukkan kunci terlebih dahulu agar
                  autentikasi SSO aktif.
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenSupabaseConfig}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shrink-0 whitespace-nowrap transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Konfigurasi Kunci</span>
              </button>
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-900"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="mb-5 flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-900"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="sso-login-email"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Email Institusi / Pribadi
                </label>
                <input
                  id="sso-login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="nama.dosen@unpatti.ac.id"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0b3d91] focus:border-[#0b3d91]"
                />
              </div>

              <div>
                <label
                  htmlFor="sso-login-password"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="sso-login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan password Anda"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0b3d91] focus:border-[#0b3d91]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    aria-label={showLoginPassword ? 'Sembunyikan password' : 'Lihat password'}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-700"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#0b3d91] hover:bg-blue-900 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-md transition-colors disabled:opacity-60 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {submitting ? 'Memverifikasi Sesi SSO...' : 'Masuk ke Ekosistem SIMPEL-OBE'}
                </span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label
                  htmlFor="sso-reg-fullname"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Nama Lengkap &amp; Gelar Akademik
                </label>
                <input
                  id="sso-reg-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Dr. Hendra Pattinama, M.Si."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0b3d91] focus:border-[#0b3d91]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="sso-reg-nidn"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    NIDN / NIP
                  </label>
                  <input
                    id="sso-reg-nidn"
                    type="text"
                    required
                    value={nidn}
                    onChange={(e) => setNidn(e.target.value)}
                    placeholder="Contoh: 0012048502"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0b3d91] focus:border-[#0b3d91]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sso-reg-role"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    Peran Akademik
                  </label>
                  <select
                    id="sso-reg-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as SsoRole)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0b3d91] focus:border-[#0b3d91]"
                  >
                    {SSO_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="sso-reg-prodi"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Program Studi
                </label>
                <input
                  id="sso-reg-prodi"
                  type="text"
                  required
                  value={prodi}
                  onChange={(e) => setProdi(e.target.value)}
                  placeholder="Contoh: Pendidikan Matematika / Ilmu Komputer"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0b3d91] focus:border-[#0b3d91]"
                />
              </div>

              <div>
                <label
                  htmlFor="sso-reg-email"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Email Institusi / Pribadi
                </label>
                <input
                  id="sso-reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="nama.dosen@unpatti.ac.id"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0b3d91] focus:border-[#0b3d91]"
                />
              </div>

              <div>
                <label
                  htmlFor="sso-reg-password"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Password (Minimal 6 Karakter)
                </label>
                <div className="relative">
                  <input
                    id="sso-reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Buat password yang kuat"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0b3d91] focus:border-[#0b3d91]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((prev) => !prev)}
                    aria-label={showRegPassword ? 'Sembunyikan password' : 'Lihat password'}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-700"
                  >
                    {showRegPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#ffcc00] hover:bg-amber-400 text-[#0b3d91] font-extrabold text-sm px-5 py-3 rounded-xl shadow-md transition-colors disabled:opacity-60 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{submitting ? 'Mendaftarkan Akun...' : 'Daftar Akun Dosen / KPS'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
