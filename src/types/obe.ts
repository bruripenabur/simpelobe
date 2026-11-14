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
