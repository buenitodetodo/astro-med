import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { describeError } from '../lib/astro-med';
import { Icono } from './parts';

export type Transmision = {
  estado: 'en_camino' | 'recibido' | 'respondido';
  retraso_minutos: number;
  aceleracion: number;
  fuente_retraso: string;
  llega_en: string;
  respuesta_en: string;
  segundos_para_llegar: number;
  segundos_para_respuesta: number;
  respuesta: string | null;
};

export type Reporte = {
  id: string;
  estado: 'borrador' | 'aprobado';
  titulo: string;
  creado_en: string;
  aprobado_en: string | null;
  aprobado_por: string | null;
  texto: string;
  resumen_ia: { texto: string; modelo: string | null; etiqueta: string } | null;
  transmision: Transmision | null;
};

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

const reloj = (segundos: number) => `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;

export function EstadoTransmision({ reporte }: { reporte: Reporte }) {
  const t = reporte.transmision;
  if (!t || !reporte.aprobado_en) return null;
  const inicio = Date.parse(reporte.aprobado_en);
  const llegada = Date.parse(t.llega_en);
  const respuesta = Date.parse(t.respuesta_en);
  const ahora = Date.now();
  const ida = Math.min(100, Math.max(0, ((ahora - inicio) / (llegada - inicio || 1)) * 100));
  const vuelta = Math.min(100, Math.max(0, ((ahora - llegada) / (respuesta - llegada || 1)) * 100));
  const etapas = {
    en_camino: { texto: `On its way to Earth · arrives in ${reloj(t.segundos_para_llegar)}`, clase: 'text-amber-700' },
    recibido: { texto: `Received on Earth · reply in ${reloj(t.segundos_para_respuesta)}`, clase: 'text-blue-700' },
    respondido: { texto: 'Earth replied', clase: 'text-emerald-700' },
  };

  return (
    <div className="space-y-2">
      <div className={`text-sm font-semibold ${etapas[t.estado].clase}`}>{etapas[t.estado].texto}</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[9px] font-label-caps text-slate-400 mb-1">SHIP → EARTH</div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className="h-2 bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${ida}%` }} /></div>
        </div>
        <div>
          <div className="text-[9px] font-label-caps text-slate-400 mb-1">EARTH → SHIP</div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className="h-2 bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${vuelta}%` }} /></div>
        </div>
      </div>
      <div className="text-[10px] text-slate-400">
        Simulated one-way delay: {t.retraso_minutos} min{t.aceleracion > 1 ? ` (shown ${t.aceleracion}× faster)` : ''}. {t.fuente_retraso}.
      </div>
      {t.respuesta && (
        <div className="p-3 rounded-lg bg-[#0B1B3A] text-slate-100 text-xs whitespace-pre-wrap leading-relaxed">{t.respuesta}</div>
      )}
    </div>
  );
}

export function TextoReporte({ reporte }: { reporte: Reporte }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="space-y-2">
      {reporte.resumen_ia ? (
        <div className="p-3 rounded-lg bg-teal-50/60 border border-teal-100 text-sm text-slate-700">
          <div className="text-[10px] font-label-caps font-bold text-teal-700 mb-1">{reporte.resumen_ia.etiqueta.toUpperCase()}</div>
          {reporte.resumen_ia.texto}
        </div>
      ) : (
        <div className="text-xs text-slate-500">The AI summary is not available right now (Code AI-03). The full report below is complete.</div>
      )}
      <button type="button" onClick={() => setAbierto(!abierto)} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <span>{abierto ? 'Hide' : 'Show'} full report</span>
        <Icono nombre={abierto ? 'expand_less' : 'expand_more'} className="text-[16px]" />
      </button>
      {abierto && <pre className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 whitespace-pre-wrap font-label-sm max-h-72 overflow-y-auto">{reporte.texto}</pre>}
    </div>
  );
}

export default function ReporteTierra({ crew_id, emergencia_id, caso_doctor_id }: { crew_id: string; emergencia_id?: string | null; caso_doctor_id?: string }) {
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [notas, setNotas] = useState('');
  const [ocupado, setOcupado] = useState<'generando' | 'aprobando' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reporte || reporte.estado !== 'aprobado' || reporte.transmision?.estado === 'respondido') return;
    let vigente = true;
    void (async () => {
      await esperar(1000);
      if (!vigente) return;
      try {
        const actual = await api<Reporte>(`/v1/reports/${reporte.id}`, { crewId: crew_id });
        if (vigente) setReporte(actual);
      } catch (e) {
        if (vigente) setError(describeError(e));
      }
    })();
    return () => {
      vigente = false;
    };
  }, [reporte, crew_id]);

  const generar = async () => {
    setOcupado('generando');
    setError(null);
    try {
      const cuerpo = {
        ...(emergencia_id ? { emergencia_id } : {}),
        ...(caso_doctor_id ? { caso_doctor_id } : {}),
        ...(notas.trim() ? { notas: notas.trim() } : {}),
      };
      setReporte(await api<Reporte>('/v1/reports', { crewId: crew_id, method: 'POST', body: JSON.stringify(cuerpo) }));
    } catch (e) {
      setError(describeError(e));
    } finally {
      setOcupado(null);
    }
  };

  const aprobar = async () => {
    if (!reporte) return;
    setOcupado('aprobando');
    setError(null);
    try {
      setReporte(await api<Reporte>(`/v1/reports/${reporte.id}/approve`, { crewId: crew_id, method: 'PATCH', body: JSON.stringify({}) }));
    } catch (e) {
      setError(describeError(e));
    } finally {
      setOcupado(null);
    }
  };

  return (
    <div className="p-5 rounded-xl border border-slate-200 space-y-3">
      <div className="flex items-center gap-2">
        <Icono nombre="satellite_alt" className="text-[20px] text-[#0B1B3A]" />
        <div>
          <div className="text-[10px] font-label-caps font-bold tracking-widest text-slate-400">REPORT TO EARTH</div>
          <div className="text-sm font-bold text-slate-800">{reporte ? reporte.titulo : 'Send the case to the flight surgeon'}</div>
        </div>
        {reporte && (
          <span className={`ml-auto text-[10px] font-label-caps font-bold px-2 py-0.5 rounded border ${reporte.estado === 'aprobado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {reporte.estado === 'aprobado' ? `APPROVED BY ${reporte.aprobado_por ?? 'CREW'}` : 'DRAFT'}
          </span>
        )}
      </div>
      {error && <div className="text-xs text-rose-600">{error}</div>}

      {!reporte && (
        <>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className="w-full rounded-lg border-slate-300 text-sm focus:ring-1 focus:ring-[#0B1B3A] focus:border-[#0B1B3A]"
            placeholder="Crew notes for the flight surgeon (optional): what you did, how the person is now…"
          />
          <button type="button" onClick={generar} disabled={ocupado !== null} className="px-4 py-2 rounded-lg bg-[#0B1B3A] hover:bg-[#13285a] disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-2">
            <Icono nombre="description" className="text-[18px]" />
            {ocupado === 'generando' ? 'Building the report…' : 'Generate report for Earth'}
          </button>
        </>
      )}

      {reporte && <TextoReporte reporte={reporte} />}

      {reporte?.estado === 'borrador' && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={aprobar} disabled={ocupado !== null} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-2">
            <Icono nombre="send" className="text-[18px]" />
            {ocupado === 'aprobando' ? 'Sending…' : 'Approve & send to Earth'}
          </button>
          <span className="text-xs text-slate-500">The crew reviews the report before it leaves the ship.</span>
        </div>
      )}

      {reporte?.estado === 'aprobado' && <EstadoTransmision reporte={reporte} />}
    </div>
  );
}
