import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { UNPATTI_LOGO_URL } from '../constants/modules';

export function Header() {
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#0b3d91]/90 backdrop-blur-md text-white shadow-lg border-b-4 border-[#ffcc00] py-4 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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

        <div className="shrink-0 self-start sm:self-center">
          <span className="inline-block bg-[#ffcc00] text-[#0b3d91] font-bold px-4 py-1.5 rounded-full text-xs shadow-sm whitespace-nowrap">
            Inovasi Mutu Akademik
          </span>
        </div>
      </div>
    </header>
  );
}
