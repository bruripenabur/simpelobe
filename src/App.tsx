import { useCallback, useEffect, useState } from 'react';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { ModuleCard } from './components/ModuleCard';
import { SyncControlBar } from './components/SyncControlBar';
import {
  CAMPUS_BG_URL,
  DEFAULT_MODULE_URLS,
  DEFAULT_SUPABASE_SETTINGS,
  OBE_MODULES,
  STORAGE_KEYS,
} from './constants/modules';
import { fetchObeRpsList } from './services/supabaseClient';
import { ModuleId, ModuleUrlMap, ObeRpsRecord, SupabaseSettings } from './types/obe';

function loadStoredModuleUrls(): ModuleUrlMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MODULE_URLS);
    if (!raw) return DEFAULT_MODULE_URLS;
    const parsed = JSON.parse(raw) as Partial<ModuleUrlMap>;
    return { ...DEFAULT_MODULE_URLS, ...parsed };
  } catch {
    return DEFAULT_MODULE_URLS;
  }
}

function loadStoredSupabaseSettings(): SupabaseSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    if (!raw) return DEFAULT_SUPABASE_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SupabaseSettings>;
    return {
      url: parsed.url || DEFAULT_SUPABASE_SETTINGS.url,
      publishableKey: parsed.publishableKey || DEFAULT_SUPABASE_SETTINGS.publishableKey,
    };
  } catch {
    return DEFAULT_SUPABASE_SETTINGS;
  }
}

function getInitialSelectedRpsId(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('rps_id');
    if (fromUrl) return fromUrl;
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_RPS_ID) || '';
  } catch {
    return '';
  }
}

export default function App() {
  const [moduleUrls, setModuleUrls] = useState<ModuleUrlMap>(loadStoredModuleUrls);
  const [supabaseSettings, setSupabaseSettings] = useState<SupabaseSettings>(
    loadStoredSupabaseSettings
  );

  const [rpsList, setRpsList] = useState<ObeRpsRecord[]>([]);
  const [selectedRpsId, setSelectedRpsId] = useState<string>(getInitialSelectedRpsId);
  const [loadingRps, setLoadingRps] = useState<boolean>(false);
  const [rpsError, setRpsError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState<boolean>(false);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'modules' | 'supabase'>('modules');
  const [focusedModuleId, setFocusedModuleId] = useState<ModuleId | null>(null);

  const loadRpsRecords = useCallback(async (settings: SupabaseSettings) => {
    setLoadingRps(true);
    setRpsError(null);
    const result = await fetchObeRpsList(settings);
    setRpsList(result.records);
    setRpsError(result.error);
    setNeedsKey(result.needsKey);
    setLoadingRps(false);

    if (result.records.length > 0) {
      setSelectedRpsId((current) => {
        if (current && !result.records.some((r) => r.id === current)) {
          return '';
        }
        return current;
      });
    }
  }, []);

  useEffect(() => {
    void loadRpsRecords(supabaseSettings);
  }, [loadRpsRecords, supabaseSettings]);

  const handleSelectRps = (rpsId: string) => {
    setSelectedRpsId(rpsId);
    try {
      if (rpsId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_RPS_ID, rpsId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_RPS_ID);
      }
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleOpenSettings = (tab: 'modules' | 'supabase', moduleId: ModuleId | null = null) => {
    setModalTab(tab);
    setFocusedModuleId(moduleId);
    setModalOpen(true);
  };

  const handleSaveModules = (nextUrls: ModuleUrlMap) => {
    setModuleUrls(nextUrls);
    try {
      localStorage.setItem(STORAGE_KEYS.MODULE_URLS, JSON.stringify(nextUrls));
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleSaveSupabase = (nextSettings: SupabaseSettings) => {
    setSupabaseSettings(nextSettings);
    try {
      localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(nextSettings));
    } catch {
      // Ignore storage quota errors
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-slate-800 text-slate-900"
      style={{
        backgroundImage: `url('${CAMPUS_BG_URL}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Hero Section dengan lapisan overlay gelap sangat tipis (bg-slate-900/25) hanya di area teks judul utama */}
        <section className="mb-8 text-center">
          <div className="inline-block max-w-4xl mx-auto bg-slate-900/25 backdrop-blur-[2px] rounded-2xl px-6 py-6 sm:px-10 sm:py-8">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white drop-shadow-md leading-tight text-balance">
              Layanan Kurikulum &amp; Inovasi Pembelajaran Terintegrasi
            </h2>
            <p className="mt-3 text-sm sm:text-base text-white/95 drop-shadow max-w-3xl mx-auto leading-relaxed">
              Sistem terintegrasi end-to-end (Siklus PPEPP) untuk memudahkan KPS dan dosen
              merancang kurikulum, menyusun RPS, buku ajar, rubrik, portofolio nilai, mengukur
              CPL, hingga rencana CQI.
            </p>
          </div>
        </section>

        {/* Bilah Sinkronisasi Mata Kuliah Aktif */}
        <SyncControlBar
          rpsList={rpsList}
          selectedRpsId={selectedRpsId}
          onSelectRps={handleSelectRps}
          loading={loadingRps}
          error={rpsError}
          needsKey={needsKey}
          supabaseSettings={supabaseSettings}
          onRefresh={() => void loadRpsRecords(supabaseSettings)}
          onOpenAdminSettings={(tab) => handleOpenSettings(tab, null)}
        />

        {/* Grid Kartu Glassmorphism 7 Modul Terintegrasi */}
        <section aria-label="Daftar Modul Ekosistem Digital OBE">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {OBE_MODULES.map((mod) => (
              <ModuleCard
                key={mod.id}
                module={mod}
                configuredUrl={moduleUrls[mod.id]}
                activeRpsId={selectedRpsId}
                onEditUrl={(id) => handleOpenSettings('modules', id)}
              />
            ))}
          </div>
        </section>
      </main>

      <Footer />

      <AdminSettingsModal
        isOpen={modalOpen}
        initialTab={modalTab}
        focusedModuleId={focusedModuleId}
        moduleUrls={moduleUrls}
        supabaseSettings={supabaseSettings}
        onClose={() => setModalOpen(false)}
        onSaveModules={handleSaveModules}
        onSaveSupabase={handleSaveSupabase}
      />
    </div>
  );
}
