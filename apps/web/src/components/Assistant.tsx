import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { describeError } from '../lib/astro-med';
import type { Emergencia } from './Emergency';
import { Icono } from './parts';
import { Orbita } from './Loading';

type Mensaje = { rol: 'user' | 'assistant'; texto: string; etiqueta?: string };

const pide_emergencia = (texto: string) => /\b(sos|emergency|emergencia|mayday)\b/i.test(texto);

const pasos_reporte =['Date and mission day', 'Overall feeling (1 to 10)', 'Sleep and nutrition', 'Physical symptoms', 'Mood and exercise'];

export default function Asistente({ crew_id, abrir_sos }: { crew_id: string; abrir_sos: (emergencia: Emergencia) => void }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const final = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMensajes([]);
    setError(null);
  }, [crew_id]);

  useEffect(() => {
    final.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, enviando]);

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    const pregunta = texto.trim();
    if (!pregunta || enviando) return;
    const historial = [...mensajes, { rol: 'user' as const, texto: pregunta }];
    setMensajes(historial);
    setTexto('');
    setEnviando(true);
    setError(null);
    if (pide_emergencia(pregunta)) {
      api<Emergencia>('/v1/emergency', {
        crewId: crew_id,
        method: 'POST',
        body: JSON.stringify({ origen: 'tripulacion', reportada_por: 'ASTRO AI chat', descripcion: pregunta.slice(0, 2000) }),
      }).then(abrir_sos, (e) => setError(describeError(e)));
    }
    try {
      const respuesta = await api<{ respuesta: string; etiqueta: string; emergencia?: Emergencia | null }>('/v1/doctor/chat', {
        crewId: crew_id,
        method: 'POST',
        body: JSON.stringify({ mensajes: historial.slice(-20).map(({ rol, texto }) => ({ rol, texto })) }),
      });
      setMensajes([...historial, { rol: 'assistant', texto: respuesta.respuesta, etiqueta: respuesta.etiqueta }]);
      if (respuesta.emergencia) abrir_sos(respuesta.emergencia);
    } catch (e) {
      setError(e instanceof Error && e.message === 'model_unavailable' ? 'ASTRO AI is not available right now. Please try again later. (Code AI-01)' : describeError(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="lg:ml-[290px] min-h-screen bg-[#F4F7FB] px-4 pb-6 pt-[4.5rem] lg:p-8 space-y-7">
      <header className="flex items-center justify-between pb-4">
        <div className="space-y-1">
          <div className="text-[11px] font-label-caps font-bold tracking-widest text-slate-400 uppercase">AI HEALTH ASSISTANT</div>
          <h1 className="text-3xl font-display-lg font-bold text-slate-900 tracking-tight">ASTRO AI</h1>
        </div>
        <a href="/" className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 text-xs font-semibold shadow-sm transition-all duration-150">
          <Icono nombre="close" className="text-[16px]" />
          <span>Close</span>
        </a>
      </header>
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/70 p-8 shadow-sm flex flex-col justify-between h-[calc(100vh-160px)] min-h-[540px]">
          {mensajes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-primary-container mb-4 shadow-sm">
                <Icono nombre="auto_awesome" className="text-[28px]" />
              </div>
              <h2 className="text-xl font-medium text-slate-800 tracking-tight">How can I help you today?</h2>
              <p className="text-xs text-slate-400 mt-2 max-w-sm">ASTRO AI answers with your latest health data. Its suggestions are not validated by a physician.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {mensajes.map((mensaje, indice) => (
                <div key={indice} className={`flex ${mensaje.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${mensaje.rol === 'user' ? 'bg-[#0B1B3A] text-white rounded-br-md' : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-md'}`}>
                    {mensaje.texto}
                    {mensaje.etiqueta && <div className="mt-2 text-[10px] font-label-caps text-teal-700">{mensaje.etiqueta}</div>}
                  </div>
                </div>
              ))}
              {enviando && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 text-sm bg-slate-50 border border-slate-200 text-slate-500 flex items-center gap-2">
                    <Orbita clase="w-5 h-5" /> ASTRO AI is thinking…
                  </div>
                </div>
              )}
              <div ref={final} />
            </div>
          )}
          <div className="pt-4 space-y-2">
            {error && <div className="text-xs text-rose-600">{error}</div>}
            <form onSubmit={enviar} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 pl-4 focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-container transition-all">
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                type="text"
                placeholder="Type your question or paste your report..."
                aria-label="Message"
                className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm text-slate-800 placeholder-slate-400"
              />
              <button type="submit" disabled={enviando || !texto.trim()} aria-label="Send" className="w-10 h-10 rounded-full bg-primary-container hover:brightness-110 disabled:opacity-50 active:scale-95 text-slate-950 flex items-center justify-center shadow transition-all shrink-0">
                <Icono nombre="send" className="text-[20px]" />
              </button>
            </form>
          </div>
        </div>
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/70 p-8 shadow-sm flex flex-col justify-between h-[calc(100vh-160px)] min-h-[540px]">
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-primary-container border border-teal-100">
                <Icono nombre="description" className="text-[20px]" />
              </div>
              <h3 className="text-base font-bold text-[#0F1B2D]">How to structure your report</h3>
            </div>
            <ol className="space-y-4 pt-1">
              {pasos_reporte.map((paso, indice) => (
                <li key={paso} className="flex items-center gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-primary-container/20 text-teal-700 font-label-caps font-bold text-xs flex items-center justify-center shrink-0 border border-primary-container/30">{indice + 1}</span>
                  <span className="text-sm text-[#334155] font-medium">{paso}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="pt-6 border-t border-slate-100">
            <p className="text-xs text-[#334155] font-medium">Be specific and use numbers when you can.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
