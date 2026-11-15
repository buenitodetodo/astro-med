import { useState } from 'react';
import type { Estado, Me } from '../lib/astro-med';
import { Icono, estilo_color } from './parts';

const tonos = [
  'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'bg-sky-500/10 text-sky-300 border-sky-500/20',
];

type Props = {
  me: Me | null;
  crew_id: string;
  elegir_tripulante: (id: string) => void;
  estados: Record<string, Estado | null>;
  pagina: 'summary' | 'assistant' | 'history';
  activar_sos: () => void;
};

export default function Sidebar({ me, crew_id, elegir_tripulante, estados, pagina, activar_sos }: Props) {
  const [abierto, setAbierto] = useState(false);
  const tripulacion = me?.demoCrew ?? [];
  const mision = me?.mission;
  const progreso = mision?.durationDays ? (mision.day / mision.durationDays) * 100 : null;
  const navegacion = [
    { href: '/', icono: 'dashboard', texto: 'Summary', activo: pagina === 'summary', disponible: true },
    { href: '/#biometrics', icono: 'ecg_heart', texto: 'Biometrics', activo: false, disponible: true },
    { href: '/history', icono: 'clinical_notes', texto: 'History', activo: pagina === 'history', disponible: true },
  ];

  return (
    <>
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 bg-[#0B1B3A] text-white flex items-center gap-3 px-3 shadow-lg">
        <button type="button" onClick={() => setAbierto(true)} aria-label="Open menu" aria-expanded={abierto} className="w-10 h-10 rounded-lg hover:bg-slate-800 flex items-center justify-center">
          <Icono nombre="menu" className="text-[24px]" />
        </button>
        <span className="font-display-lg text-lg font-bold tracking-tight flex-1">AstroMed</span>
        <button type="button" onClick={activar_sos} className="h-10 px-3 rounded-lg bg-[#F0566A] hover:bg-[#e14559] text-sm font-bold flex items-center gap-1.5">
          <Icono nombre="emergency" className="text-[20px]" /> SOS
        </button>
      </header>
      {abierto && <div className="lg:hidden fixed inset-0 z-30 bg-slate-950/60" onClick={() => setAbierto(false)} aria-hidden="true" />}
    <aside className={`fixed top-0 left-0 h-screen w-[290px] max-w-[88vw] z-40 bg-[#0B1B3A] border-r border-slate-800 text-slate-300 flex flex-col justify-between shadow-xl transition-transform duration-200 lg:translate-x-0 ${abierto ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex flex-col flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800/80">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-900 to-slate-900 border border-primary-container/40 shadow-inner">
            <svg className="w-6 h-6 text-primary-container" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <ellipse cx="12" cy="12" rx="9" ry="3.5" strokeOpacity="0.8" strokeWidth="1.5" transform="rotate(30 12 12)" />
              <ellipse cx="12" cy="12" rx="9" ry="3.5" strokeOpacity="0.8" strokeWidth="1.5" transform="rotate(-30 12 12)" />
              <circle cx="12" cy="12" fill="#2DD4BF" r="2.2" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display-lg text-lg font-bold tracking-tight text-white">AstroMed</span>
              {mision && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-label-caps bg-primary-container/20 text-primary-fixed border border-primary-container/30 uppercase">
                  {mision.name}
                </span>
              )}
            </div>
            <div className="text-[10px] font-label-caps tracking-widest text-primary-fixed-dim font-semibold">HEALTH SYSTEM</div>
          </div>
        </div>

        <nav className="space-y-2" aria-label="System navigation">
          <div className="text-[10px] font-label-caps font-bold tracking-widest text-slate-400 mb-2 uppercase">SYSTEM NAVIGATION</div>
          {navegacion.map((item) =>
            item.activo ? (
              <a key={item.texto} href={item.href} aria-current="page" className="flex items-center gap-3 px-3.5 py-2.5 bg-primary-container/15 text-primary-container border-l-[3px] border-primary-container font-semibold rounded-r-lg">
                <Icono nombre={item.icono} className="text-[20px]" />
                <span className="text-sm font-medium tracking-wide">{item.texto}</span>
              </a>
            ) : item.disponible ? (
              <a key={item.texto} href={item.href} onClick={() => setAbierto(false)} className="flex items-center gap-3 px-3.5 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-r-lg transition-colors group">
                <Icono nombre={item.icono} className="text-[20px] text-slate-400 group-hover:text-primary-container transition-colors" />
                <span className="text-sm font-medium tracking-wide">{item.texto}</span>
              </a>
            ) : (
              <span key={item.texto} title="Not designed yet" className="flex items-center gap-3 px-3.5 py-2.5 text-slate-500 rounded-r-lg cursor-not-allowed">
                <Icono nombre={item.icono} className="text-[20px]" />
                <span className="text-sm font-medium tracking-wide">{item.texto}</span>
                <span className="ml-auto text-[9px] font-label-caps text-slate-500 border border-slate-700 rounded px-1.5">SOON</span>
              </span>
            ),
          )}

          {pagina === 'assistant' ? (
            <div className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/40 text-left opacity-60">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                <Icono nombre="auto_awesome" className="text-[22px]" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold text-slate-300">Talk to ASTRO AI</div>
                <div className="text-[10px] text-slate-500 font-medium">Your health assistant, 24/7</div>
              </div>
            </div>
          ) : (
            <a href="/assistant" className="w-full relative flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#2dd4bf] to-[#4f7cf0] text-white border border-teal-300/50 ai-btn-glow hover:brightness-110 active:scale-[0.98] transition-all text-left shadow-lg">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shrink-0 shadow-inner">
                <Icono nombre="auto_awesome" className="text-[22px]" />
              </div>
              <div className="leading-tight flex-1 pr-3">
                <div className="text-sm font-bold text-white tracking-tight">Talk to ASTRO AI</div>
                <div className="text-[10px] text-white/80 font-medium">Your health assistant, 24/7</div>
              </div>
              <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
                <span className="pulse-beacon absolute inline-flex h-full w-full rounded-full bg-white opacity-90" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white shadow-sm" />
              </span>
            </a>
          )}

          <button
            type="button"
            onClick={() => {
              setAbierto(false);
              activar_sos();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#F0566A] hover:bg-[#e14559] text-white border border-rose-300/50 sos-glow active:scale-[0.98] transition-all text-left shadow-lg"
          >
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Icono nombre="emergency" className="text-[22px]" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight">SOS · Emergency</div>
              <div className="text-[10px] text-white/85 font-medium">First-aid card + AI doctor</div>
            </div>
          </button>
        </nav>

        <div className="pt-1">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-label-caps font-bold tracking-widest text-slate-400 uppercase">CREW COMPLEMENT ({tripulacion.length})</span>
            <span className="text-[9px] font-label-caps text-slate-500" title="Number of active watcher alerts">ALERTS</span>
          </div>
          <div className="space-y-1.5">
            {tripulacion.map((miembro, indice) => {
              const estado = estados[miembro.id];
              const activo = miembro.id === crew_id;
              const color = estado?.color_general ?? 'sin_datos';
              return (
                <button
                  key={miembro.id}
                  type="button"
                  onClick={() => {
                    setAbierto(false);
                    elegir_tripulante(miembro.id);
                  }}
                  aria-pressed={activo}
                  className={`w-full flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all text-left ${
                    activo ? 'bg-slate-800/90 border-primary-container/40' : 'bg-slate-900/40 border-transparent hover:bg-slate-800/60 hover:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg font-label-caps font-bold text-xs flex items-center justify-center border ${tonos[indice % tonos.length]}`}>
                      {miembro.callsign}
                    </div>
                    <div className="leading-tight">
                      <div className={`text-xs font-semibold ${activo ? 'text-white' : 'text-slate-200'}`}>{miembro.name ?? miembro.callsign}</div>
                      <div className="text-[10px] text-slate-400 truncate w-28">{miembro.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5" title={estado ? `${estado.total_alertas} active alerts` : 'No status yet'}>
                    <span className={`text-[11px] font-telemetry-md font-bold ${color === 'verde' ? 'text-teal-400' : color === 'amarillo' ? 'text-amber-400' : color === 'rojo' ? 'text-rose-400' : 'text-slate-400'}`}>
                      {estado ? estado.total_alertas : '–'}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${estilo_color[color].punto}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="p-3.5 rounded-xl bg-gradient-to-b from-slate-900/90 to-[#0c1830] border border-cyan-500/20 shadow-inner">
          <div className="flex items-center justify-between text-[11px] font-label-caps font-bold text-slate-400 mb-1.5">
            <span>CURRENT MISSION</span>
            <span className="text-primary-container font-telemetry-md">{mision?.name ?? '—'}</span>
          </div>
          <div className="text-xs text-slate-200 font-semibold mb-2">{mision?.phase ?? 'Loading…'}</div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mb-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-primary-container to-cyan-400 h-1.5 rounded-full" style={{ width: `${progreso ?? 0}%` }} />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-label-sm">
            <span>{mision ? `Day ${mision.day}${mision.durationDays ? ` of ${mision.durationDays}` : ''}` : ''}</span>
            <span className="text-primary-fixed font-bold">{progreso !== null ? `${progreso.toFixed(1)}%` : ''}</span>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
