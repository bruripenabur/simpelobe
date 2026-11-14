import { Fragment } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookMarked,
  CheckCircle2,
  Circle,
  Filter,
  KeyRound,
  Link2,
  RefreshCw,
  Settings,
  X,
} from 'lucide-react';
import { isPlaceholderKey } from '../lib/ssoAuth';
import { parseStatusSiklus } from '../services/supabaseClient';
import { ObeRpsRecord, RpsOwnershipFilter, SupabaseSettings } from '../types/obe';

interface SyncControlBarProps {
  rpsList: ObeRpsRecord[];
  totalRpsCount: number;
  mineRpsCount: number;
  ownershipFilter: RpsOwnershipFilter;
  onChangeOwnershipFilter: (filter: RpsOwnershipFilter) => void;
  selectedRpsId: string;
  onSelectRps: (rpsId: string) => void;
  loading: boolean;
  error: string | null;
  needsKey: boolean;
  supabaseSettings: SupabaseSettings;
  onRefresh: () => void;
  onOpenAdminSettings: (initialTab: 'modules' | 'supabase') => void;
}

export function SyncControlBar({
  rpsList,
  totalRpsCount,
  mineRpsCount,
  ownershipFilter,
  onChangeOwnershipFilter,
  selectedRpsId,
  onSelectRps,
  loading,
  error,
  needsKey,
  supabaseSettings,
  onRefresh,
  onOpenAdminSettings,
}: SyncControlBarProps) {
  const selectedRps = rpsList.find((item) => item.id === selectedRpsId) || null;
  const cycleSteps = selectedRps ? parseStatusSiklus(selectedRps.status_siklus) : [];
  const keyIsMissing = needsKey || isPlaceholderKey(supabaseSettings.publishableKey);

  return (
    <section
      aria-label="Bilah Sinkronisasi Mata Kuliah Aktif"
      className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-xl border border-white/60 mb-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <label
              htmlFor="active-rps-select"
              className="flex items-center gap-2 text-sm font-bold text-[#0b3d91]"
            >
              <BookMarked className="w-4 h-4 shrink-0" />
              <span>Pilih Mata Kuliah / RPS Aktif (Opsional)</span>
            </label>

            {/* Filter RPS Milik Saya vs Semua RPS Prodi */}
            <div
              className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200"
              role="group"
              aria-label="Filter Kepemilikan RPS"
            >
              <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5 shrink-0 hidden sm:inline-block" />
              <button
                type="button"
                onClick={() => onChangeOwnershipFilter('mine')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  ownershipFilter === 'mine'
                    ? 'bg-[#0b3d91] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tampilkan RPS Milik Saya ({mineRpsCount})
              </button>
              <button
                type="button"
                onClick={() => onChangeOwnershipFilter('all_prodi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  ownershipFilter === 'all_prodi'
                    ? 'bg-[#0b3d91] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tampilkan Semua RPS Prodi ({totalRpsCount})
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <select
              id="active-rps-select"
              value={selectedRpsId}
              onChange={(e) => onSelectRps(e.target.value)}
              disabled={loading || (keyIsMissing && totalRpsCount === 0)}
              className="flex-1 min-w-0 bg-white border border-slate-300 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0b3d91] focus:border-[#0b3d91] disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
            >
              <option value="">
                {loading
                  ? 'Memuat daftar mata kuliah dari Supabase...'
                  : keyIsMissing && totalRpsCount === 0
                    ? '-- Masukkan Publishable Key Supabase untuk memuat tabel obe_rps --'
                    : rpsList.length === 0
                      ? ownershipFilter === 'mine' && totalRpsCount > 0
                        ? '-- Belum ada RPS milik Anda (alih ke Semua RPS Prodi) --'
                        : '-- Tidak ada data RPS pada tabel obe_rps --'
                      : '-- Semua Modul (Tanpa Konteks Mata Kuliah Tertentu) --'}
              </option>
              {rpsList.map((rps) => (
                <option key={rps.id} value={rps.id}>
                  {rps.kode_mk} — {rps.nama_mk}
                  {rps.prodi ? ` (${rps.prodi})` : ''}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 shrink-0">
              {selectedRpsId && (
                <button
                  type="button"
                  onClick={() => onSelectRps('')}
                  title="Hapus pilihan mata kuliah aktif"
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}

              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                title="Muat ulang daftar RPS dari Supabase"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Sinkronkan</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAdminSettings('modules')}
                title="Pengaturan URL Modul & Koneksi Supabase (Admin LPMPP)"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <Settings className="w-3.5 h-3.5 text-[#0b3d91]" />
                <span>Pengaturan URL</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {ownershipFilter === 'mine' && mineRpsCount === 0 && totalRpsCount > 0 && !loading && (
        <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-2.5 text-xs text-slate-700">
          <span>
            Belum ditemukan data RPS yang terhubung langsung dengan akun Anda pada tabel{' '}
            <code className="font-mono font-semibold text-[#0b3d91]">obe_rps</code>.
          </span>
          <button
            type="button"
            onClick={() => onChangeOwnershipFilter('all_prodi')}
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-[#0b3d91] hover:bg-blue-900 text-white font-semibold transition-colors shrink-0 whitespace-nowrap"
          >
            Lihat Semua RPS Prodi ({totalRpsCount})
          </button>
        </div>
      )}

      {keyIsMissing && !loading && (
        <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-900">
          <div className="flex items-start sm:items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              Koneksi ke tabel <code className="font-mono font-semibold">obe_rps</code> di{' '}
              <span className="font-medium">{supabaseSettings.url}</span> memerlukan{' '}
              <strong>Publishable Key Supabase</strong> yang valid.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenAdminSettings('supabase')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors shrink-0 whitespace-nowrap"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Atur Kunci Supabase</span>
          </button>
        </div>
      )}

      {error && !keyIsMissing && (
        <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-900">
          <div className="flex items-start sm:items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenAdminSettings('supabase')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors shrink-0 whitespace-nowrap"
          >
            <span>Periksa Pengaturan</span>
          </button>
        </div>
      )}

      {selectedRps && (
        <div className="mt-4 pt-4 border-t border-slate-200/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
              <span className="font-bold text-[#0b3d91] uppercase tracking-wide">
                Alur Progres Siklus OBE
              </span>
              <span aria-hidden="true" className="text-slate-300">
                |
              </span>
              <span className="font-semibold text-slate-900">
                {selectedRps.kode_mk} — {selectedRps.nama_mk}
              </span>
              {selectedRps.prodi && (
                <>
                  <span aria-hidden="true" className="text-slate-300">
                    ·
                  </span>
                  <span className="text-slate-600">{selectedRps.prodi}</span>
                </>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg self-start md:self-auto">
              <Link2 className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono truncate max-w-[240px]">
                ?rps_id={selectedRps.id}
              </span>
              <span>+ SSO aktif di semua modul</span>
            </div>
          </div>

          <div
            className="flex flex-wrap items-center gap-2"
            role="list"
            aria-label="Checklist Alur Progres Siklus OBE"
          >
            {cycleSteps.map((step, index) => (
              <Fragment key={step.key}>
                <div
                  role="listitem"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    step.completed
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span>{step.label}</span>
                  <span className="sr-only">
                    {step.completed ? '(Selesai)' : '(Belum selesai)'}
                  </span>
                </div>

                {index < cycleSteps.length - 1 && (
                  <ArrowRight
                    className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline-block"
                    aria-hidden="true"
                  />
                )}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
