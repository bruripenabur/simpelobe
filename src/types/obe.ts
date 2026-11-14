export type ModuleId =
  | 'modul-0'
  | 'modul-1'
  | 'modul-2'
  | 'modul-3'
  | 'modul-4'
  | 'modul-5'
  | 'modul-6';

export interface ObeModuleDefinition {
  id: ModuleId;
  code: string;
  title: string;
  stageBadge: string;
  badgeStyle: string;
  iconBoxStyle: string;
  description: string;
  buttonLabel: string;
  defaultUrl: string;
  isFoundation?: boolean;
}

export type ModuleUrlMap = Record<ModuleId, string>;

export type StatusSiklusValue =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | null
  | undefined;

export interface ObeRpsRecord {
  id: string;
  kode_mk: string;
  nama_mk: string;
  prodi: string | null;
  status_siklus: StatusSiklusValue;
  user_id?: string | null;
  created_by?: string | null;
  dosen_id?: string | null;
  owner_id?: string | null;
  nidn?: string | null;
  email?: string | null;
  dosen_email?: string | null;
  dosen_pengampu?: string | null;
  [key: string]: unknown;
}

export interface CycleChecklistStep {
  key: 'rps' | 'buku_ajar' | 'rubrik' | 'portofolio' | 'cpl';
  label: string;
  completed: boolean;
}

export interface SupabaseSettings {
  url: string;
  publishableKey: string;
}

export type SsoRole = 'Dosen Pengampu' | 'Ketua Program Studi' | 'Admin LPMPP';

export interface SsoUserMetadata {
  full_name?: string;
  nidn?: string;
  prodi?: string;
  role?: SsoRole | string;
  peran?: SsoRole | string;
}

export interface SsoTokenPayload {
  access_token: string;
  refresh_token: string;
}

export type RpsOwnershipFilter = 'mine' | 'all_prodi';
