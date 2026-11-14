import { createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import {
  DEFAULT_SUPABASE_KEY_PLACEHOLDER,
  DEFAULT_SUPABASE_SETTINGS,
  SSO_COOKIE_MAX_AGE,
  SSO_COOKIE_NAME,
  SSO_ROOT_DOMAIN,
  STORAGE_KEYS,
} from '../constants/modules';
import {
  SsoRole,
  SsoTokenPayload,
  SsoUserMetadata,
  SupabaseSettings,
} from '../types/obe';

let cachedClientKey = '';
let cachedClient: SupabaseClient | null = null;

export function isPlaceholderKey(key: string): boolean {
  const trimmed = key.trim();
  return !trimmed || trimmed === DEFAULT_SUPABASE_KEY_PLACEHOLDER || trimmed.startsWith('[');
}

export function getSupabaseClient(
  settings: SupabaseSettings = DEFAULT_SUPABASE_SETTINGS
): SupabaseClient | null {
  const url = settings.url.trim().replace(/\/+$/, '');
  const key = settings.publishableKey.trim();

  if (!url || isPlaceholderKey(key)) {
    return null;
  }

  const cacheSignature = `${url}::${key}`;
  if (cachedClient && cachedClientKey === cacheSignature) {
    return cachedClient;
  }

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  cachedClientKey = cacheSignature;
  return cachedClient;
}

export function isSimpattiHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized === 'simpatti.site' || normalized.endsWith('.simpatti.site');
}

export function saveSsoSession(session: Session | null): void {
  if (!session?.access_token || !session?.refresh_token) {
    clearSsoSession();
    return;
  }

  const payload: SsoTokenPayload = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  };
  const encoded = encodeURIComponent(JSON.stringify(payload));

  // Simpan ke cookie tingkat root domain .simpatti.site
  document.cookie = `${SSO_COOKIE_NAME}=${encoded}; domain=${SSO_ROOT_DOMAIN}; path=/; max-age=${SSO_COOKIE_MAX_AGE}; SameSite=Lax; Secure`;

  // Cadangan untuk pengujian di localhost / .netlify.app / domain non-.simpatti.site
  try {
    localStorage.setItem(STORAGE_KEYS.SSO_SESSION_FALLBACK, JSON.stringify(payload));
  } catch {
    // Abaikan error kuota penyimpanan
  }
}

export function clearSsoSession(): void {
  // Hapus cookie simpatti_sso_session dari root domain .simpatti.site
  document.cookie = `${SSO_COOKIE_NAME}=; domain=${SSO_ROOT_DOMAIN}; path=/; max-age=0; SameSite=Lax; Secure`;
  // Bersihkan juga cookie host-level jika ada
  document.cookie = `${SSO_COOKIE_NAME}=; path=/; max-age=0`;

  try {
    localStorage.removeItem(STORAGE_KEYS.SSO_SESSION_FALLBACK);
  } catch {
    // Abaikan error penyimpanan
  }
}

export function readStoredSsoSession(): SsoTokenPayload | null {
  // 1. Cek hash #sso_token=... jika dibuka dari lintas domain
  try {
    if (typeof window !== 'undefined' && window.location.hash.includes('sso_token=')) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const rawToken = hashParams.get('sso_token');
      if (rawToken) {
        const parsed = JSON.parse(decodeURIComponent(rawToken)) as Partial<SsoTokenPayload>;
        if (parsed.access_token && parsed.refresh_token) {
          return {
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token,
          };
        }
      }
    }
  } catch {
    // Abaikan hash yang tidak valid
  }

  // 2. Cek cookie simpatti_sso_session
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [rawName, ...rest] = cookie.trim().split('=');
      if (rawName === SSO_COOKIE_NAME && rest.length > 0) {
        const parsed = JSON.parse(decodeURIComponent(rest.join('='))) as Partial<SsoTokenPayload>;
        if (parsed.access_token && parsed.refresh_token) {
          return {
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token,
          };
        }
      }
    }
  } catch {
    // Abaikan cookie yang korup
  }

  // 3. Cek fallback localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SSO_SESSION_FALLBACK);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SsoTokenPayload>;
      if (parsed.access_token && parsed.refresh_token) {
        return {
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
        };
      }
    }
  } catch {
    // Abaikan fallback yang tidak valid
  }

  return null;
}

export async function signInWithSso(
  client: SupabaseClient,
  email: string,
  password: string
) {
  const result = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (result.data.session) {
    saveSsoSession(result.data.session);
  }
  return result;
}

export interface RegisterSsoPayload {
  fullName: string;
  nidn: string;
  prodi: string;
  role: SsoRole;
  email: string;
  password: string;
}

export async function signUpDosenOrKps(
  client: SupabaseClient,
  payload: RegisterSsoPayload
) {
  const result = await client.auth.signUp({
    email: payload.email.trim(),
    password: payload.password,
    options: {
      data: {
        full_name: payload.fullName.trim(),
        nidn: payload.nidn.trim(),
        prodi: payload.prodi.trim(),
        role: payload.role,
        peran: payload.role,
      },
    },
  });

  if (result.data.session) {
    saveSsoSession(result.data.session);
  }
  return result;
}

export async function signOutSso(client: SupabaseClient | null): Promise<void> {
  clearSsoSession();
  if (client) {
    await client.auth.signOut();
  }
}

export function extractUserProfile(user: User | null): {
  fullName: string;
  nidn: string;
  prodi: string;
  role: string;
  email: string;
} {
  if (!user) {
    return {
      fullName: '',
      nidn: '',
      prodi: '',
      role: 'Dosen Pengampu',
      email: '',
    };
  }
  const meta = (user.user_metadata || {}) as SsoUserMetadata;
  return {
    fullName: meta.full_name || user.email || 'Pengguna SIMPEL-OBE',
    nidn: meta.nidn || '',
    prodi: meta.prodi || 'Universitas Pattimura',
    role: meta.role || meta.peran || 'Dosen Pengampu',
    email: user.email || '',
  };
}

export function buildSsoModuleUrl(
  rawUrl: string,
  activeRpsId: string,
  session: Session | null
): string {
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('[') || !/^https?:\/\/.+/i.test(trimmed)) {
    return '';
  }

  try {
    const targetUrl = new URL(trimmed);
    if (activeRpsId) {
      targetUrl.searchParams.set('rps_id', activeRpsId);
    }

    const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
    const accessedFromNonSimpatti = !isSimpattiHostname(currentHost);
    const targetIsNonSimpatti = !isSimpattiHostname(targetUrl.hostname);

    if ((accessedFromNonSimpatti || targetIsNonSimpatti) && session?.access_token && session?.refresh_token) {
      const ssoTokenPayload: SsoTokenPayload = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      };
      const encodedToken = encodeURIComponent(JSON.stringify(ssoTokenPayload));
      targetUrl.hash = `sso_token=${encodedToken}`;
    }

    return targetUrl.toString();
  } catch {
    return trimmed;
  }
}
