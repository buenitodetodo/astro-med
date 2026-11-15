import { useCallback, useEffect, useState } from 'react';
import { nombres_campo, nombres_tipo, pedir, type Astronauta, type Caso, type Catalogo, type Estado } from '../lib/api';
import Constructor from './Builder';
import Grafica, { estilo_marca, type Marca } from './Chart';

const url_app = import.meta.env.PUBLIC_APP_URL ?? 'http://localhost:4330';

const colores_estado: Record<string, { fondo: string; texto: string; icono: string; nombre: string }> = {
  verde: { fondo: 'bg-bien/25 border-bien/70', texto: 'text-bien', icono: 'check_circle', nombre: 'Normal' },
  amarillo: { fondo: 'bg-aviso/25 border-aviso/80', texto: 'text-aviso', icono: 'error', nombre: 'Watch' },
  rojo: { fondo: 'bg-critico/35 border-critico', texto: 'text-critico', icono: 'emergency_home', nombre: 'Act' },
  informativo: { fondo: 'bg-azul/10 border-azul/40', texto: 'text-azul', icono: 'info', nombre: 'Info' },
  sin_datos: { fondo: 'bg-elevada border-borde', texto: 'text-texto-3', icono: 'remove', nombre: 'No data' },
};

const nombres_parametro: Record<string, string> = {
  ingesta: 'Food & fluids',
  ritmo_cardiaco: 'Heart',
  radiacion: 'Radiation',
  sueno: 'Sleep',
  temperatura: 'Temperature',
  presion: 'Blood pressure',
  musculo_hueso: 'Exercise, muscle & bone',
  spo2: 'SpO₂',
};

const nombres_nivel: Record<string, string> = { alta: 'High confidence', media: 'Medium confidence', dudosa: 'Doubtful' };

const legible = (codigo: string) => codigo.replaceAll('_', ' ');

const fecha_corta = (fecha: string) => new Date(`${fecha}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const hay_casos_abiertos = (estado: Estado | null) =>
  !!estado && [estado.preventivo, estado.seguimiento, estado.evento?.caso].some((caso) => caso?.estado === 'en_proceso');

function Kpi({ etiqueta, valor, detalle }: { etiqueta: string; valor: string; detalle?: string }) {
  return (
    <div className="tarjeta p-3">
      <p className="etiqueta">{etiqueta}</p>
      <p className="font-display text-2xl font-bold text-texto leading-tight">{valor}</p>
      {detalle && <p className="text-xs text-texto-3 mt-0.5">{detalle}</p>}
    </div>
  );
}

function TarjetaCaso({ titulo, explicacion, caso, esperada }: { titulo: string; explicacion: string; caso: Caso | null; esperada: { id: string; nombre: string } | null }) {
  if (!caso) {
    return (
      <div className="tarjeta p-4 opacity-70">
        <p className="font-display font-semibold">{titulo}</p>
        <p className="text-sm text-texto-3 mt-1">{explicacion}</p>
      </div>
    );
  }
  const r = caso.resultado;
  const acierto = {
    si: { texto: 'Matches the panel', clase: 'text-bien border-bien/60 bg-bien/10', icono: 'check' },
    segunda_opcion: { texto: 'Right answer as 2nd option', clase: 'text-aviso border-aviso/60 bg-aviso/10', icono: 'swap_vert' },
    no: { texto: 'Does not match', clase: 'text-critico border-critico/60 bg-critico/10', icono: 'close' },
  } as const;
  return (
    <div className="tarjeta p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-display font-semibold">{titulo}</p>
        {caso.acierto && (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${acierto[caso.acierto].clase}`}>
            <span className="material-symbols-outlined text-[16px]">{acierto[caso.acierto].icono}</span>
            {acierto[caso.acierto].texto}
          </span>
        )}
      </div>
      {caso.estado === 'en_proceso' && (
        <div>
          <p className="text-sm text-texto-2">AI doctor voting… {caso.progreso.rondas_hechas}/{caso.progreso.rondas_totales} rounds</p>
          <div className="h-1.5 rounded-full bg-elevada mt-2 overflow-hidden">
            <div className="h-full bg-serie transition-all" style={{ width: `${(100 * caso.progreso.rondas_hechas) / Math.max(1, caso.progreso.rondas_totales)}%` }} />
          </div>
        </div>
      )}
      {caso.estado === 'error' && <p className="text-sm text-critico">The AI doctor could not finish: {caso.error ?? 'unknown error'}</p>}
      {r && (
        <>
          <p className="text-lg font-semibold text-texto">{r.condicion.nombre}</p>
          <p className="text-xs font-mono text-texto-3">
            {nombres_nivel[r.nivel] ?? r.nivel} · reasoning {r.condicion.votos_razonamiento}/10 · medical {r.condicion.votos_medico}/10 · urgency {r.urgencia}/3
          </p>
          {r.segunda_opcion && <p className="text-xs text-texto-2">Second option: {r.segunda_opcion.nombre}</p>}
          {r.razon && <p className="text-sm text-texto-2 italic">“{r.razon}”</p>}
          {r.escalar_tierra && (
            <p className="text-xs text-aviso flex gap-1">
              <span className="material-symbols-outlined text-[16px]">satellite_alt</span>
              Escalated to Earth: {r.motivos_escalar.join(' ')}
            </p>
          )}
        </>
      )}
      <p className="text-xs text-texto-3 border-t border-borde pt-2">Panel answer: {esperada ? esperada.nombre : 'none set (detection only)'}</p>
    </div>
  );
}

export default function Panel({ salir }: { salir?: () => void }) {
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [tripulacion, setTripulacion] = useState<Astronauta[]>([]);
  const [crew_id, setCrewId] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [constructor_abierto, setConstructorAbierto] = useState(false);
  const [guia_abierta, setGuiaAbierta] = useState(() => {
    try {
      return localStorage.getItem('panel-guia') !== 'cerrada';
    } catch {
      return true;
    }
  });
  const cerrar_guia = () => {
    setGuiaAbierta(false);
    try {
      localStorage.setItem('panel-guia', 'cerrada');
    } catch {}
  };

  const astronauta = tripulacion.find((persona) => persona.id === crew_id) ?? null;

  const intentar = useCallback(async <T,>(accion: () => Promise<T>) => {
    setError(null);
    try {
      return await accion();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : String(fallo));
      setReproduciendo(false);
      return null;
    }
  }, []);

  const cargar_escenario = useCallback(
    async (id: string | null | undefined) => {
      if (!id) {
        setEstado(null);
        setConstructorAbierto(true);
        return;
      }
      const nuevo = await intentar(() => pedir<Estado>(`/scenarios/${id}`));
      if (nuevo) {
        setEstado(nuevo);
        setConstructorAbierto(false);
      }
    },
    [intentar],
  );

  useEffect(() => {
    void intentar(async () => {
      const [datos_catalogo, datos_crew] = await Promise.all([pedir<Catalogo>('/templates'), pedir<{ tripulacion: Astronauta[] }>('/crew')]);
      setCatalogo(datos_catalogo);
      setTripulacion(datos_crew.tripulacion);
      const primero = datos_crew.tripulacion.find((p) => p.escenario_id) ?? datos_crew.tripulacion[0];
      if (primero) {
        setCrewId(primero.id);
        await cargar_escenario(primero.escenario_id);
      }
    });
  }, [intentar, cargar_escenario]);

  const elegir = async (persona: Astronauta) => {
    setReproduciendo(false);
    setCrewId(persona.id);
    await cargar_escenario(persona.escenario_id);
  };

  const iniciar = async (cuerpo: Record<string, unknown>, dias_iniciales = 0) => {
    setOcupado(true);
    setReproduciendo(false);
    const nuevo = await intentar(async () => {
      const creado = await pedir<Estado>('/scenarios', { method: 'POST', body: cuerpo });
      if (dias_iniciales <= 0) return creado;
      return pedir<Estado>(`/scenarios/${creado.escenario.id}/advance`, { method: 'POST', body: { dias: dias_iniciales } });
    });
    setOcupado(false);
    if (!nuevo) return;
    setEstado(nuevo);
    setConstructorAbierto(false);
    setTripulacion((actuales) => actuales.map((p) => (p.id === nuevo.escenario.crew_member_id ? { ...p, escenario_id: nuevo.escenario.id } : p)));
  };

  const avanzar = useCallback(
    async (dias: number) => {
      if (!estado) return;
      setOcupado(true);
      const nuevo = await intentar(() => pedir<Estado>(`/scenarios/${estado.escenario.id}/advance`, { method: 'POST', body: { dias } }));
      setOcupado(false);
      if (!nuevo) return;
      setEstado(nuevo);
      const ultimo = nuevo.historial.at(-1);
      if (nuevo.escenario.estado !== 'activo' || (ultimo && ultimo.abiertos.length > 0)) setReproduciendo(false);
    },
    [estado, intentar],
  );

  useEffect(() => {
    if (!reproduciendo || ocupado || !estado || estado.escenario.estado !== 'activo') return;
    const temporizador = setTimeout(() => void avanzar(1), 1300);
    return () => clearTimeout(temporizador);
  }, [reproduciendo, ocupado, estado, avanzar]);

  useEffect(() => {
    if (!estado || !hay_casos_abiertos(estado)) return;
    const temporizador = setTimeout(async () => {
      const nuevo = await pedir<Estado>(`/scenarios/${estado.escenario.id}`).catch(() => null);
      if (nuevo) setEstado(nuevo);
    }, 1500);
    return () => clearTimeout(temporizador);
  }, [estado]);

  if (!catalogo) {
    return (
      <main className="min-h-screen grid place-items-center px-4">
        <p className="text-texto-2">{error ? `Could not reach the API: ${error}` : 'Loading simulator…'}</p>
      </main>
    );
  }

  const e = estado?.escenario;
  const fechas = Object.fromEntries((estado?.dias ?? []).map((dia) => [dia.dia, fecha_corta(dia.fecha)]));
  const marcas: Marca[] = estado
    ? [
        ...(e?.dia_inicio_cambios ? [{ dia: e.dia_inicio_cambios, tipo: 'cambio' as const }] : []),
        ...(estado.deteccion.primer_aviso_dia ? [{ dia: estado.deteccion.primer_aviso_dia, tipo: 'aviso' as const }] : []),
        ...(e?.dia_evento ? [{ dia: e.dia_evento, tipo: 'evento' as const }] : []),
      ]
    : [];
  const serie = (campo: 'pulso_lpm' | 'hrv_ms' | 'temperatura_c' | 'spo2' | 'sueno_horas' | 'kcal' | 'liquidos_ml' | 'radiacion_msv') =>
    (estado?.dias ?? []).map((dia) => ({ dia: dia.dia, valor: dia[campo] }));
  const dia_evento = estado?.dias.find((dia) => dia.evento);
  const extra = (campo: 'pulso_lpm' | 'temperatura_c' | 'spo2') =>
    dia_evento?.evento ? { dia: dia_evento.dia, valor: dia_evento.evento[campo], etiqueta: 'event reading' } : null;
  const terminado = e?.estado !== 'activo';

  return (
    <div className="min-h-screen">
      <header className="border-b border-borde bg-superficie/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-[1500px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-acento text-[28px]">satellite_alt</span>
            <div>
              <h1 className="font-display text-lg font-bold leading-tight">Astro-Med · Mission Simulator</h1>
              <p className="text-xs text-texto-3">Simulates a mission day by day. The crew app and the AIs only see the data, never the answer.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={url_app} target="_blank" rel="noreferrer" className="boton border border-borde text-texto-2 hover:text-acento hover:border-acento">
              <span className="material-symbols-outlined text-[18px]">open_in_new</span> Open the crew app
            </a>
            {salir && (
              <button type="button" onClick={salir} className="boton border border-borde text-texto-2 hover:text-critico hover:border-critico">
                <span className="material-symbols-outlined text-[18px]">lock</span> Lock
              </button>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-[1500px] mx-auto px-4 mt-3">
          <p className="rounded-md border border-critico/60 bg-critico/10 px-3 py-2 text-sm" role="alert">
            {error}
          </p>
        </div>
      )}

      <main className="max-w-[1500px] mx-auto px-4 py-4 grid gap-4 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-3" aria-label="Crew">
          <h2 className="etiqueta">Crew</h2>
          {tripulacion.map((persona) => (
            <button
              key={persona.id}
              type="button"
              onClick={() => void elegir(persona)}
              className={`w-full text-left tarjeta p-3 transition hover:border-acento ${persona.id === crew_id ? 'border-acento ring-1 ring-acento' : ''}`}
              aria-pressed={persona.id === crew_id}
              aria-label={`${persona.nombre}, ${persona.rol}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{persona.nombre}</p>
                <span className="font-mono text-[11px] text-texto-3">{persona.callsign}</span>
              </div>
              <p className="text-xs text-texto-2">{persona.rol}</p>
              <p className="text-xs text-texto-3 mt-1 font-mono">
                {persona.edad} y · {persona.sexo === 'mujer' ? 'F' : 'M'} · {persona.peso_kg} kg · {persona.estatura_m} m
              </p>
              {persona.escenario_id && <p className="text-[11px] text-acento mt-1">Scenario loaded</p>}
            </button>
          ))}
          {astronauta && (
            <details className="tarjeta p-3 text-xs text-texto-2">
              <summary className="cursor-pointer select-none font-mono text-[11px] uppercase tracking-wider text-texto-3">Profile of {astronauta.nombre}</summary>
              <div className="space-y-1 pt-2">
              <p>Needs {astronauta.requerimientos.kcal.toLocaleString('en-US')} kcal and {astronauta.requerimientos.liquidos_ml.toLocaleString('en-US')} ml of fluids per day</p>
              <p>Mission: {astronauta.mision}, day {astronauta.dia_mision}{astronauta.duracion_dias ? ` of ${astronauta.duracion_dias}` : ''}</p>
              <p>Blood type: {astronauta.tipo_sangre ?? 'no data'}</p>
              <p>Allergies: {astronauta.alergias.length ? astronauta.alergias.join(', ') : 'none recorded'}</p>
              <p>History: {astronauta.antecedentes.length ? astronauta.antecedentes.join(', ') : 'none recorded'}</p>
              <p>Protein minimum: {astronauta.requerimientos.proteina_g} g/day</p>
              </div>
            </details>
          )}
        </aside>

        <div className="space-y-4 min-w-0">
          {guia_abierta && (
            <section className="tarjeta p-4" aria-label="How to use this panel">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display font-semibold">How it works</h2>
                <button type="button" className="text-xs text-texto-3 hover:text-acento underline" onClick={cerrar_guia}>
                  Got it, hide
                </button>
              </div>
              <ol className="grid gap-3 sm:grid-cols-3 mt-3 text-sm text-texto-2">
                <li><strong className="text-texto">1. Choose.</strong> Pick an astronaut on the left and a scenario. You decide in secret what will go wrong and when.</li>
                <li><strong className="text-texto">2. Play.</strong> Each press uploads one day of data to the crew app. The watcher and the AIs only see that data.</li>
                <li><strong className="text-texto">3. Compare.</strong> See on which day the system noticed and whether the AI diagnosis matches your secret answer.</li>
              </ol>
            </section>
          )}

          {astronauta && (constructor_abierto || !estado) && (
            <Constructor
              catalogo={catalogo}
              astronauta={astronauta}
              ocupado={ocupado}
              onIniciar={(cuerpo, dias_iniciales) => void iniciar(cuerpo, dias_iniciales)}
              onCancelar={estado ? () => setConstructorAbierto(false) : undefined}
            />
          )}

          {estado && e && !constructor_abierto && (
            <>
              <section className="tarjeta p-4 space-y-4" aria-label="Scenario">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="etiqueta">
                      {nombres_tipo[e.tipo]}
                      {e.personalizado ? ' · custom' : ''} · {estado.astronauta?.nombre}
                    </p>
                    <h2 className="font-display text-2xl font-bold">{e.titulo}</h2>
                    <p className="text-sm text-texto-2 max-w-3xl">{e.descripcion}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-bold">
                      Day {e.dia_actual}
                      <span className="text-texto-3 text-xl"> / {e.dias_totales}</span>
                    </p>
                    <p className="text-xs text-texto-3 font-mono">
                      {fecha_corta(e.fecha_base)} → today · {e.estado === 'terminado' ? 'finished' : e.estado === 'reemplazado' ? 'replaced' : 'running'}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-aviso/40 bg-aviso/5 p-3 text-sm space-y-1">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-aviso flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">visibility_off</span> Ground truth · only this panel knows
                  </p>
                  {e.dia_inicio_cambios ? (
                    <p>
                      Changes start on <strong>day {e.dia_inicio_cambios}</strong> ({e.fecha_inicio_cambios && fecha_corta(e.fecha_inicio_cambios)}):{' '}
                      {estado.verdad.cambios.map((c) => `${nombres_campo[c.campo]?.nombre ?? c.campo} ${c.delta > 0 ? '+' : ''}${c.delta}`).join(', ') || 'no measured changes'}
                      {estado.verdad.sintomas ? `; symptoms from +${estado.verdad.sintomas.desde} d: ${estado.verdad.sintomas.lista.join(', ')}` : ''}.
                      {' '}Expected diagnosis: <strong>{estado.verdad.condicion_prevencion?.nombre ?? 'none set'}</strong>.
                    </p>
                  ) : (
                    <p>No gradual changes: any alert before an event is a false alarm.</p>
                  )}
                  {estado.verdad.evento && e.dia_evento && (
                    <p>
                      Event on <strong>day {e.dia_evento}</strong> ({e.fecha_evento && fecha_corta(e.fecha_evento)}): “{estado.verdad.evento.info}” Predetermined conclusion:{' '}
                      <strong>{estado.verdad.condicion_evento?.nombre}</strong>.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" className="boton bg-serie text-fondo hover:bg-acento" disabled={ocupado || terminado} onClick={() => void avanzar(1)}>
                    <span className="material-symbols-outlined text-[18px]">skip_next</span> Next day
                  </button>
                  <button
                    type="button"
                    className="boton border border-serie text-acento hover:bg-serie/10"
                    disabled={terminado}
                    onClick={() => setReproduciendo((valor) => !valor)}
                  >
                    <span className="material-symbols-outlined text-[18px]">{reproduciendo ? 'pause' : 'play_arrow'}</span>
                    {reproduciendo ? 'Pause' : 'Play'}
                  </button>
                  <button
                    type="button"
                    className="boton border border-borde text-texto-2 hover:bg-elevada"
                    disabled={ocupado || terminado}
                    onClick={() => void avanzar(e.dias_totales - e.dia_actual)}
                  >
                    <span className="material-symbols-outlined text-[18px]">fast_forward</span> Run to the end
                  </button>
                  <button type="button" className="boton border border-borde text-texto-2 hover:bg-elevada ml-auto" onClick={() => setConstructorAbierto(true)}>
                    <span className="material-symbols-outlined text-[18px]">tune</span> New scenario
                  </button>
                </div>
                <p className="text-xs text-texto-3 -mt-2">Play uploads one day per second and pauses by itself when the AI doctor is called. Press it again to continue.</p>

                <div>
                  <ol className="grid gap-1.5 grid-cols-7 sm:grid-cols-[repeat(var(--dias),minmax(0,1fr))]" style={{ '--dias': e.dias_totales } as React.CSSProperties} aria-label="Daily timeline">
                    {Array.from({ length: e.dias_totales }, (_, i) => i + 1).map((dia) => {
                      const registro = estado.historial.find((h) => h.dia === dia);
                      const color = colores_estado[registro?.color ?? ''] ?? null;
                      const descripcion = [
                        `Day ${dia}`,
                        registro ? `watcher: ${colores_estado[registro.color]?.nombre ?? registro.color}` : 'not simulated yet',
                        ...(registro?.alertas.length ? [`alerts: ${registro.alertas.map(legible).join(', ')}`] : []),
                        ...(registro?.abiertos.length ? [`AI called: ${registro.abiertos.join(', ')}`] : []),
                        ...(dia === e.dia_inicio_cambios ? ['hidden changes start'] : []),
                        ...(dia === e.dia_evento ? ['event'] : []),
                      ].join(' · ');
                      return (
                        <li
                          key={dia}
                          title={descripcion}
                          aria-label={descripcion}
                          className={`relative rounded-md border min-h-14 flex flex-col items-center justify-between gap-0.5 py-1 ${color ? color.fondo : 'border-dashed border-borde'} ${dia === e.dia_actual ? 'ring-2 ring-acento' : ''}`}
                        >
                          <span className="font-mono text-[11px] text-texto flex items-center gap-0.5">
                            {dia}
                            {registro && registro.color !== 'verde' && color && <span className={`material-symbols-outlined text-[12px] ${color.texto}`}>{color.icono}</span>}
                          </span>
                          <span className="flex flex-wrap justify-center gap-px leading-none">
                            {dia === e.dia_inicio_cambios && <span className="material-symbols-outlined text-[13px] text-aviso">visibility_off</span>}
                            {dia === estado.deteccion.primer_aviso_dia && <span className="material-symbols-outlined text-[13px] text-azul">notification_important</span>}
                            {registro?.abiertos.some((a) => a !== 'evento') && <span className="material-symbols-outlined text-[13px] text-acento">stethoscope</span>}
                            {dia === e.dia_evento && <span className="material-symbols-outlined text-[13px] text-critico">emergency</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-texto-3">
                    <li className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-aviso">visibility_off</span>hidden change start</li>
                    <li className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-azul">notification_important</span>first watcher alert</li>
                    <li className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-acento">stethoscope</span>preventive AI check</li>
                    <li className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-critico">emergency</span>event → emergency</li>
                    <li>cell color = watcher result that day: green normal · yellow <span className="material-symbols-outlined text-[12px] text-aviso align-middle">error</span> watch · red <span className="material-symbols-outlined text-[12px] text-critico align-middle">emergency_home</span> act</li>
                  </ul>
                </div>
              </section>

              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Detection summary">
                <Kpi
                  etiqueta="First alert"
                  valor={estado.deteccion.primer_aviso_dia ? `Day ${estado.deteccion.primer_aviso_dia}` : '—'}
                  detalle={estado.deteccion.primer_aviso_dia ? fechas[estado.deteccion.primer_aviso_dia] : 'No alert yet'}
                />
                <Kpi
                  etiqueta="Detection delay"
                  valor={estado.deteccion.dias_tras_el_cambio === null ? '—' : `${estado.deteccion.dias_tras_el_cambio} d`}
                  detalle="Days between the hidden change and the first alert"
                />
                <Kpi
                  etiqueta="Warning before event"
                  valor={estado.deteccion.dias_de_anticipacion === null ? '—' : `${estado.deteccion.dias_de_anticipacion} d`}
                  detalle={e.dia_evento ? 'Days the crew had to prevent it' : 'No event in this scenario'}
                />
                <Kpi etiqueta="False alarms" valor={String(estado.deteccion.avisos_antes_del_cambio)} detalle="Days with alerts before anything changed" />
              </section>

              <section className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
                <div className="tarjeta p-4" aria-label="Watcher">
                  <h3 className="font-display font-semibold mb-1">Watcher today</h3>
                  <p className="text-xs text-texto-3 mb-3">Code rules with sources, evaluated as of day {e.dia_actual}.</p>
                  {estado.vigilante ? (
                    <>
                      <ul className="grid grid-cols-2 gap-2">
                        {estado.vigilante.semaforo.map(({ parametro, color }) => {
                          const estilo = colores_estado[color] ?? colores_estado.sin_datos!;
                          return (
                            <li key={parametro} className={`rounded-md border px-2 py-1.5 flex items-center gap-2 text-sm ${estilo.fondo}`}>
                              <span className={`material-symbols-outlined text-[18px] ${estilo.texto}`}>{estilo.icono}</span>
                              <span className="flex-1">{nombres_parametro[parametro] ?? parametro}</span>
                              <span className={`text-[11px] font-mono ${estilo.texto}`}>{estilo.nombre}</span>
                            </li>
                          );
                        })}
                      </ul>
                      {estado.vigilante.alertas.length > 0 && (
                        <ul className="mt-3 space-y-1.5 text-sm">
                          {estado.vigilante.alertas.map((alerta) => (
                            <li key={alerta.codigo} className="flex gap-2">
                              <span className={`material-symbols-outlined text-[18px] ${alerta.gravedad === 'rojo' ? 'text-critico' : 'text-aviso'}`}>
                                {alerta.gravedad === 'rojo' ? 'emergency_home' : 'error'}
                              </span>
                              <span className="text-texto-2">{alerta.mensaje}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-texto-3">Advance one day to start the watcher.</p>
                  )}
                </div>

                <div className="space-y-3" aria-label="AI doctor">
                  <TarjetaCaso
                    titulo="Preventive AI check"
                    explicacion="Opens automatically when the watcher sees a red alert, two alerts at once, or alerts on two days in a row."
                    caso={estado.preventivo}
                    esperada={estado.verdad.condicion_prevencion}
                  />
                  {(estado.seguimiento || estado.preventivo) && (
                    <TarjetaCaso
                      titulo="Follow-up AI check"
                      explicacion="Opens once if new symptoms are logged after the preventive check."
                      caso={estado.seguimiento}
                      esperada={estado.verdad.condicion_prevencion}
                    />
                  )}
                  {(e.dia_evento || estado.evento) && (
                    <TarjetaCaso
                      titulo="Emergency AI case"
                      explicacion={`On day ${e.dia_evento} the crew reports the event: the emergency is confirmed and goes straight to the AI doctor.`}
                      caso={estado.evento?.caso ?? null}
                      esperada={estado.verdad.condicion_evento}
                    />
                  )}
                </div>
              </section>

              <section aria-label="Charts" className="space-y-2">
                <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-texto-2">
                  {(['cambio', 'aviso', 'evento'] as const).map((tipo) => (
                    <li key={tipo} className="flex items-center gap-1.5">
                      <svg width="22" height="10" aria-hidden="true">
                        <line x1="1" y1="5" x2="21" y2="5" stroke={estilo_marca[tipo].color} strokeWidth="2" strokeDasharray={estilo_marca[tipo].trazo} strokeLinecap="round" />
                      </svg>
                      {estilo_marca[tipo].nombre}
                    </li>
                  ))}
                  <li className="flex items-center gap-1.5">
                    <svg width="22" height="10" aria-hidden="true">
                      <line x1="1" y1="5" x2="21" y2="5" stroke="#7d8ba0" strokeWidth="1" strokeDasharray="2 3" />
                    </svg>
                    Baseline or requirement
                  </li>
                </ul>
                <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                  <Grafica titulo="Resting heart rate" unidad="bpm" puntos={serie('pulso_lpm')} dias_totales={e.dias_totales} fechas={fechas} marcas={marcas}
                    referencias={[{ valor: estado.linea_base.pulso_lpm, etiqueta: `baseline ${estado.linea_base.pulso_lpm}` }]} extra={extra('pulso_lpm')} />
                  <Grafica titulo="Heart rate variability" unidad="ms" puntos={serie('hrv_ms')} dias_totales={e.dias_totales} fechas={fechas} marcas={marcas}
                    referencias={[{ valor: estado.linea_base.hrv_ms, etiqueta: `baseline ${estado.linea_base.hrv_ms}` }]} />
                  <Grafica titulo="Temperature" unidad="°C" decimales={1} puntos={serie('temperatura_c')} dias_totales={e.dias_totales} fechas={fechas} marcas={marcas}
                    referencias={[{ valor: estado.linea_base.temperatura_c, etiqueta: `baseline ${estado.linea_base.temperatura_c}` }]} extra={extra('temperatura_c')} />
                  <Grafica titulo="Blood oxygen" unidad="SpO₂ %" puntos={serie('spo2')} dias_totales={e.dias_totales} fechas={fechas} marcas={marcas}
                    referencias={[{ valor: 95, etiqueta: 'watch below 95' }]} extra={extra('spo2')} />
                  <Grafica titulo="Sleep" unidad="h" decimales={1} puntos={serie('sueno_horas')} dias_totales={e.dias_totales} fechas={fechas} marcas={marcas}
                    referencias={[{ valor: 6, etiqueta: '≤6 h fatigue' }]} />
                  <Grafica titulo="Food intake" unidad="kcal" puntos={serie('kcal')} dias_totales={e.dias_totales} fechas={fechas} marcas={marcas}
                    referencias={estado.astronauta ? [{ valor: estado.astronauta.requerimientos.kcal, etiqueta: `needs ${estado.astronauta.requerimientos.kcal}` }] : []} />
                  <Grafica titulo="Fluids" unidad="ml" puntos={serie('liquidos_ml')} dias_totales={e.dias_totales} fechas={fechas} marcas={marcas}
                    referencias={estado.astronauta ? [{ valor: estado.astronauta.requerimientos.liquidos_ml, etiqueta: `needs ${estado.astronauta.requerimientos.liquidos_ml}` }] : []} />
                  <Grafica titulo="Radiation dose" unidad="mSv/day" decimales={2} puntos={serie('radiacion_msv')} dias_totales={e.dias_totales} fechas={fechas} marcas={marcas} />
                </div>
              </section>

              <section className="grid gap-3 md:grid-cols-2" aria-label="Predictions">
                <div className="tarjeta p-4">
                  <h3 className="font-display font-semibold">Radiation projection</h3>
                  {estado.prediccion.radiacion ? (
                    <>
                      <p className="font-display text-2xl font-bold mt-1">
                        {estado.prediccion.radiacion.proyectada_fin_mision_msv} mSv
                        <span className="text-sm text-texto-3 font-sans font-normal"> at mission end · limit {estado.prediccion.radiacion.limite_carrera_msv} mSv career</span>
                      </p>
                      <div className="h-2 rounded-full bg-elevada mt-2 overflow-hidden" role="img" aria-label={`${Math.round((100 * estado.prediccion.radiacion.proyectada_fin_mision_msv) / estado.prediccion.radiacion.limite_carrera_msv)}% of the career limit`}>
                        <div
                          className="h-full bg-serie"
                          style={{ width: `${Math.min(100, (100 * estado.prediccion.radiacion.proyectada_fin_mision_msv) / estado.prediccion.radiacion.limite_carrera_msv)}%` }}
                        />
                      </div>
                      <p className="text-xs text-texto-3 mt-2">{estado.prediccion.radiacion.supuesto} Source: {estado.prediccion.radiacion.fuente}.</p>
                    </>
                  ) : (
                    <p className="text-sm text-texto-3 mt-1">No data: the mission has no planned length, so there is no end date to project to.</p>
                  )}
                </div>
                <div className="tarjeta p-4">
                  <h3 className="font-display font-semibold">Bone loss estimate</h3>
                  <p className="font-display text-2xl font-bold mt-1">
                    {estado.prediccion.hueso.perdida_estimada_pct.minimo}–{estado.prediccion.hueso.perdida_estimada_pct.maximo}%
                    <span className="text-sm text-texto-3 font-sans font-normal"> spine & hip after {estado.prediccion.hueso.meses} months</span>
                  </p>
                  <p className="text-xs text-texto-3 mt-2">{estado.prediccion.hueso.supuesto} Source: {estado.prediccion.hueso.fuente}.</p>
                </div>
              </section>

              <details className="tarjeta p-4" aria-label="Daily data table">
                <summary className="cursor-pointer select-none font-display font-semibold">Show the raw data uploaded to the crew app</summary>
                <p className="text-xs text-texto-3 mt-1 mb-3">Exactly what the log keeper writes each day. This is all the watcher and the AI doctor ever see.</p>
                <div className="overflow-x-auto">
                <table className="w-full text-sm font-mono">
                  <thead className="text-left text-[11px] uppercase tracking-wider text-texto-3">
                    <tr className="border-b border-borde">
                      {['Day', 'Date', 'Sleep h', 'kcal', 'Fluids ml', 'HR', 'HRV', 'BP', '°C', 'SpO₂', 'mSv', 'Symptoms / event'].map((titulo) => (
                        <th key={titulo} scope="col" className="py-1.5 pr-3 font-semibold whitespace-nowrap">{titulo}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...estado.dias].reverse().map((dia) => (
                      <tr key={dia.dia} className={`border-b border-borde/60 ${dia.cambiado ? 'bg-aviso/5' : ''}`}>
                        <td className="py-1.5 pr-3">{dia.dia}</td>
                        <td className="py-1.5 pr-3 whitespace-nowrap">{fecha_corta(dia.fecha)}</td>
                        <td className="py-1.5 pr-3">{dia.sueno_horas}</td>
                        <td className="py-1.5 pr-3">{dia.kcal}</td>
                        <td className="py-1.5 pr-3">{dia.liquidos_ml}</td>
                        <td className="py-1.5 pr-3">{dia.pulso_lpm}</td>
                        <td className="py-1.5 pr-3">{dia.hrv_ms}</td>
                        <td className="py-1.5 pr-3 whitespace-nowrap">{dia.presion_sistolica}/{dia.presion_diastolica}</td>
                        <td className="py-1.5 pr-3">{dia.temperatura_c}</td>
                        <td className="py-1.5 pr-3">{dia.spo2}</td>
                        <td className="py-1.5 pr-3">{dia.radiacion_msv}</td>
                        <td className="py-1.5 pr-3 font-sans text-texto-2 min-w-[14rem]">
                          {[...dia.sintomas, ...(dia.evento ? [`EVENT: ${dia.evento.info}`] : [])].join(' · ') || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                {estado.dias.length === 0 && <p className="text-sm text-texto-3 py-3">Nothing uploaded yet: press “Next day”.</p>}
              </details>

              <p className="text-xs text-texto-3 pb-6">
                Simulated, fictional data for a demonstration. The detection and AI results here show how the system behaves on these scenarios; they are not a clinical validation.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
