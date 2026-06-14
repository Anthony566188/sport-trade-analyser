import React, { useState } from 'react';
import { Zap, ShieldCheck } from 'lucide-react';
import { TeamSearchInput } from '../components/team/TeamSearchInput';
import { TeamAvatar } from '../components/ui/TeamAvatar';
import type { Team } from '../types';

/**
 * Página de demonstração do componente TeamSearchInput.
 *
 * Mostra dois cenários:
 * 1. Busca em campeonato específico (ex: ID 1 = Premier League)
 * 2. Busca global / modo amistoso
 */
export const TeamSearchDemo: React.FC = () => {
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-pitch-600 dark:text-pitch-400">
          <Zap className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">
            Componente de Busca
          </span>
        </div>
        <h1 className="text-2xl font-bold text-turf-900 dark:text-turf-100">
          Seleção de Times
        </h1>
        <p className="text-sm text-turf-500 dark:text-turf-400">
          Busca inteligente com debounce de 500ms. Os resultados são atualizados
          automaticamente enquanto você digita.
        </p>
      </div>

      {/* Demo: busca em campeonato */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-turf-400" />
          <h2 className="text-sm font-semibold text-turf-600 dark:text-turf-300 uppercase tracking-wide">
            Campeonato específico (ID: 1)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Time Mandante */}
          <TeamSearchInput
            championshipId={1}
            label="Time Mandante"
            placeholder="Ex: Barcelona..."
            selectedTeam={homeTeam}
            onSelect={setHomeTeam}
          />

          {/* Time Visitante */}
          <TeamSearchInput
            championshipId={1}
            label="Time Visitante"
            placeholder="Ex: Real Madrid..."
            selectedTeam={awayTeam}
            onSelect={setAwayTeam}
          />
        </div>

        {/* Preview do confronto */}
        {(homeTeam || awayTeam) && (
          <div className="animate-fade-in mt-2 p-4 rounded-xl border bg-turf-50 dark:bg-turf-800/60 border-turf-200 dark:border-turf-700">
            <p className="text-xs text-turf-400 dark:text-turf-500 mb-3 uppercase tracking-wide font-medium">
              Prévia do Confronto
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1.5">
                <TeamAvatar
                  name={homeTeam?.name ?? '?'}
                  logo={homeTeam?.logo}
                  size="lg"
                />
                <span className="text-xs font-medium text-turf-700 dark:text-turf-200 max-w-[80px] text-center truncate">
                  {homeTeam?.name ?? '—'}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <span className="font-mono font-bold text-xl text-turf-900 dark:text-turf-100">
                  0 : 0
                </span>
                <span className="text-[10px] text-turf-400 uppercase tracking-widest">
                  vs
                </span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <TeamAvatar
                  name={awayTeam?.name ?? '?'}
                  logo={awayTeam?.logo}
                  size="lg"
                />
                <span className="text-xs font-medium text-turf-700 dark:text-turf-200 max-w-[80px] text-center truncate">
                  {awayTeam?.name ?? '—'}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="pitch-divider" />

      {/* Demo: busca global (amistoso) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-turf-400" />
          <h2 className="text-sm font-semibold text-turf-600 dark:text-turf-300 uppercase tracking-wide">
            Busca Global (Amistoso)
          </h2>
        </div>

        <p className="text-xs text-turf-400 dark:text-turf-500">
          Sem filtro de campeonato — retorna todos os times disponíveis.
        </p>

        <TeamSearchInput
          label="Time (qualquer)"
          placeholder="Busque qualquer time..."
          onSelect={(t) => console.log('Selecionado:', t)}
        />
      </section>

      {/* Info técnica */}
      <div className="rounded-xl border border-dashed border-turf-300 dark:border-turf-700 p-4 space-y-2">
        <p className="text-xs font-semibold text-turf-500 dark:text-turf-400 uppercase tracking-wide">
          Detalhes Técnicos
        </p>
        <ul className="space-y-1 text-xs text-turf-400 dark:text-turf-500 list-disc list-inside">
          <li>
            <code className="font-mono text-pitch-600 dark:text-pitch-400">useDebounce(500ms)</code>
            {' '}— previne chamadas excessivas ao backend
          </li>
          <li>
            <code className="font-mono text-pitch-600 dark:text-pitch-400">GET /championships/{'{id}'}/teams/search?query=…</code>
            {' '}— endpoint de busca
          </li>
          <li>
            "Ver todos os times" envia query vazia ao endpoint → retorna todos
          </li>
          <li>Highlight visual da parte digitada nos resultados</li>
          <li>Avatar gerado por cor determinística se logo ausente</li>
        </ul>
      </div>
    </div>
  );
};
