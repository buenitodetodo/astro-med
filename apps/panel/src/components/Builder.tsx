import { useEffect, useMemo, useState } from 'react';
import { nombres_campo, nombres_tipo, type Astronauta, type Cambio, type Catalogo, type LineaBase, type Plantilla, type Tipo } from '../lib/api';
import { demos, type Demo } from '../lib/demos';
import { revisar_realismo } from '../lib/realism';

type Props = {
  catalogo: Catalogo;
  astronauta: Astronauta;
  ocupado: boolean;
  onIniciar: (cuerpo: Record<string, unknown>, avanzar?: number) => void;
  onCancelar?: () => void;
};

const nombres_signo: Record<string, string> = {
  pulso_lpm: 'Heart rate (bpm)',
  presion_sistolica: 'Systolic (mmHg)',
  presion_diastolica: 'Diastolic (mmHg)',
  temperatura_c: 'Temperature (°C)',
  spo2: 'SpO₂ (%)',
};

const nombres_base: Record<keyof LineaBase, string> = {
  pulso_lpm: 'Resting HR (bpm)',
  hrv_ms: 'HRV (ms)',
  presion_sistolica: 'Systolic (mmHg)',
  presion_diastolica: 'Diastolic (mmHg)',
  temperatura_c: 'Temperature (°C)',
  spo2: 'SpO₂ (%)',
  sueno_horas: 'Sleep (h)',
};

const lista = (texto: string) =>
  texto
    .split(',')
    .map((parte) => parte.trim())
    .filter(Boolean);

const numero = (texto: string) => (texto.trim() === '' || Number.isNaN(Number(texto)) ? null : Number(texto));

export default function Constructor({ catalogo, astronauta, ocupado, onIniciar, onCancelar }: Props) {
  const [plantilla_id, setPlantillaId] = useState(catalogo.plantillas[1]?.id ?? catalogo.plantillas[0]!.id);
  const plantilla = catalogo.plantillas.find((p) => p.id === plantilla_id) as Plantilla;

  const [titulo, setTitulo] = useState('');
  const [dias_totales, setDiasTotales] = useState('14');
  const [dia_inicio, setDiaInicio] = useState('');
  const [dia_evento, setDiaEvento] = useState('');
  const [cambios, setCambios] = useState<Cambio[]>([]);
  const [con_sintomas, setConSintomas] = useState(false);
  const [sintomas_desde, setSintomasDesde] = useState('1');
  const [sintomas_texto, setSintomasTexto] = useState('');
  const [condicion_prevencion, setCondicionPrevencion] = useState('');
  const [con_evento, setConEvento] = useState(false);
  const [evento_info, setEventoInfo] = useState('');
  const [evento_condicion, setEventoCondicion] = useState('');
  const [evento_signos, setEventoSignos] = useState<Record<string, string>>({});
  const [evento_sintomas, setEventoSintomas] = useState('');
  const [linea_base, setLineaBase] = useState<Record<string, string>>({});
  const [confirmando, setConfirmando] = useState(false);
  const [demo_elegida, setDemoElegida] = useState<Demo | null>(null);
  const [acepta_extremos, setAceptaExtremos] = useState(false);

  useEffect(() => {
    setTitulo(plantilla.titulo);
    setDiasTotales(String(plantilla.dias_recomendados));
    setDiaInicio(plantilla.inicio_cambios_recomendado ? String(plantilla.inicio_cambios_recomendado) : '8');
    setDiaEvento(String(plantilla.dias_recomendados));
    setCambios(plantilla.cambios.map((cambio) => ({ ...cambio })));
    setConSintomas(plantilla.sintomas !== null);
    setSintomasDesde(String(plantilla.sintomas?.desde ?? 1));
    setSintomasTexto(plantilla.sintomas?.lista.join(', ') ?? '');
    setCondicionPrevencion(plantilla.condicion_prevencion ?? '');
    setConEvento(plantilla.evento !== null);
    setEventoInfo(plantilla.evento?.info ?? '');
    setEventoCondicion(plantilla.evento?.condicion ?? '');
    setEventoSignos(Object.fromEntries(Object.entries(plantilla.evento?.signos ?? {}).map(([clave, valor]) => [clave, String(valor ?? '')])));
    setEventoSintomas(plantilla.evento?.sintomas?.join(', ') ?? '');
    setConfirmando(false);
  }, [plantilla]);

  useEffect(() => {
    setLineaBase(Object.fromEntries(Object.entries(astronauta.linea_base_sugerida).map(([clave, valor]) => [clave, String(valor)])));
    setConfirmando(false);
  }, [astronauta]);

  const gradual = cambios.length > 0 || con_sintomas;
  const tipo: Tipo = gradual && con_evento ? 'gradual_y_evento' : gradual ? 'gradual' : con_evento ? 'repentino' : 'control';

  const problemas = useMemo(() => {
    const lista_problemas: string[] = [];
    const total = numero(dias_totales);
    const inicio = numero(dia_inicio);
    const evento = numero(dia_evento);
    if (total === null || total < 7 || total > 30) lista_problemas.push('Scenario length must be 7–30 days.');
    if (gradual && (inicio === null || inicio < 6)) lista_problemas.push('Changes must start on day 6 or later: the watcher needs 5 normal days to learn the baseline.');
    if (gradual && total !== null && inicio !== null && inicio > total) lista_problemas.push('The change day must fall inside the scenario.');
    if (con_evento && (evento === null || (total !== null && evento > total))) lista_problemas.push('The event day must fall inside the scenario.');
    if (con_evento && gradual && evento !== null && inicio !== null && evento <= inicio) lista_problemas.push('The event must happen after the changes start.');
    if (con_evento && (!evento_info.trim() || !evento_condicion)) lista_problemas.push('Describe the event and choose its expected condition.');
    if (con_sintomas && lista(sintomas_texto).length === 0) lista_problemas.push('Write at least one symptom or turn symptoms off.');
    if (cambios.some((cambio) => Number.isNaN(cambio.delta) || cambio.rampa < 1)) lista_problemas.push('Every change needs a number and a ramp of 1 day or more.');
    return lista_problemas;
  }, [dias_totales, dia_inicio, dia_evento, gradual, con_evento, evento_info, evento_condicion, con_sintomas, sintomas_texto, cambios]);

  const extremos = useMemo(
    () =>
      revisar_realismo({
        cambios,
        linea_base: Object.fromEntries(Object.entries(linea_base).map(([clave, valor]) => [clave, numero(valor)])),
        requerimientos: astronauta.requerimientos,
        signos_evento: con_evento ? Object.fromEntries(Object.entries(evento_signos).map(([clave, valor]) => [clave, numero(valor)])) : {},
      }),
    [cambios, linea_base, astronauta, con_evento, evento_signos],
  );
  const clave_extremos = extremos.join('|');
  useEffect(() => setAceptaExtremos(false), [clave_extremos]);

  const cargar_demo = () => {
    if (!demo_elegida) return;
    onIniciar({ crew_id: astronauta.id, ...demo_elegida.cuerpo }, demo_elegida.avanzar);
    setDemoElegida(null);
  };

  const iniciar = () => {
    if (!confirmando) return setConfirmando(true);
    const signos = Object.fromEntries(
      Object.entries(evento_signos).flatMap(([clave, valor]) => (numero(valor) === null ? [] : [[clave, numero(valor)]])),
    );
    onIniciar({
      crew_id: astronauta.id,
      plantilla: plantilla.id,
      titulo: titulo.trim() || plantilla.titulo,
      dias_totales: numero(dias_totales),
      ...(gradual ? { dia_inicio_cambios: numero(dia_inicio) } : {}),
      ...(con_evento ? { dia_evento: numero(dia_evento) } : {}),
      cambios,
      sintomas: con_sintomas ? { desde: numero(sintomas_desde) ?? 0, lista: lista(sintomas_texto) } : null,
      condicion_prevencion: gradual ? condicion_prevencion || null : null,
      evento: con_evento
        ? { info: evento_info.trim(), condicion: evento_condicion, signos, sintomas: lista(evento_sintomas) }
        : null,
      linea_base: Object.fromEntries(Object.entries(linea_base).flatMap(([clave, valor]) => (numero(valor) === null ? [] : [[clave, numero(valor)]]))),
    });
    setConfirmando(false);
  };

  const nombre_condicion = (id: string) => catalogo.condiciones.find((condicion) => condicion.id === id)?.nombre ?? id;
  const resumen = [
    `${astronauta.nombre} lives ${dias_totales} simulated days. You upload them one at a time.`,
    ...(gradual
      ? [`From day ${dia_inicio} things quietly start to change${condicion_prevencion ? `. The right diagnosis is "${nombre_condicion(condicion_prevencion)}"` : ''}.`]
      : []),
    ...(con_evento ? [`On day ${dia_evento} the crew reports a sudden event${evento_condicion ? `. The right conclusion is "${nombre_condicion(evento_condicion)}"` : ''}.`] : []),
    ...(!gradual && !con_evento ? ['Nothing goes wrong: the system should stay green the whole time.'] : []),
    'Starting erases the data this astronaut has in the crew app.',
  ];

  const cambiar = (indice: number, parcial: Partial<Cambio>) =>
    setCambios((actuales) => actuales.map((cambio, i) => (i === indice ? { ...cambio, ...parcial } : cambio)));

  return (
    <section className="tarjeta p-4 space-y-5" aria-labelledby="titulo-constructor">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 id="titulo-constructor" className="font-display text-lg font-bold">New scenario for {astronauta.nombre}</h2>
          <p className="text-sm text-texto-2">Pick what will happen to this astronaut. Only this panel knows the answer.</p>
        </div>
        {onCancelar && (
          <button type="button" className="boton border border-borde text-texto-2 hover:bg-elevada" onClick={onCancelar}>
            Close
          </button>
        )}
      </header>

      <div>
        <p className="etiqueta">Ready-made demos: one click and the story is set up</p>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {demos.map((demo) => (
            <button
              key={demo.id}
              type="button"
              disabled={ocupado}
              onClick={() => setDemoElegida(demo)}
              aria-pressed={demo_elegida?.id === demo.id}
              className={`text-left rounded-lg border p-3 transition hover:border-acento disabled:opacity-40 ${demo_elegida?.id === demo.id ? 'border-acento ring-1 ring-acento bg-elevada' : 'border-borde bg-fondo'}`}
            >
              <span className="flex items-center gap-2 font-semibold text-sm text-texto">
                <span className="material-symbols-outlined text-[18px] text-acento">{demo.icono}</span>
                {demo.titulo}
              </span>
              <span className="block text-xs text-texto-3 mt-1">{demo.descripcion}</span>
            </button>
          ))}
        </div>
        {demo_elegida && (
          <div className="flex flex-wrap items-center gap-3 mt-3 rounded-lg border border-critico/50 bg-critico/10 p-3 text-sm">
            <span className="flex-1 min-w-[12rem]">
              Load “{demo_elegida.titulo}” on {astronauta.nombre}? This erases the data this astronaut has in the crew app.
            </span>
            <button type="button" className="boton bg-critico text-white hover:bg-critico/90" disabled={ocupado} onClick={cargar_demo}>
              <span className="material-symbols-outlined text-[18px]">bolt</span> Load demo
            </button>
            <button type="button" className="boton text-texto-2 hover:text-texto" onClick={() => setDemoElegida(null)}>
              Cancel
            </button>
          </div>
        )}
      </div>

      <p className="etiqueta mb-0 pt-1">Or build your own</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="etiqueta">Template</span>
          <select className="campo" value={plantilla_id} onChange={(e) => setPlantillaId(e.target.value)}>
            {catalogo.plantillas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.titulo} — {nombres_tipo[p.tipo]}
              </option>
            ))}
          </select>
          <span className="block text-xs text-texto-3 mt-1">{plantilla.descripcion}</span>
        </label>
      </div>

      <div className="rounded-lg border border-borde bg-fondo p-3 text-sm">
        <p className="etiqueta">What will happen</p>
        <ul className="space-y-1 text-texto-2">
          {resumen.map((linea) => (
            <li key={linea} className="flex gap-2">
              <span className="material-symbols-outlined text-[16px] text-acento mt-0.5">chevron_right</span>
              {linea}
            </li>
          ))}
        </ul>
      </div>

      <details className="rounded-lg border border-borde">
        <summary className="cursor-pointer select-none px-3 py-2.5 text-sm font-semibold text-texto-2 hover:text-acento">
          Customize this scenario (optional): days, changes, symptoms, event, baseline
        </summary>
        <div className="space-y-5 p-3 pt-2">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="etiqueta">Scenario title</span>
          <input className="campo" value={titulo} maxLength={120} onChange={(e) => setTitulo(e.target.value)} />
        </label>
        <label>
          <span className="etiqueta">Length (days)</span>
          <input className="campo" type="number" min={7} max={30} value={dias_totales} onChange={(e) => setDiasTotales(e.target.value)} />
        </label>
        <div>
          <span className="etiqueta">Resulting type</span>
          <p className="font-mono text-sm text-acento py-2">{nombres_tipo[tipo]}</p>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="font-display font-semibold text-texto">Gradual changes</legend>
        <label className="block max-w-[12rem]">
          <span className="etiqueta">Hidden start day</span>
          <input className="campo" type="number" min={6} max={30} value={dia_inicio} disabled={!gradual} onChange={(e) => setDiaInicio(e.target.value)} />
        </label>
        <div className="space-y-2">
          {cambios.map((cambio, indice) => (
            <div key={indice} className="grid grid-cols-[1fr_5.5rem_4.5rem_auto] gap-2 items-end">
              <label>
                {indice === 0 && <span className="etiqueta">Variable</span>}
                <select className="campo" value={cambio.campo} onChange={(e) => cambiar(indice, { campo: e.target.value })}>
                  {catalogo.campos.map((campo) => (
                    <option key={campo} value={campo}>
                      {nombres_campo[campo]?.nombre ?? campo} ({nombres_campo[campo]?.unidad ?? ''})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {indice === 0 && <span className="etiqueta">Change</span>}
                <input className="campo" type="number" step="any" value={Number.isNaN(cambio.delta) ? '' : cambio.delta} onChange={(e) => cambiar(indice, { delta: e.target.valueAsNumber })} />
              </label>
              <label>
                {indice === 0 && <span className="etiqueta">Ramp (d)</span>}
                <input className="campo" type="number" min={1} max={30} value={cambio.rampa} onChange={(e) => cambiar(indice, { rampa: Math.max(1, e.target.valueAsNumber || 1) })} />
              </label>
              <button
                type="button"
                className="boton border border-borde text-texto-3 hover:text-critico hover:border-critico px-2"
                aria-label={`Remove change ${indice + 1}`}
                onClick={() => setCambios((actuales) => actuales.filter((_, i) => i !== indice))}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          ))}
          <button
            type="button"
            className="boton border border-dashed border-borde text-texto-2 hover:text-acento hover:border-acento w-full"
            onClick={() => setCambios((actuales) => [...actuales, { campo: 'pulso_lpm', delta: 8, rampa: 3 }])}
          >
            <span className="material-symbols-outlined text-[18px]">add</span> Add a change
          </button>
          <p className="text-xs text-texto-3">The change grows linearly over the ramp days, then stays. Negative numbers lower the value.</p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="rounded border-borde bg-fondo text-serie" checked={con_sintomas} onChange={(e) => setConSintomas(e.target.checked)} />
          Logged symptoms
        </label>
        {con_sintomas && (
          <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
            <label>
              <span className="etiqueta">Days after start</span>
              <input className="campo" type="number" min={0} max={30} value={sintomas_desde} onChange={(e) => setSintomasDesde(e.target.value)} />
            </label>
            <label>
              <span className="etiqueta">Symptoms (comma separated)</span>
              <input className="campo" value={sintomas_texto} onChange={(e) => setSintomasTexto(e.target.value)} placeholder="dry cough, sore throat" />
            </label>
          </div>
        )}
        <label className="block">
          <span className="etiqueta">Expected diagnosis for prevention</span>
          <select className="campo" value={condicion_prevencion} disabled={!gradual} onChange={(e) => setCondicionPrevencion(e.target.value)}>
            <option value="">None (only check detection)</option>
            {catalogo.condiciones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-display font-semibold text-texto">Sudden event</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="rounded border-borde bg-fondo text-serie" checked={con_evento} onChange={(e) => setConEvento(e.target.checked)} />
          An event happens (accident, collapse…): it skips detection and goes straight to the AI doctor
        </label>
        {con_evento && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
              <label>
                <span className="etiqueta">Event day</span>
                <input className="campo" type="number" min={2} max={30} value={dia_evento} onChange={(e) => setDiaEvento(e.target.value)} />
              </label>
              <label>
                <span className="etiqueta">Predetermined conclusion</span>
                <select className="campo" value={evento_condicion} onChange={(e) => setEventoCondicion(e.target.value)}>
                  <option value="">Choose…</option>
                  {catalogo.condiciones.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="etiqueta">What the crew reports</span>
              <textarea className="campo min-h-20" maxLength={1000} value={evento_info} onChange={(e) => setEventoInfo(e.target.value)} />
            </label>
            <label className="block">
              <span className="etiqueta">Reported symptoms (comma separated)</span>
              <input className="campo" value={evento_sintomas} onChange={(e) => setEventoSintomas(e.target.value)} />
            </label>
            <div>
              <span className="etiqueta">Vital signs at the event (change from that day)</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {catalogo.signos_evento.map((signo) => (
                  <label key={signo}>
                    <span className="block text-[11px] text-texto-3 mb-0.5">{nombres_signo[signo] ?? signo}</span>
                    <input
                      className="campo"
                      type="number"
                      step="any"
                      value={evento_signos[signo] ?? ''}
                      placeholder="0"
                      onChange={(e) => setEventoSignos((actuales) => ({ ...actuales, [signo]: e.target.value }))}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="font-display font-semibold text-texto">Personal baseline of {astronauta.nombre}</legend>
        <p className="text-xs text-texto-3">Suggested values are simulated for this person, not taken from a medical record. Nutrition needs come from their real profile.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(nombres_base) as (keyof LineaBase)[]).map((clave) => (
            <label key={clave}>
              <span className="block text-[11px] text-texto-3 mb-0.5">{nombres_base[clave]}</span>
              <input
                className="campo"
                type="number"
                step="any"
                value={linea_base[clave] ?? ''}
                onChange={(e) => setLineaBase((actuales) => ({ ...actuales, [clave]: e.target.value }))}
              />
            </label>
          ))}
        </div>
      </fieldset>

        </div>
      </details>

      {extremos.length > 0 && (
        <div className="rounded-md border border-critico/60 bg-critico/10 p-3 text-sm space-y-2" role="alert">
          <p className="font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-critico">report</span>
            These numbers are not realistic for a human body
          </p>
          <ul className="list-disc pl-6 text-texto-2 space-y-0.5">
            {extremos.map((aviso) => (
              <li key={aviso}>{aviso}</li>
            ))}
          </ul>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded border-borde bg-fondo text-critico" checked={acepta_extremos} onChange={(e) => setAceptaExtremos(e.target.checked)} />
            I know. Use them anyway.
          </label>
        </div>
      )}

      {problemas.length > 0 && (
        <ul className="rounded-md border border-aviso/40 bg-aviso/10 p-3 text-sm text-texto space-y-1" role="status">
          {problemas.map((problema) => (
            <li key={problema} className="flex gap-2">
              <span className="material-symbols-outlined text-[18px] text-aviso">warning</span>
              {problema}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={`boton ${confirmando ? 'bg-critico text-white hover:bg-critico/90' : 'bg-serie text-fondo hover:bg-acento'}`}
          disabled={ocupado || problemas.length > 0 || (extremos.length > 0 && !acepta_extremos)}
          onClick={iniciar}
        >
          <span className="material-symbols-outlined text-[18px]">{confirmando ? 'restart_alt' : 'rocket_launch'}</span>
          {confirmando ? `Confirm: erase ${astronauta.nombre}'s data and start` : 'Start scenario'}
        </button>
        {confirmando && (
          <button type="button" className="boton text-texto-2 hover:text-texto" onClick={() => setConfirmando(false)}>
            Keep current data
          </button>
        )}
      </div>
    </section>
  );
}
