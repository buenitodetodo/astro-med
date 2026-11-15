import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { describeError } from '../lib/astro-med';
import CasosIA, { useCasosIA } from './AiChecks';
import { Icono } from './parts';
import { sondear } from '../lib/polling';
import { EstadoTransmision, TextoReporte, type Reporte } from './EarthReport';
import Cargando from './Loading';

type Cola = { enlace: { retraso_minutos: number; aceleracion: number; simulado: boolean }; pendientes: number; reportes: Reporte[] };

const etiquetas = {
  en_camino: 'bg-amber-50 text-amber-700 border-amber-200',
  recibido: 'bg-blue-50 text-blue-700 border-blue-200',
  respondido: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const textos = { en_camino: 'ON ITS WAY', recibido: 'RECEIVED', respondido: 'REPLIED' };

export default function Historial({ crew_id }: { crew_id: string }) {
  const [cola, setCola] = useState<Cola | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const { casos, error: error_casos } = useCasosIA(crew_id);

  useEffect(() => {
    let vigente = true;
    let en_transito = false;
    setCola(null);
    const cargar = async () => {
      try {
        const actual = await api<Cola>('/v1/queue', { crewId: crew_id });
        if (vigente) {
          en_transito = actual.reportes.some((reporte) => reporte.transmision && reporte.transmision.estado !== 'respondido');
          setCola(actual);
          setError(null);
        }
      } catch (e) {
        if (vigente) setError(describeError(e));
      }
    };
    void cargar();
    const parar = sondear(() => void cargar(), () => (en_transito ? 3000 : 20_000));
    return () => {
      vigente = false;
      parar();
    };
  }, [crew_id]);

  return (
    <main className="lg:ml-[290px] min-h-screen bg-[#F4F7FB] px-4 pb-6 pt-[4.5rem] lg:p-8 space-y-7">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="text-[11px] font-label-caps font-bold tracking-widest text-slate-400 uppercase">EARTH LINK</div>
          <h1 className="text-3xl font-display-lg font-bold text-slate-800 tracking-tight mt-0.5">History</h1>
          <p className="text-slate-500 text-sm mt-0.5">AI doctor checks, and the reports the crew approved and sent to the flight surgeon on Earth.</p>
        </div>
        {cola && (
          <div className="flex items-center gap-4 bg-white py-3 px-5 rounded-2xl border border-slate-200/70 shadow-sm">
            <Icono nombre="satellite_alt" className="text-[28px] text-[#0B1B3A]" />
            <div className="space-y-0.5">
              <div className="text-[10px] font-label-caps font-bold tracking-widest text-slate-400">SIMULATED LINK</div>
              <div className="text-sm font-semibold text-slate-700">
                {cola.enlace.retraso_minutos} min one way{cola.enlace.aceleracion > 1 ? ` · shown ${cola.enlace.aceleracion}× faster` : ''}
              </div>
              <div className="text-[11px] text-slate-500">{cola.pendientes} awaiting a reply</div>
            </div>
          </div>
        )}
      </header>

      <CasosIA crew_id={crew_id} casos={casos} error={error_casos} />

      <h2 className="text-lg font-display-lg font-bold text-slate-800">Earth link</h2>
      {error && <div className="p-4 rounded-card bg-white border border-rose-200 text-sm text-rose-700">{error}</div>}
      {!cola && !error && <Cargando texto="Connecting to the Earth link" />}
      {cola && cola.reportes.length === 0 && (
        <div className="p-8 rounded-card bg-white border border-slate-200/70 text-center text-sm text-slate-500">
          No reports sent yet. Prepare one from an AI doctor check above.
        </div>
      )}

      <div className="space-y-3">
        {cola?.reportes.map((reporte) => {
          const estado = reporte.transmision?.estado ?? 'en_camino';
          const expandido = abierto === reporte.id;
          return (
            <article key={reporte.id} className="bg-white rounded-card border border-slate-200/70 p-5 shadow-sm">
              <button type="button" onClick={() => setAbierto(expandido ? null : reporte.id)} className="w-full flex items-center gap-3 text-left">
                <span className={`text-[10px] font-label-caps font-bold px-2 py-0.5 rounded border ${etiquetas[estado]}`}>{textos[estado]}</span>
                <span className="text-sm font-semibold text-slate-800 flex-1">{reporte.titulo}</span>
                <span className="text-[11px] font-label-sm text-slate-400">
                  {reporte.aprobado_en ? `${reporte.aprobado_en.slice(0, 10)} ${reporte.aprobado_en.slice(11, 16)} UTC` : ''} · by {reporte.aprobado_por ?? 'crew'}
                </span>
                <Icono nombre={expandido ? 'expand_less' : 'expand_more'} className="text-[20px] text-slate-400" />
              </button>
              {expandido && (
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <TextoReporte reporte={reporte} />
                  <EstadoTransmision reporte={reporte} />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
