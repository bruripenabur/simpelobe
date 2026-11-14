import { User } from '@supabase/supabase-js';
import { getSupabaseClient, isPlaceholderKey } from '../lib/ssoAuth';
import {
  CycleChecklistStep,
  ObeRpsRecord,
  StatusSiklusValue,
  SsoUserMetadata,
  SupabaseSettings,
} from '../types/obe';

export { isPlaceholderKey };

export interface FetchRpsResult {
  records: ObeRpsRecord[];
  error: string | null;
  needsKey: boolean;
}

export function isConfiguredModuleUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('[')) {
    return false;
  }
  return /^https?:\/\/.+/i.test(trimmed);
}

export async function fetchObeRpsList(settings: SupabaseSettings): Promise<FetchRpsResult> {
  const apiKey = settings.publishableKey.trim();

  if (isPlaceholderKey(apiKey)) {
    return {
      records: [],
      error: null,
      needsKey: true,
    };
  }

  const client = getSupabaseClient(settings);
  if (!client) {
    return {
      records: [],
      error: 'URL atau Publishable Key Supabase belum valid.',
      needsKey: true,
    };
  }

  try {
    const { data, error } = await client
      .from('obe_rps')
      .select('*')
      .order('kode_mk', { ascending: true });

    if (error) {
      const msg = error.message || 'Gagal mengambil data tabel obe_rps.';
      const isAuthErr =
        msg.toLowerCase().includes('jwt') ||
        msg.toLowerCase().includes('api key') ||
        error.code === '42501';
      return {
        records: [],
        error: `Gagal memuat daftar RPS dari Supabase: ${msg}`,
        needsKey: isAuthErr,
      };
    }

    return {
      records: Array.isArray(data) ? (data as ObeRpsRecord[]) : [],
      error: null,
      needsKey: false,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Koneksi jaringan terputus.';
    return {
      records: [],
      error: `Tidak dapat terhubung ke Supabase: ${message}`,
      needsKey: false,
    };
  }
}

export function doesRpsBelongToUser(rps: ObeRpsRecord, user: User | null): boolean {
  if (!user) return false;
  const meta = (user.user_metadata || {}) as SsoUserMetadata;
  const userEmail = (user.email || '').trim().toLowerCase();
  const userNidn = (meta.nidn || '').trim().toLowerCase();
  const userFullName = (meta.full_name || '').trim().toLowerCase();

  const candidateIds = [rps.user_id, rps.dosen_id, rps.created_by, rps.owner_id];
  if (candidateIds.some((id) => typeof id === 'string' && id === user.id)) {
    return true;
  }

  const candidateEmails = [rps.email, rps.dosen_email, rps.email_dosen];
  if (
    userEmail &&
    candidateEmails.some(
      (em) => typeof em === 'string' && em.trim().toLowerCase() === userEmail
    )
  ) {
    return true;
  }

  const candidateNidns = [rps.nidn, rps.nidn_dosen];
  if (
    userNidn &&
    candidateNidns.some(
      (n) => typeof n === 'string' && n.trim().toLowerCase() === userNidn
    )
  ) {
    return true;
  }

  if (
    userFullName &&
    typeof rps.dosen_pengampu === 'string' &&
    rps.dosen_pengampu.toLowerCase().includes(userFullName)
  ) {
    return true;
  }

  return false;
}

function isTruthyFlag(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val > 0;
  if (typeof val === 'string') {
    const normalized = val.trim().toLowerCase();
    return ['true', '1', 'done', 'selesai', 'completed', 'verified', 'ada', 'sudah'].includes(
      normalized
    );
  }
  return false;
}

export function parseStatusSiklus(statusSiklus: StatusSiklusValue): CycleChecklistStep[] {
  const steps: CycleChecklistStep[] = [
    { key: 'rps', label: 'RPS', completed: true },
    { key: 'buku_ajar', label: 'Buku Ajar', completed: false },
    { key: 'rubrik', label: 'Rubrik', completed: false },
    { key: 'portofolio', label: 'Portofolio Nilai', completed: false },
    { key: 'cpl', label: 'Pengukuran CPL', completed: false },
  ];

  if (statusSiklus === null || statusSiklus === undefined || statusSiklus === '') {
    return steps;
  }

  let parsedObj: Record<string, unknown> | null = null;

  if (typeof statusSiklus === 'object' && !Array.isArray(statusSiklus)) {
    parsedObj = statusSiklus;
  } else if (typeof statusSiklus === 'string') {
    const trimmed = statusSiklus.trim();
    if (trimmed.startsWith('{')) {
      try {
        const json = JSON.parse(trimmed);
        if (json && typeof json === 'object' && !Array.isArray(json)) {
          parsedObj = json as Record<string, unknown>;
        }
      } catch {
        // Fallback to string matching below
      }
    }
  }

  if (parsedObj) {
    const getByAliases = (aliases: string[]): unknown => {
      for (const alias of aliases) {
        if (alias in parsedObj!) {
          return parsedObj![alias];
        }
      }
      return undefined;
    };

    const rpsVal = getByAliases(['rps', 'rps_done', 'has_rps', 'desain_rps']);
    const bukuVal = getByAliases(['buku_ajar', 'bukuAjar', 'buku_ajar_done', 'has_buku_ajar']);
    const rubrikVal = getByAliases(['rubrik', 'rubrik_done', 'has_rubrik', 'asesmen']);
    const portofolioVal = getByAliases([
      'portofolio',
      'portofolio_nilai',
      'nilai',
      'buku_nilai',
      'portofolio_done',
    ]);
    const cplVal = getByAliases(['cpl', 'pengukuran_cpl', 'asesmen_cpl', 'evaluasi_cpl', 'cpl_done']);

    steps[0].completed = rpsVal === undefined ? true : isTruthyFlag(rpsVal);
    steps[1].completed = isTruthyFlag(bukuVal);
    steps[2].completed = isTruthyFlag(rubrikVal);
    steps[3].completed = isTruthyFlag(portofolioVal);
    steps[4].completed = isTruthyFlag(cplVal);
    return steps;
  }

  const normalizedText = String(statusSiklus).toLowerCase();
  const numericMatch = normalizedText.match(/\d+/);
  const stageNumber = numericMatch ? parseInt(numericMatch[0], 10) : null;

  if (
    normalizedText.includes('cpl') ||
    normalizedText.includes('evaluasi') ||
    normalizedText.includes('selesai') ||
    normalizedText.includes('complete') ||
    (stageNumber !== null && stageNumber >= 5)
  ) {
    return steps.map((s) => ({ ...s, completed: true }));
  }

  if (
    normalizedText.includes('portofolio') ||
    normalizedText.includes('nilai') ||
    stageNumber === 4
  ) {
    return steps.map((s, idx) => ({ ...s, completed: idx <= 3 }));
  }

  if (
    normalizedText.includes('rubrik') ||
    normalizedText.includes('asesmen') ||
    stageNumber === 3
  ) {
    return steps.map((s, idx) => ({ ...s, completed: idx <= 2 }));
  }

  if (
    normalizedText.includes('buku') ||
    normalizedText.includes('ajar') ||
    stageNumber === 2
  ) {
    return steps.map((s, idx) => ({ ...s, completed: idx <= 1 }));
  }

  return steps;
}
