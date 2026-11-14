import { ModuleUrlMap, ObeModuleDefinition, SupabaseSettings } from '../types/obe';

export const CAMPUS_BG_URL =
  'https://upload.wikimedia.org/wikipedia/commons/e/e2/Foto_Universitas-Patimura.webp';

export const UNPATTI_LOGO_URL =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Logo_Universitas_Pattimura_Terbaru.png/330px-Logo_Universitas_Pattimura_Terbaru.png';

export const DEFAULT_SUPABASE_URL = 'https://eysccwxpgdcoqfvaalye.supabase.co';
export const DEFAULT_SUPABASE_KEY_PLACEHOLDER = '[MASUKKAN_PUBLISHABLE_KEY_SUPABASE_ANDA]';

export const STORAGE_KEYS = {
  MODULE_URLS: 'unpatti_obe_module_urls_v1',
  SUPABASE_CONFIG: 'unpatti_obe_supabase_config_v1',
  ACTIVE_RPS_ID: 'unpatti_obe_active_rps_id_v1',
} as const;

export const OBE_MODULES: ObeModuleDefinition[] = [
  {
    id: 'modul-0',
    code: 'Modul 0',
    title: 'Master Kurikulum Prodi (CPL & Peta MK)',
    stageBadge: 'TAHAP 0 • HULU PRODI',
    badgeStyle: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
    iconBoxStyle: 'bg-indigo-100 text-indigo-700',
    description:
      'Fondasi kurikulum program studi untuk merumuskan Profil Lulusan, CPL, dan matriks pembebanan CPL ke setiap Mata Kuliah.',
    buttonLabel: 'Buka Master Kurikulum →',
    defaultUrl: '[URL_MODUL_0]',
    isFoundation: true,
  },
  {
    id: 'modul-1',
    code: 'Modul 1',
    title: 'Desain RPS OBE',
    stageBadge: 'TAHAP 1 • PENETAPAN (PLAN)',
    badgeStyle: 'bg-blue-50 text-[#0b3d91] border border-blue-200/80',
    iconBoxStyle: 'bg-blue-100 text-[#0b3d91]',
    description:
      'Tools cerdas berbasis AI untuk merumuskan CPMK, Sub-CPMK, peta pembelajaran 16 minggu, dan bobot asesmen berbasis OBE.',
    buttonLabel: 'Buka Modul RPS →',
    defaultUrl: 'https://desain-rpsobe.netlify.app/',
  },
  {
    id: 'modul-2',
    code: 'Modul 2',
    title: 'Penyusunan Buku Ajar Akademik',
    stageBadge: 'TAHAP 2 • PELAKSANAAN (DO)',
    badgeStyle: 'bg-purple-50 text-purple-700 border border-purple-200/80',
    iconBoxStyle: 'bg-purple-100 text-purple-700',
    description:
      'Menyusun naskah buku ajar komprehensif 16 bab berbasis RPS OBE, integrasi riset/PkM/SDGs, beserta kisi-kisi evaluasi TIU dan TKD.',
    buttonLabel: 'Buka Modul Buku Ajar →',
    defaultUrl: '[URL_MODUL_BUKU_AJAR]',
  },
  {
    id: 'modul-3',
    code: 'Modul 3',
    title: 'Instrumen Evaluasi & Rubrik Penilaian',
    stageBadge: 'TAHAP 3 • ASESMEN (DO)',
    badgeStyle: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    iconBoxStyle: 'bg-amber-100 text-amber-700',
    description:
      'Menyusun instrumen tugas, kuis, UTS, UAS, beserta matriks rubrik analitis bergradasi yang selaras dengan Sub-CPMK.',
    buttonLabel: 'Buka Modul Rubrik →',
    defaultUrl: 'https://sirubrik.netlify.app/',
  },
  {
    id: 'modul-4',
    code: 'Modul 4',
    title: 'Buku Nilai & Portofolio Perkuliahan',
    stageBadge: 'TAHAP 4 • BUKTI MUTU (CHECK)',
    badgeStyle: 'bg-cyan-50 text-cyan-800 border border-cyan-200/80',
    iconBoxStyle: 'bg-cyan-100 text-cyan-700',
    description:
      'Input nilai mahasiswa berbasis indikator rubrik serta unggah sampel karya terbaik/sedang/kurang dan BAP sebagai bukti audit.',
    buttonLabel: 'Buka Buku Nilai & Portofolio →',
    defaultUrl: '[URL_MODUL_4]',
  },
  {
    id: 'modul-5',
    code: 'Modul 5',
    title: 'Pengukuran CPL & Laporan Evaluasi CPMK',
    stageBadge: 'TAHAP 5 • EVALUASI MK (CHECK)',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
    iconBoxStyle: 'bg-emerald-100 text-emerald-700',
    description:
      'Kalkulasi otomatis ketercapaian CPMK dan CPL mata kuliah dari buku nilai rubrik, lengkap dengan laporan evaluasi dosen.',
    buttonLabel: 'Buka Modul Asesmen CPL →',
    defaultUrl: 'https://simpel-cpl.netlify.app/',
  },
  {
    id: 'modul-6',
    code: 'Modul 6',
    title: 'Agregasi CPL Prodi, Rapor Mahasiswa & CQI',
    stageBadge: 'TAHAP 6 • PENGENDALIAN & PENINGKATAN (PP)',
    badgeStyle: 'bg-rose-50 text-rose-800 border border-rose-200/80',
    iconBoxStyle: 'bg-rose-100 text-rose-700',
    description:
      'Agregasi capaian CPL lintas mata kuliah untuk LED Akreditasi & RTM, transkrip CPL mahasiswa, serta log tindak lanjut CQI.',
    buttonLabel: 'Buka Dashboard CQI Prodi →',
    defaultUrl: '[URL_MODUL_6]',
  },
];

export const DEFAULT_MODULE_URLS: ModuleUrlMap = OBE_MODULES.reduce(
  (acc, mod) => {
    acc[mod.id] = mod.defaultUrl;
    return acc;
  },
  {} as ModuleUrlMap
);

export const DEFAULT_SUPABASE_SETTINGS: SupabaseSettings = {
  url: DEFAULT_SUPABASE_URL,
  publishableKey:
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_KEY_PLACEHOLDER,
};
