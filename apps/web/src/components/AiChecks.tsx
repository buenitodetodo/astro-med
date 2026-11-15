import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { describeError } from '../lib/astro-med';
import { Icono } from './parts';
import ReporteTierra from './EarthReport';
import { sondear } from '../lib/polling';
import Cargando from './Loading';

export type CasoIA = {
  id: string;
  tipo: 'preventivo' | 'emergencia';
  emergencia_id: string | null;
  descripcion: string | null;
  sintomas: string[];
  estado: 'en_proceso' | 'listo' | 'error';
  progreso: { rondas_hechas: number; rondas_totales: number };
  error: string | null;
  creado_en: string;
  reporte_id: string | null;
  resultado: null | {
    condicion: string;
    en_catalogo: boolean;
    segunda_opcion: string | null;
    nivel: 'alta' | 'media' | 'dudosa';
    urgencia: number;
    escalar_tierra: boolean;
    motivos_escalar: string[];
    propuesta_ia: { etiqueta: string; acciones: string[]; que_no_hacer: string[]; razon: string };
  };
};

const nombres_nivel = { alta: 'High confidence', media: 'Medium confidence', dudosa: 'Doubtful: Earth decides' };

const tipos = {
  preventivo: { texto: 'PREVENTIVE CHECK', clase: 'bg-teal-50 text-teal-700 border-teal-200', icono: 'health_and_safety', detalle: 'Requested automatically after the watcher alerts' },
  emergencia: { texto: 'EMERGENCY CASE', clase: 'bg-rose-50 text-rose-700 border-rose-200', icono: 'emergency', detalle: 'Started from a confirmed emergency' },
};

const cuando = (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;

export function useCasosIA(crew_id: string) {
  const [casos, setCasos] = useState<CasoIA[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    let votando = false;
    setCasos(null);
    const cargar = async () => {
      try {
        const respuesta = await api<{ casos: CasoIA[] }>('/v1/doctor/cases', { crewId: crew_id });
        if (vigente) {
          votando = respuesta.casos.some((caso) => caso.estado === 'en_proceso');
          setCasos(respuesta.casos);
          setError(null);
        }
      } catch (e) {
        if (vigente) setError(describeError(e));
      }
    };
    void cargar();
    const parar = sondear(() => void cargar(), () => (votando ? 4000 : 20_000));
    return () => {
      vigente = false;
      parar();
    };
  }, [crew_id]);

  return { casos, error };
}

function Resultado({ caso }: { caso: CasoIA }) {
  if (caso.estado === 'en_proceso') {
    return (
      <div className="text-sm text-slate-600">
        The AI doctor is voting… {caso.progreso.rondas_hechas}/{caso.progreso.rondas_totales} rounds
      </div>
    );
  }
  if (caso.estado === 'error' || !caso.resultado) return <div className="text-sm text-rose-600">The AI doctor could not complete this check. (Code AI-02)</div>;
  const r = caso.resultado;
  return (
    <div className="space-y-1">
      <div className="text-base font-bold text-slate-800">{r.condicion}</div>
      <div className="text-[11px] font-label-sm text-slate-500">
        {nombres_nivel[r.nivel]} · urgency {r.urgencia}/3{r.segunda_opcion ? ` · 2nd option: ${r.segunda_opcion}` : ''}
      </div>
    </div>
  );
}

export function AvisoIA({ casos, al_abrir }: { casos: CasoIA[] | null; al_abrir: (id: string) => void }) {
  const reciente = casos?.find((caso) => Date.now() - Date.parse(caso.creado_en) < 7 * 86_400_000);
  if (!reciente) return null;
  const tipo = tipos[reciente.tipo];
  return (
    <section className="bg-white rounded-card border border-teal-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-4" aria-label="AI doctor notice">
      <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 grid place-items-center shrink-0">
        <Icono nombre={tipo.icono} className="text-[24px]" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[10px] font-label-caps font-bold px-2 py-0.5 rounded border ${tipo.clase}`}>{tipo.texto}</span>
          <span className="text-[11px] text-slate-400">{tipo.detalle} · {cuando(reciente.creado_en)}</span>
        </div>
        <Resultado caso={reciente} />
        {reciente.resultado?.escalar_tierra && (
          <div className="text-xs text-amber-700 flex items-center gap-1">
            <Icono nombre="satellite_alt" className="text-[16px]" /> The flight surgeon on Earth must confirm it.
          </div>
        )}
      </div>
      <button type="button" onClick={() => al_abrir(reciente.id)} className="px-4 py-2 rounded-lg bg-[#0B1B3A] hover:bg-[#13285a] text-white text-sm font-semibold flex items-center gap-2 self-start md:self-center">
        <Icono nombre="clinical_notes" className="text-[18px]" />
        {reciente.reporte_id ? 'See case' : 'Review & report'}
      </button>
    </section>
  );
}

export default function CasosIA({ crew_id, casos, error }: { crew_id: string; casos: CasoIA[] | null; error: string | null }) {
  const [abierto, setAbierto] = useState<string | null>(() => (typeof location !== 'undefined' ? new URLSearchParams(location.search).get('caso') : null));

  return (
    <section className="space-y-3" aria-labelledby="titulo-casos-ia">
      <div>
        <h2 id="titulo-casos-ia" className="text-lg font-display-lg font-bold text-slate-800">AI doctor checks</h2>
        <p className="text-slate-500 text-sm">Preventive checks requested by the health monitor, and emergency cases. Two AI models review each case on their own; the flight surgeon on Earth has the final word.</p>
      </div>
      {error && <div className="p-4 rounded-card bg-white border border-rose-200 text-sm text-rose-700">{error}</div>}
      {!casos && !error && <Cargando texto="Loading AI checks" />}
      {casos && casos.length === 0 && (
        <div className="p-6 rounded-card bg-white border border-slate-200/70 text-center text-sm text-slate-500">No AI doctor checks yet.</div>
      )}
      {casos?.map((caso) => {
        const tipo = tipos[caso.tipo];
        const expandido = abierto === caso.id;
        const r = caso.resultado;
        return (
          <article key={caso.id} className="bg-white rounded-card border border-slate-200/70 p-5 shadow-sm">
            <button type="button" onClick={() => setAbierto(expandido ? null : caso.id)} className="w-full flex flex-wrap items-center gap-3 text-left" aria-expanded={expandido}>
              <span className={`text-[10px] font-label-caps font-bold px-2 py-0.5 rounded border ${tipo.clase}`}>{tipo.texto}</span>
              <span className="text-sm font-semibold text-slate-800 flex-1">
                {caso.estado === 'en_proceso' ? 'Voting…' : r ? r.condicion : 'No result'}
                {r && <span className="font-normal text-slate-500"> · {nombres_nivel[r.nivel]}</span>}
              </span>
              {caso.reporte_id && <span className="text-[10px] font-label-caps font-bold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">REPORTED</span>}
              <span className="text-[11px] font-label-sm text-slate-400">{cuando(caso.creado_en)}</span>
              <Icono nombre={expandido ? 'expand_less' : 'expand_more'} className="text-[20px] text-slate-400" />
            </button>
            {expandido && (
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-3 text-sm">
                  <Resultado caso={caso} />
                  {caso.descripcion && <p className="text-slate-600">{caso.descripcion}</p>}
                  {caso.sintomas.length > 0 && <p className="text-slate-600">Symptoms logged: {caso.sintomas.join(', ')}</p>}
                  {r && (
                    <>
                      {r.propuesta_ia.razon && <p className="text-slate-600 italic">“{r.propuesta_ia.razon}”</p>}
                      {r.propuesta_ia.acciones.length > 0 && (
                        <div>
                          <div className="text-[10px] font-label-caps font-bold tracking-widest text-slate-400">{r.propuesta_ia.etiqueta.toUpperCase()}</div>
                          <ul className="list-disc pl-5 text-slate-700">
                            {r.propuesta_ia.acciones.map((accion) => (
                              <li key={accion}>{accion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {r.escalar_tierra && (
                        <p className="text-xs text-amber-700 flex gap-1">
                          <Icono nombre="satellite_alt" className="text-[16px]" />
                          {r.motivos_escalar.join(' ')}
                        </p>
                      )}
                    </>
                  )}
                </div>
                {caso.estado !== 'en_proceso' &&
                  (caso.reporte_id ? (
                    <div className="text-sm text-slate-600">A report about this case was already sent. Its status is in the Earth link list below.</div>
                  ) : (
                    <ReporteTierra crew_id={crew_id} emergencia_id={caso.emergencia_id} caso_doctor_id={caso.id} />
                  ))}
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
