import { DEFAULT_SUPABASE_KEY_PLACEHOLDER } from '../constants/modules';
import { CycleChecklistStep, ObeRpsRecord, StatusSiklusValue, SupabaseSettings } from '../types/obe';

export interface FetchRpsResult {
  records: ObeRpsRecord[];
  error: string | null;
  needsKey: boolean;
}

export function isPlaceholderKey(key: string): boolean {
  const trimmed = key.trim();
  return !trimmed || trimmed === DEFAULT_SUPABASE_KEY_PLACEHOLDER || trimmed.startsWith('[');
}

export function isConfiguredModuleUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('[')) {
    return false;
  }
  return /^https?:\/\/.+/i.test(trimmed);
}

export function buildModuleLaunchUrl(rawUrl: string, activeRpsId: string): string {
  const trimmed = rawUrl.trim();
  if (!isConfiguredModuleUrl(trimmed)) {
    return '';
  }
  if (!activeRpsId) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    parsed.searchParams.set('rps_id', activeRpsId);
    return parsed.toString();
  } catch {
    const separator = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${separator}rps_id=${encodeURIComponent(activeRpsId)}`;
  }
}

export async function fetchObeRpsList(settings: SupabaseSettings): Promise<FetchRpsResult> {
  const baseUrl = settings.url.trim().replace(/\/+$/, '');
  const apiKey = settings.publishableKey.trim();

  if (isPlaceholderKey(apiKey)) {
    return {
      records: [],
      error: null,
      needsKey: true,
    };
  }

  if (!baseUrl) {
    return {
      records: [],
      error: 'URL Supabase belum diisi.',
      needsKey: false,
    };
  }

  try {
    const endpoint = `${baseUrl}/rest/v1/obe_rps?select=id,kode_mk,nama_mk,prodi,status_siklus&order=kode_mk.asc`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let detail = '';
      try {
        const errJson = await response.json();
        detail = errJson?.message || errJson?.hint || '';
      } catch {
        detail = response.statusText;
      }
      return {
        records: [],
        error: `Gagal memuat daftar RPS dari Supabase (HTTP ${response.status}${detail ? `: ${detail}` : ''}).`,
        needsKey: response.status === 401 || response.status === 403,
      };
    }

    const data = (await response.json()) as ObeRpsRecord[];
    return {
      records: Array.isArray(data) ? data : [],
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
