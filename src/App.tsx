import { useCallback, useEffect, useMemo, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { ModuleCard } from './components/ModuleCard';
import { SsoAuthGate } from './components/SsoAuthGate';
import { SyncControlBar } from './components/SyncControlBar';
import {
  CAMPUS_BG_URL,
  DEFAULT_MODULE_URLS,
  DEFAULT_SUPABASE_SETTINGS,
  OBE_MODULES,
  STORAGE_KEYS,
} from './constants/modules';
import {
  getSupabaseClient,
  readStoredSsoSession,
  saveSsoSession,
  signOutSso,
} from './lib/ssoAuth';
import { doesRpsBelongToUser, fetchObeRpsList } from './services/supabaseClient';
import {
  ModuleId,
  ModuleUrlMap,
  ObeRpsRecord,
  RpsOwnershipFilter,
  SupabaseSettings,
} from './types/obe';

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

  // SSO Auth Session state
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  // RPS list & ownership filter state
  const [rpsList, setRpsList] = useState<ObeRpsRecord[]>([]);
  const [ownershipFilter, setOwnershipFilter] = useState<RpsOwnershipFilter>('all_prodi');
  const [selectedRpsId, setSelectedRpsId] = useState<string>(getInitialSelectedRpsId);
  const [loadingRps, setLoadingRps] = useState<boolean>(false);
  const [rpsError, setRpsError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState<boolean>(false);

  // Admin Settings modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'modules' | 'supabase'>('modules');
  const [focusedModuleId, setFocusedModuleId] = useState<ModuleId | null>(null);

  // Initialize & subscribe to Supabase Auth SSO state
  useEffect(() => {
    const client = getSupabaseClient(supabaseSettings);
    if (!client) {
      setSession(null);
      setAuthLoading(false);
      return;
    }

    let isMounted = true;

    const initAuth = async () => {
      setAuthLoading(true);
      try {
        const { data } = await client.auth.getSession();
        let activeSession = data.session;

        if (!activeSession) {
          const storedTokens = readStoredSsoSession();
          if (storedTokens) {
            const restored = await client.auth.setSession({
              access_token: storedTokens.access_token,
              refresh_token: storedTokens.refresh_token,
            });
            activeSession = restored.data.session;
          }
        }

        if (isMounted) {
          if (activeSession) {
            saveSsoSession(activeSession);
          }
          setSession(activeSession);
        }
      } catch {
        if (isMounted) {
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    void initAuth();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      saveSsoSession(nextSession);
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabaseSettings]);

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
    if (session) {
      void loadRpsRecords(supabaseSettings);
    } else {
      setRpsList([]);
    }
  }, [session, loadRpsRecords, supabaseSettings]);

  const mineRpsList = useMemo(() => {
    if (!session?.user) return [];
    return rpsList.filter((rps) => doesRpsBelongToUser(rps, session.user));
  }, [rpsList, session]);

  const displayedRpsList = useMemo(() => {
    return ownershipFilter === 'mine' ? mineRpsList : rpsList;
  }, [ownershipFilter, mineRpsList, rpsList]);

  useEffect(() => {
    if (selectedRpsId && !displayedRpsList.some((r) => r.id === selectedRpsId)) {
      if (displayedRpsList.length > 0 || ownershipFilter === 'mine') {
        // Pertahankan pilihan hanya jika ada di list aktif
        if (ownershipFilter === 'mine') {
          setSelectedRpsId('');
        }
      }
    }
  }, [displayedRpsList, ownershipFilter, selectedRpsId]);

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

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const client = getSupabaseClient(supabaseSettings);
      await signOutSso(client);
      setSession(null);
      setSelectedRpsId('');
      try {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_RPS_ID);
      } catch {
        // Ignore storage error
      }
    } finally {
      setLoggingOut(false);
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
      <Header
        user={session?.user ?? null}
        onLogout={() => void handleLogout()}
        loggingOut={loggingOut}
      />

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

        {authLoading ? (
          <div className="max-w-md mx-auto bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/60 text-center">
            <div className="w-8 h-8 border-4 border-[#0b3d91] border-t-[#ffcc00] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">
              Memeriksa sesi Single Sign-On (SSO)...
            </p>
          </div>
        ) : !session ? (
          <SsoAuthGate
            supabaseSettings={supabaseSettings}
            onOpenSupabaseConfig={() => handleOpenSettings('supabase', null)}
          />
        ) : (
          <>
            {/* Bilah Sinkronisasi Mata Kuliah Aktif */}
            <SyncControlBar
              rpsList={displayedRpsList}
              totalRpsCount={rpsList.length}
              mineRpsCount={mineRpsList.length}
              ownershipFilter={ownershipFilter}
              onChangeOwnershipFilter={setOwnershipFilter}
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
                    session={session}
                    onEditUrl={(id) => handleOpenSettings('modules', id)}
                  />
                ))}
              </div>
            </section>
          </>
        )}
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
