import { useEffect, useState } from 'react';
import { Database, Globe, RotateCcw, Save, X } from 'lucide-react';
import {
  DEFAULT_MODULE_URLS,
  DEFAULT_SUPABASE_SETTINGS,
  OBE_MODULES,
} from '../constants/modules';
import { ModuleId, ModuleUrlMap, SupabaseSettings } from '../types/obe';

interface AdminSettingsModalProps {
  isOpen: boolean;
  initialTab: 'modules' | 'supabase';
  focusedModuleId: ModuleId | null;
  moduleUrls: ModuleUrlMap;
  supabaseSettings: SupabaseSettings;
  onClose: () => void;
  onSaveModules: (urls: ModuleUrlMap) => void;
  onSaveSupabase: (settings: SupabaseSettings) => void;
}

export function AdminSettingsModal({
  isOpen,
  initialTab,
  focusedModuleId,
  moduleUrls,
  supabaseSettings,
  onClose,
  onSaveModules,
  onSaveSupabase,
}: AdminSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'modules' | 'supabase'>(initialTab);
  const [draftUrls, setDraftUrls] = useState<ModuleUrlMap>(moduleUrls);
  const [draftSupabase, setDraftSupabase] = useState<SupabaseSettings>(supabaseSettings);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setDraftUrls(moduleUrls);
      setDraftSupabase(supabaseSettings);
    }
  }, [isOpen, initialTab, moduleUrls, supabaseSettings]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveModules(draftUrls);
    onSaveSupabase({
      url: draftSupabase.url.trim() || DEFAULT_SUPABASE_SETTINGS.url,
      publishableKey: draftSupabase.publishableKey.trim(),
    });
    onClose();
  };

  const handleResetDefaults = () => {
    if (activeTab === 'modules') {
      setDraftUrls(DEFAULT_MODULE_URLS);
    } else {
      setDraftSupabase(DEFAULT_SUPABASE_SETTINGS);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-settings-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-[#0b3d91] text-white px-6 py-4 flex items-center justify-between border-b-4 border-[#ffcc00]">
          <div>
            <h2 id="admin-settings-title" className="text-base sm:text-lg font-bold">
              Pengaturan Admin LPMPP — Ekosistem OBE
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Perbarui alamat URL ketujuh modul dan konfigurasi koneksi Supabase secara langsung.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal pengaturan"
            className="p-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
          <button
            type="button"
            onClick={() => setActiveTab('modules')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl border-b-2 transition-colors ${
              activeTab === 'modules'
                ? 'bg-white text-[#0b3d91] border-[#0b3d91]'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Alamat URL 7 Modul</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl border-b-2 transition-colors ${
              activeTab === 'supabase'
                ? 'bg-white text-[#0b3d91] border-[#0b3d91]'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Koneksi Supabase (obe_rps)</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'modules' ? (
            <div className="space-y-4">
              {OBE_MODULES.map((mod) => {
                const isFocused = focusedModuleId === mod.id;
                return (
                  <div
                    key={mod.id}
                    className={`rounded-xl p-3.5 border transition-colors ${
                      isFocused
                        ? 'border-[#0b3d91] bg-blue-50/60 ring-1 ring-[#0b3d91]/20'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <label
                      htmlFor={`url-input-${mod.id}`}
                      className="flex items-center justify-between gap-2 text-xs font-bold text-slate-800 mb-1.5"
                    >
                      <span>
                        {mod.code}: {mod.title}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        {mod.stageBadge}
                      </span>
                    </label>
                    <input
                      id={`url-input-${mod.id}`}
                      type="text"
                      autoFocus={isFocused}
                      value={draftUrls[mod.id]}
                      onChange={(e) =>
                        setDraftUrls((prev) => ({
                          ...prev,
                          [mod.id]: e.target.value,
                        }))
                      }
                      placeholder={mod.defaultUrl}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#0b3d91] focus:border-[#0b3d91]"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs text-slate-700 leading-relaxed">
                Portal membaca daftar mata kuliah aktif dari tabel{' '}
                <code className="font-mono font-semibold text-[#0b3d91]">obe_rps</code> (kolom{' '}
                <code className="font-mono">id, kode_mk, nama_mk, prodi, status_siklus</code>)
                menggunakan Supabase REST API.
              </div>

              <div>
                <label
                  htmlFor="supabase-url-input"
                  className="block text-xs font-bold text-slate-800 mb-1.5"
                >
                  Supabase Project URL
                </label>
                <input
                  id="supabase-url-input"
                  type="url"
                  value={draftSupabase.url}
                  onChange={(e) =>
                    setDraftSupabase((prev) => ({ ...prev, url: e.target.value }))
                  }
                  placeholder={DEFAULT_SUPABASE_SETTINGS.url}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#0b3d91] focus:border-[#0b3d91]"
                />
              </div>

              <div>
                <label
                  htmlFor="supabase-key-input"
                  className="block text-xs font-bold text-slate-800 mb-1.5"
                >
                  Supabase Publishable / Anon Key
                </label>
                <input
                  id="supabase-key-input"
                  type="text"
                  value={draftSupabase.publishableKey}
                  onChange={(e) =>
                    setDraftSupabase((prev) => ({
                      ...prev,
                      publishableKey: e.target.value,
                    }))
                  }
                  placeholder="[MASUKKAN_PUBLISHABLE_KEY_SUPABASE_ANDA]"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#0b3d91] focus:border-[#0b3d91]"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Disimpan secara lokal di browser admin/dosen untuk menyinkronkan dropdown mata kuliah aktif.
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke Default</span>
            </button>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0b3d91] hover:bg-blue-900 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Simpan & Terapkan</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
