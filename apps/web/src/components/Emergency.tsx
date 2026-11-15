import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { describeError } from '../lib/astro-med';
import { Icono } from './parts';
import ReporteTierra from './EarthReport';
import Cargando, { Orbita } from './Loading';

type Tarjeta = { titulo: string; estado: string; fuente: string; pasos: string[]; que_no_hacer: string[] };

export type Emergencia = {
  id: string;
  estado: 'en_verificacion' | 'cancelada' | 'confirmada';
  segundos_restantes: number;
  verificacion: { pregunta: string; segundos_para_cancelar: number };
  datos_criticos: { nombre: string | null; tipo_sangre: string | null; alergias: string[]; antecedentes: string[]; peso_kg: number | null };
  tarjeta: Tarjeta;
  caso_doctor_id: string | null;
  descripcion?: string | null;
  reportada_por?: string | null;
};

type Opcion = { nombre: string; en_catalogo: boolean; votos_razonamiento: number; votos_medico: number };

type Caso = {
  id: string;
  estado: 'en_proceso' | 'listo' | 'error';
  progreso: { rondas_hechas: number; rondas_totales: number };
  error: string | null;
  resultado: null | {
    nivel: 'alta' | 'media' | 'dudosa';
    de_acuerdo: boolean;
    escalar_tierra: boolean;
    motivos_escalar: string[];
    condicion: Opcion;
    segunda_opcion: Opcion | null;
    urgencia: number;
    tarjeta: Tarjeta | null;
    propuesta_ia: { etiqueta: string; acciones: string[]; que_no_hacer: string[]; razon: string };
    umbrales: { rondas_por_modelo: number };
  };
};

const niveles = {
  alta: { texto: 'High confidence', clase: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  media: { texto: 'Medium confidence', clase: 'bg-amber-50 text-amber-700 border-amber-200' },
  dudosa: { texto: 'Doubtful — Earth decides', clase: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const urgencias: Record<number, string> = { 1: 'Can wait for Earth', 2: 'Treat today', 3: 'Treat immediately' };

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

export default function Emergencia({ crew_id, cerrar, inicial }: { crew_id: string; cerrar: () => void; inicial?: Emergencia }) {
  const [emergencia, setEmergencia] = useState<Emergencia | null>(null);
  const [caso, setCaso] = useState<Caso | null>(null);
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '');
  const [error, setError] = useState<string | null>(null);
  const [restantes, setRestantes] = useState(20);
  const descripcion_ref = useRef('');
  descripcion_ref.current = descripcion;

  useEffect(() => {
    let vigente = true;
    const opciones = { crewId: crew_id };
    const ejecutar = async () => {
      try {
        let actual = inicial ?? (await api<Emergencia>('/v1/emergency', { ...opciones, method: 'POST', body: JSON.stringify({ origen: 'sos' }) }));
        if (!vigente) return;
        setEmergencia(actual);
        while (vigente && actual.estado === 'en_verificacion') {
          setRestantes(actual.segundos_restantes);
          await esperar(1000);
          actual = await api<Emergencia>(`/v1/emergency/${actual.id}`, opciones);
          if (vigente) setEmergencia(actual);
        }
        if (!vigente || actual.estado !== 'confirmada') return;

        let caso_actual = await api<Caso>('/v1/doctor/case', {
          ...opciones,
          method: 'POST',
          body: JSON.stringify({ emergencia_id: actual.id, descripcion: descripcion_ref.current.trim() || 'SOS button pressed; no description given.' }),
        });
        if (vigente) setCaso(caso_actual);
        while (vigente && caso_actual.estado === 'en_proceso') {
          await esperar(2000);
          caso_actual = await api<Caso>(`/v1/doctor/case/${caso_actual.id}`, opciones);
          if (vigente) setCaso(caso_actual);
        }
      } catch (e) {
        if (vigente) setError(describeError(e));
      }
    };
    void ejecutar();
    return () => {
      vigente = false;
    };
  }, [crew_id]);

  useEffect(() => {
    if (emergencia?.estado !== 'en_verificacion') return;
    const intervalo = setInterval(() => setRestantes((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(intervalo);
  }, [emergencia?.estado, emergencia?.id]);

  const cancelar = async () => {
    if (!emergencia) return;
    try {
      setEmergencia(await api<Emergencia>(`/v1/emergency/${emergencia.id}/cancel`, { crewId: crew_id, method: 'POST' }));
    } catch (e) {
      setError(describeError(e));
    }
  };

  const total = emergencia?.verificacion.segundos_para_cancelar ?? 7;
  const datos = emergencia?.datos_criticos;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-labelledby="titulo-emergencia">
      <div className="absolute inset-0 bg-[rgba(11,27,58,0.55)] backdrop-blur-[8px]" />
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-white rounded-card shadow-[0_0_24px_rgba(240,86,106,0.25)] border border-rose-200">
        <div className="flex items-center justify-between px-6 py-4 bg-[#F0566A] text-white rounded-t-card">
          <div className="flex items-center gap-3">
            <Icono nombre="emergency" className="text-[26px]" />
            <div>
              <div className="text-[10px] font-label-caps font-bold tracking-widest opacity-80">EMERGENCY PROTOCOL</div>
              <h2 id="titulo-emergencia" className="text-lg font-display-lg font-bold">
                {datos?.nombre ?? 'Crew member'} · SOS{emergencia?.reportada_por ? ` · reported via ${emergencia.reportada_por}` : ''}
              </h2>
            </div>
          </div>
          <button type="button" onClick={cerrar} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold">
            <Icono nombre="close" className="text-[16px]" />
            {emergencia?.estado === 'en_verificacion' || caso?.estado === 'en_proceso' ? 'Hide (stays active)' : 'Close'}
          </button>
        </div>

        {emergencia?.estado === 'cancelada' ? (
          <div className="flex flex-col items-center justify-center text-center gap-3 px-6 py-14">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Icono nombre="check_circle" className="text-[36px] text-emerald-600" />
            </div>
            <div className="text-xl font-display-lg font-bold text-slate-800">Emergency cancelled</div>
            <p className="text-sm text-slate-500 max-w-sm">Glad you are okay. Nothing was sent to the AI doctor or to Earth.</p>
            <button type="button" onClick={cerrar} className="mt-2 px-5 py-2.5 rounded-xl bg-[#0B1B3A] hover:bg-[#13285a] text-white text-sm font-semibold">
              Back to the app
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          <div className="lg:col-span-7 space-y-4">
            {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>}
            {!emergencia && !error && <Cargando texto="Activating emergency" />}

            {emergencia?.estado === 'en_verificacion' && (
              <div className="p-5 rounded-xl border border-rose-200 bg-rose-50/60 flex flex-col sm:flex-row items-center gap-5">
                <div className="relative w-28 h-28 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="transparent" stroke="#FFE4E6" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.5" fill="transparent" stroke="#F0566A" strokeWidth="3.2" strokeLinecap="round" strokeDasharray={`${(restantes / total) * 97.4}, 100`} className="transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-telemetry-lg font-bold text-rose-600">{restantes}</span>
                    <span className="text-[10px] font-label-caps text-rose-500">SECONDS</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <div className="text-xl font-bold text-slate-800">{emergencia.verificacion.pregunta}</div>
                  <p className="text-xs text-slate-600">If nobody cancels, the emergency is confirmed and the AI doctor starts its vote.</p>
                  <button type="button" onClick={cancelar} className="px-5 py-2.5 rounded-xl bg-white border-2 border-emerald-500 text-emerald-700 font-bold text-sm hover:bg-emerald-50">
                    I'm okay — cancel
                  </button>
                </div>
              </div>
            )}

            {emergencia && (
              <label className="block">
                <span className="text-[10px] font-label-caps font-bold text-slate-500 uppercase tracking-wider">What is happening? (optional, sent to the AI doctor)</span>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  disabled={emergencia.estado !== 'en_verificacion'}
                  rows={2}
                  className="mt-1 w-full rounded-lg border-slate-300 text-sm focus:ring-1 focus:ring-rose-400 focus:border-rose-400 disabled:bg-slate-50"
                  placeholder="e.g. Strong pain in the right flank going down to the groin"
                />
              </label>
            )}

            {emergencia?.estado === 'confirmada' && <Doctor caso={caso} />}
            {emergencia?.estado === 'confirmada' && caso && caso.estado !== 'en_proceso' && <ReporteTierra crew_id={crew_id} emergencia_id={emergencia.id} />}
          </div>

          <div className="lg:col-span-5 space-y-4">
            {datos && (
              <div className="p-4 rounded-xl bg-[#0B1B3A] text-white">
                <div className="text-[10px] font-label-caps font-bold tracking-widest text-primary-fixed-dim mb-2">CRITICAL DATA</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-[10px] text-slate-400 font-label-caps">BLOOD TYPE</div><div className="text-2xl font-telemetry-lg font-bold">{datos.tipo_sangre ?? '—'}</div></div>
                  <div><div className="text-[10px] text-slate-400 font-label-caps">WEIGHT</div><div className="text-2xl font-telemetry-lg font-bold">{datos.peso_kg ?? '—'}<span className="text-sm ml-1">kg</span></div></div>
                  <div className="col-span-2"><div className="text-[10px] text-slate-400 font-label-caps">ALLERGIES</div><div className={`font-semibold ${datos.alergias.length ? 'text-rose-300' : ''}`}>{datos.alergias.join(', ') || 'None recorded'}</div></div>
                  <div className="col-span-2"><div className="text-[10px] text-slate-400 font-label-caps">HISTORY</div><div>{datos.antecedentes.join(', ') || 'None recorded'}</div></div>
                </div>
              </div>
            )}
            {emergencia && <TarjetaPasos tarjeta={emergencia.tarjeta} />}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

function TarjetaPasos({ tarjeta }: { tarjeta: Tarjeta }) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-bold text-slate-800">{tarjeta.titulo}</div>
        {tarjeta.estado === 'provisional' && <span className="text-[9px] font-label-caps font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">GENERAL GUIDANCE</span>}
      </div>
      <ol className="space-y-1.5 list-decimal pl-5 text-sm text-slate-700">
        {tarjeta.pasos.map((paso) => <li key={paso}>{paso}</li>)}
      </ol>
      {tarjeta.que_no_hacer.length > 0 && (
        <div className="mt-3 text-xs text-rose-700"><strong>Do not:</strong> {tarjeta.que_no_hacer.join(' ')}</div>
      )}
      <div className="mt-2 text-[10px] text-slate-400">{tarjeta.fuente}</div>
    </div>
  );
}

function Doctor({ caso }: { caso: Caso | null }) {
  if (!caso || caso.estado === 'en_proceso') {
    const hechas = caso?.progreso.rondas_hechas ?? 0;
    const totales = caso?.progreso.rondas_totales ?? 20;
    return (
      <div className="p-5 rounded-xl border border-teal-200 bg-teal-50/50 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <Orbita clase="w-6 h-6" />
          AI doctor is reviewing the case…
        </div>
        <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-teal-100">
          <div className="h-2 bg-primary-container rounded-full transition-all duration-500" style={{ width: `${(hechas / totales) * 100}%` }} />
        </div>
        <div className="text-xs text-slate-600 font-label-sm">Round {hechas} of {totales} · two AI models review the case on their own</div>
      </div>
    );
  }

  if (caso.estado === 'error' || !caso.resultado) {
    return (
      <div className="p-5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 space-y-1">
        <div className="font-bold">The AI doctor is not available right now</div>
        <div className="text-sm">Follow the first-aid card and contact the flight surgeon on Earth. (Code AI-02)</div>
      </div>
    );
  }

  const r = caso.resultado;
  const total = r.umbrales.rondas_por_modelo;
  return (
    <div className="p-5 rounded-xl border border-slate-200 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-label-caps font-bold tracking-widest text-slate-400">AI DOCTOR · MOST LIKELY CONDITION</div>
          <div className="text-xl font-bold text-slate-800">{r.condicion.nombre}</div>
        </div>
        <span className={`text-xs font-label-caps font-bold px-2.5 py-1 rounded-full border ${niveles[r.nivel].clase}`}>{niveles[r.nivel].texto}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200"><div className="text-[9px] font-label-caps text-slate-400">REASONING MODEL</div><div className="font-telemetry-md font-bold">{r.condicion.votos_razonamiento}/{total}</div></div>
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200"><div className="text-[9px] font-label-caps text-slate-400">MEDICAL MODEL</div><div className="font-telemetry-md font-bold">{r.condicion.votos_medico}/{total}</div></div>
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200"><div className="text-[9px] font-label-caps text-slate-400">URGENCY</div><div className="font-bold text-sm">{urgencias[r.urgencia] ?? r.urgencia}</div></div>
      </div>
      {r.segunda_opcion && r.nivel !== 'alta' && (
        <div className="text-xs text-slate-600">Second option: <strong>{r.segunda_opcion.nombre}</strong> ({r.segunda_opcion.votos_razonamiento} + {r.segunda_opcion.votos_medico} votes)</div>
      )}
      {r.tarjeta ? <TarjetaPasos tarjeta={r.tarjeta} /> : (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
          <div className="text-[10px] font-label-caps font-bold text-amber-700">{r.propuesta_ia.etiqueta.toUpperCase()}</div>
          <ol className="list-decimal pl-5 text-sm text-slate-700 mt-1 space-y-0.5">
            {r.propuesta_ia.acciones.map((accion) => <li key={accion}>{accion}</li>)}
          </ol>
          {r.propuesta_ia.que_no_hacer.length > 0 && <div className="text-xs text-rose-700 mt-1.5"><strong>Do not:</strong> {r.propuesta_ia.que_no_hacer.join(' ')}</div>}
          <div className="text-xs text-slate-500 mt-1.5">{r.propuesta_ia.razon}</div>
        </div>
      )}
      {r.escalar_tierra && (
        <div className="p-3 rounded-lg bg-[#0B1B3A] text-white text-sm">
          <div className="font-bold flex items-center gap-2"><Icono nombre="satellite_alt" className="text-[18px]" /> Escalate to the flight surgeon on Earth</div>
          <ul className="text-xs text-slate-300 mt-1 list-disc pl-5">{r.motivos_escalar.map((motivo) => <li key={motivo}>{motivo}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
