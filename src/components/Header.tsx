import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { GraduationCap, LogOut, UserCircle2 } from 'lucide-react';
import { UNPATTI_LOGO_URL } from '../constants/modules';
import { extractUserProfile } from '../lib/ssoAuth';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  loggingOut?: boolean;
}

export function Header({ user, onLogout, loggingOut = false }: HeaderProps) {
  const [logoError, setLogoError] = useState(false);
  const profile = extractUserProfile(user);

  return (
    <header className="sticky top-0 z-50 bg-[#0b3d91]/90 backdrop-blur-md text-white shadow-lg border-b-4 border-[#ffcc00] py-4 px-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {!logoError ? (
            <img
              src={UNPATTI_LOGO_URL}
              alt="Logo Universitas Pattimura"
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
              className="w-12 h-12 object-contain bg-white rounded-full p-1 shadow shrink-0"
            />
          ) : (
            <div
              className="w-12 h-12 bg-white text-[#0b3d91] rounded-full p-1.5 shadow flex items-center justify-center shrink-0"
              aria-label="Logo Universitas Pattimura"
            >
              <GraduationCap className="w-7 h-7" />
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg md:text-xl font-extrabold tracking-wide uppercase leading-tight text-white truncate">
              PORTAL EKOSISTEM DIGITAL OBE
            </h1>
            <p className="text-xs text-blue-200 leading-snug mt-0.5 truncate">
              Pusat Kurikulum dan Inovasi Pembelajaran - Universitas Pattimura
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 self-start lg:self-center">
          {user ? (
            <div className="flex flex-wrap items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-3.5 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <UserCircle2 className="w-8 h-8 text-[#ffcc00] shrink-0" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[220px]">
                      {profile.fullName}
                    </span>
                    <span className="inline-block bg-[#ffcc00] text-[#0b3d91] font-bold px-2.5 py-0.5 rounded-full text-[11px] shadow-sm whitespace-nowrap">
                      {profile.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-200 truncate max-w-[260px]">
                    {profile.prodi}
                    {profile.nidn ? ` · NIDN/NIP ${profile.nidn}` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                disabled={loggingOut}
                title="Keluar dari sesi SSO SIMPEL-OBE"
                className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-rose-600 text-white border border-white/25 hover:border-rose-500 font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{loggingOut ? 'Keluar...' : 'Keluar'}</span>
              </button>
            </div>
          ) : (
            <span className="inline-block bg-[#ffcc00] text-[#0b3d91] font-bold px-4 py-1.5 rounded-full text-xs shadow-sm whitespace-nowrap">
              Inovasi Mutu Akademik
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
