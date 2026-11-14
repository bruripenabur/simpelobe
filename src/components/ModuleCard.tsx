import { Session } from '@supabase/supabase-js';
import {
  Award,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileText,
  FolderArchive,
  Layers,
  Pencil,
} from 'lucide-react';
import { buildSsoModuleUrl } from '../lib/ssoAuth';
import { isConfiguredModuleUrl } from '../services/supabaseClient';
import { ModuleId, ObeModuleDefinition } from '../types/obe';

interface ModuleCardProps {
  module: ObeModuleDefinition;
  configuredUrl: string;
  activeRpsId: string;
  session: Session | null;
  onEditUrl: (moduleId: ModuleId) => void;
}

const MODULE_ICONS: Record<ModuleId, typeof Layers> = {
  'modul-0': Layers,
  'modul-1': FileText,
  'modul-2': BookOpen,
  'modul-3': ClipboardCheck,
  'modul-4': FolderArchive,
  'modul-5': BarChart3,
  'modul-6': Award,
};

export function ModuleCard({
  module,
  configuredUrl,
  activeRpsId,
  session,
  onEditUrl,
}: ModuleCardProps) {
  const Icon = MODULE_ICONS[module.id];
  const isUrlReady = isConfiguredModuleUrl(configuredUrl);
  const launchUrl = buildSsoModuleUrl(configuredUrl, activeRpsId, session);
  const hasSsoHash = launchUrl.includes('#sso_token=');

  return (
    <article
      className={`relative bg-white/95 backdrop-blur-md border border-white/60 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xl hover:-translate-y-1 transition-all duration-300 ${
        module.isFoundation ? 'md:col-span-2 lg:col-span-3' : ''
      }`}
    >
      {/* Tombol kecil di pojok kartu bagi Admin LPMPP untuk edit URL */}
      <button
        type="button"
        onClick={() => onEditUrl(module.id)}
        title={`Atur URL ${module.code} (Admin LPMPP)`}
        aria-label={`Atur URL ${module.code}`}
        className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-[#0b3d91] hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0b3d91]"
      >
        <Pencil className="w-4 h-4" />
      </button>

      <div>
        <div
          className={`flex ${
            module.isFoundation
              ? 'flex-col sm:flex-row sm:items-center gap-4'
              : 'flex-col items-start gap-4'
          } pr-8`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${module.iconBoxStyle}`}
          >
            <Icon className="w-6 h-6" />
          </div>

          <div className="min-w-0">
            <span
              className={`inline-block text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md mb-2 ${module.badgeStyle}`}
            >
              {module.stageBadge}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {module.code}: {module.title}
            </h2>
          </div>
        </div>

        <p
          className={`mt-3 text-sm text-slate-600 leading-relaxed ${
            module.isFoundation ? 'max-w-4xl' : ''
          }`}
        >
          {module.description}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {isUrlReady ? (
          <a
            href={launchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#0b3d91] hover:bg-blue-900 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#0b3d91] focus:ring-offset-2 whitespace-nowrap"
          >
            <span>{module.buttonLabel}</span>
          </a>
        ) : (
          <button
            type="button"
            onClick={() => onEditUrl(module.id)}
            className="inline-flex items-center justify-center gap-2 bg-[#0b3d91] hover:bg-blue-900 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#0b3d91] focus:ring-offset-2 whitespace-nowrap"
          >
            <span>{module.buttonLabel}</span>
          </button>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
          {isUrlReady ? (
            <span className="truncate font-mono text-[11px]" title={configuredUrl}>
              {activeRpsId
                ? `?rps_id=${activeRpsId.slice(0, 8)}…${hasSsoHash ? ' + SSO' : ''}`
                : hasSsoHash
                  ? `${configuredUrl.replace(/^https?:\/\//, '')} · SSO aktif`
                  : configuredUrl}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onEditUrl(module.id)}
              className="text-amber-700 hover:text-amber-800 font-medium underline underline-offset-2 text-left"
            >
              URL belum diatur ({configuredUrl})
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
