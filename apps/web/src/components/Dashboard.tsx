import { useState, type FormEvent } from 'react';
import {
  describeError, hoy_utc, registrar_racion, registrar_sesion,
  type Color, type DatosTripulante, type Evaluacion, type Lectura, type Sesion,
} from '../lib/astro-med';
import { AvisoIA, useCasosIA } from './AiChecks';
import { Anillo, Barra, Baliza, Chip, Encabezado, Fuente, Icono, Sparkline, Tarjeta, estilo_color, hora_utc, numero } from './parts';

const nombres_parametros: Record<string, string> = {
  ingesta: 'Intake',
  ritmo_cardiaco: 'Heart',
  radiacion: 'Radiation',
  sueno: 'Sleep',
  temperatura: 'Temperature',
  presion: 'Blood pressure',
  musculo_hueso: 'Muscle & bone',
  spo2: 'SpO₂',
};

const textos_estado: Record<Color, string> = {
  verde: 'All nominal',
  amarillo: 'Caution',
  rojo: 'Alert',
  informativo: 'Informative',
  sin_datos: 'No data yet',
};

const saludo = () => {
  const hora = new Date().getHours();
  return hora < 12 ? 'Good morning' : hora < 19 ? 'Good afternoon' : 'Good evening';
};

const porcentaje = (valor: number, total: number) => (total > 0 ? (valor / total) * 100 : 0);

type Props = { datos: DatosTripulante; crew_id: string; recargar: () => Promise<void> };

export default function Dashboard({ datos, crew_id, recargar }: Props) {
  const { perfil, estado } = datos;
  const evaluacion = (parametro: string) =>
    estado.semaforo.find((e) => e.parametro === parametro) ?? ({ parametro, color: 'sin_datos', mensaje: '', datos: {}, fuente: '', alertas: 0 } as Evaluacion);
  const evaluados = estado.semaforo.filter((e) => e.color !== 'sin_datos' && e.color !== 'informativo');
  const nominales = evaluados.filter((e) => e.color === 'verde').length;
  const { casos } = useCasosIA(crew_id);

  return (
    <main className="lg:ml-[290px] min-h-screen bg-[#F4F7FB] px-4 pb-6 pt-[4.5rem] lg:p-8 space-y-7">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="text-[11px] font-label-caps font-bold tracking-widest text-slate-400 uppercase">PERSONAL HEALTH CENTER</div>
          <h1 className="text-3xl font-display-lg font-bold text-slate-800 tracking-tight mt-0.5">
            {saludo()}, {perfil.nombre.split(' ')[0]}.
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Displaying biometric telemetry for {perfil.nombre} ({perfil.rol}).
          </p>
        </div>
        <div className="flex items-center gap-5 bg-white py-3 px-5 rounded-2xl border border-slate-200/70 shadow-sm">
          <Anillo porcentaje={porcentaje(nominales, evaluados.length)} color={estilo_color[estado.color_general].trazo} className="w-14 h-14" grosor={3.5}>
            <span className="text-sm font-telemetry-lg font-bold text-slate-800">
              {nominales}/{evaluados.length}
            </span>
          </Anillo>
          <div className="space-y-1">
            <div className="text-[10px] font-label-caps font-bold tracking-widest text-slate-400 uppercase">WATCHER STATUS</div>
            <div className="flex items-center gap-2">
              <Baliza color={estado.color_general} />
              <span className="text-xs font-semibold text-slate-700">{textos_estado[estado.color_general]}</span>
              <span className={`inline-flex items-center text-[10px] font-label-caps font-bold px-2 py-0.5 rounded-full border ${estilo_color[estado.color_general].chip}`}>
                {estado.total_alertas === 0 ? `Updated ${hora_utc(datos.actualizado)}` : `${estado.total_alertas} alert${estado.total_alertas === 1 ? '' : 's'}`}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Nominal parameters out of those with data</div>
          </div>
        </div>
      </header>

      {datos.faltantes.length > 0 && (
        <div className="p-4 rounded-card bg-amber-50 border border-amber-200 text-sm text-amber-800" role="status">
          Some sections could not be updated and show no data for now. Reload the page to try again. (Code DATA-02-{datos.faltantes.join('-')})
        </div>
      )}

      <AvisoIA casos={casos} al_abrir={(id) => location.assign(`/history?caso=${id}`)} />

      <Vigilante datos={datos} />

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Nutricion datos={datos} crew_id={crew_id} recargar={recargar} evaluacion={evaluacion('ingesta')} />
        <MusculoHueso datos={datos} crew_id={crew_id} recargar={recargar} evaluacion={evaluacion('musculo_hueso')} />
      </section>

      <SignosVitales datos={datos} evaluacion={evaluacion} />

      <section className="grid grid-cols-12 gap-6 items-stretch">
        <Cardiaco datos={datos} evaluacion={evaluacion('ritmo_cardiaco')} temperatura={evaluacion('temperatura')} />
        <Sueno datos={datos} evaluacion={evaluacion('sueno')} />
      </section>

      <footer className="text-[11px] text-slate-400 pb-4">
        Experimental demonstrator. Not a medical device and not endorsed or certified by NASA. Crew, mission and simulated values are fictional.
      </footer>
    </main>
  );
}

function Vigilante({ datos }: { datos: DatosTripulante }) {
  const { estado } = datos;
  const [abierto, setAbierto] = useState(false);
  const recomendacion = estado.recomendacion_del_dia;
  const color_banner: Color = estado.alertas[0]?.gravedad ?? 'verde';

  return (
    <Tarjeta className="p-5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-center gap-3 lg:w-60 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-200/70">
            <Icono nombre="radar" className="text-[22px]" />
          </div>
          <div>
            <div className="text-[11px] font-label-caps font-bold tracking-widest text-slate-400 uppercase">WATCHER</div>
            <h3 className="text-base font-bold text-slate-800">Recommendation of the day</h3>
          </div>
        </div>
        <div className={`flex-1 p-3 rounded-xl border text-sm ${estilo_color[color_banner].chip}`}>
          <div className="font-semibold">{recomendacion.mensaje}</div>
          {recomendacion.motivo && <div className="text-xs opacity-80 mt-0.5">{recomendacion.motivo}</div>}
          {recomendacion.fuente && <div className="text-[10px] opacity-70 mt-1">Source: {recomendacion.fuente}</div>}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
        {estado.semaforo.map((e) => (
          <div key={e.parametro} title={`${e.mensaje}\nSource: ${e.fuente}`} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${estilo_color[e.color].punto}`} />
            <div className="leading-tight min-w-0">
              <div className="text-[11px] font-semibold text-slate-700 truncate">{nombres_parametros[e.parametro] ?? e.parametro}</div>
              <div className={`text-[9px] font-label-caps font-bold uppercase ${estilo_color[e.color].texto}`}>{estilo_color[e.color].etiqueta}</div>
            </div>
          </div>
        ))}
      </div>
      {estado.alertas.length > 0 && (
        <div className="mt-3">
          <button type="button" onClick={() => setAbierto(!abierto)} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800">
            <span>{abierto ? 'Hide' : 'Show'} {estado.alertas.length} active alert{estado.alertas.length === 1 ? '' : 's'}</span>
            <Icono nombre={abierto ? 'expand_less' : 'expand_more'} className="text-[16px]" />
          </button>
          {abierto && (
            <ul className="mt-2 space-y-1.5">
              {estado.alertas.map((alerta) => (
                <li key={`${alerta.codigo}-${alerta.fecha}`} className="flex items-start gap-2 text-xs text-slate-700 p-2 rounded-lg border border-slate-100 bg-white">
                  <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${estilo_color[alerta.gravedad].punto}`} />
                  <div>
                    <div className="font-medium">{alerta.mensaje}</div>
                    <div className="text-slate-500">{alerta.recomendacion}</div>
                    <div className="text-[10px] text-slate-400">Source: {alerta.fuente}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Tarjeta>
  );
}

type PropsTarjeta = { datos: DatosTripulante; crew_id: string; recargar: () => Promise<void>; evaluacion: Evaluacion };

function Nutricion({ datos, crew_id, recargar, evaluacion }: PropsTarjeta) {
  const { requerimientos } = datos.nutricion;
  const { totales, comidas } = datos.comidas;
  const dia_hoy = datos.dias.find((dia) => dia.fecha === hoy_utc());
  const requerimiento = requerimientos.energia_kcal + requerimientos.kcal_extra_por_hora_caminata * (dia_hoy?.caminata_espacial_horas ?? 0);
  const avance = porcentaje(totales.kcal, requerimiento);
  const [codigo, setCodigo] = useState('');
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);

  const registrar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!codigo.trim()) return;
    setEnviando(true);
    try {
      const comida = await registrar_racion(crew_id, codigo.trim());
      setMensaje({ ok: true, texto: `+${numero(comida.kcal)} kcal logged` });
      setCodigo('');
      await recargar();
    } catch (e) {
      setMensaje({ ok: false, texto: e instanceof Error && e.message === 'unknown_ration' ? 'Unknown ration code' : describeError(e) });
    } finally {
      setEnviando(false);
    }
  };

  const macros = [
    { nombre: 'Protein', valor: totales.proteina_g, rango: requerimientos.proteina_g, color: '#F59E0B', texto: 'text-amber-600' },
    { nombre: 'Carbohydrates', valor: totales.carbohidratos_g, rango: requerimientos.carbohidratos_g, color: '#2DD4BF', texto: 'text-teal-600' },
    { nombre: 'Fats', valor: totales.grasas_g, rango: requerimientos.grasas_g, color: '#7C6FE8', texto: 'text-indigo-600' },
  ];

  return (
    <Tarjeta className="flex flex-col justify-between">
      <div className="space-y-5">
        <Encabezado icono="restaurant" fondo="bg-amber-50 text-amber-600 border-amber-200/60" categoria="NUTRITION" titulo="Calorie Intake" extra={<Chip color={evaluacion.color} />} />
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          <div className="sm:col-span-5 flex flex-col items-center justify-center p-2">
            <Anillo porcentaje={avance} color="#F59E0B">
              <span className="text-2xl font-telemetry-lg font-bold text-slate-800 tracking-tight">{numero(totales.kcal)}</span>
              <span className="text-[11px] font-label-sm text-slate-400 -mt-1">of {numero(requerimiento)} kcal</span>
              <span className="text-[10px] font-label-caps font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1">{Math.round(avance)}% today</span>
            </Anillo>
          </div>
          <div className="sm:col-span-7 space-y-3 pl-0 sm:pl-2">
            {macros.map((macro) => (
              <div key={macro.nombre}>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-medium text-slate-700">{macro.nombre}</span>
                  <span className="font-label-sm text-slate-500">
                    <strong>{numero(macro.valor)} g</strong> / {numero(macro.rango.minimo)}–{numero(macro.rango.maximo)} g
                    <span className={`font-bold ml-1 ${macro.texto}`}>({Math.round(porcentaje(macro.valor, macro.rango.minimo))}%)</span>
                  </span>
                </div>
                <Barra porcentaje={porcentaje(macro.valor, macro.rango.minimo)} color={macro.color} />
              </div>
            ))}
            <Fuente texto={datos.nutricion.fuente_macros} />
          </div>
        </div>
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-label-caps font-bold text-slate-500 uppercase tracking-wider">Log Mission Ration</span>
            {mensaje && (
              <span className={`text-[10px] font-label-caps font-semibold px-2 py-0.5 rounded ${mensaje.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{mensaje.texto}</span>
            )}
          </div>
          <form className="flex items-center gap-2" onSubmit={registrar}>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="flex-1 pl-3 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-label-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 uppercase tracking-wide"
              placeholder="Meal code (e.g. ARES-L3-042)"
              aria-label="Ration code"
            />
            <button disabled={enviando} className="px-3.5 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-amber-600 disabled:opacity-60 text-white font-semibold text-xs tracking-wide shadow-sm active:scale-95 transition-all flex items-center gap-1 shrink-0" type="submit">
              <Icono nombre="add" className="text-[16px]" />
              <span>Add</span>
            </button>
          </form>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {comidas.length === 0 && <span className="text-[11px] text-slate-400">No meals logged today.</span>}
            {comidas.map((comida) => (
              <span key={comida.id} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-label-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{comida.codigo ?? comida.nombre}</span> · {comida.comido_en.slice(11, 16)} · +{numero(comida.kcal)} kcal
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200/50 flex items-center gap-2 text-xs text-amber-900 font-medium">
        <Icono nombre="water_drop" className="text-[18px] text-amber-600 shrink-0" />
        <span>
          Fluids today: <strong>{numero(totales.liquidos_ml)} ml</strong> of {numero(requerimientos.liquidos_ml)} ml required ({datos.nutricion.fuente}).
        </span>
      </div>
    </Tarjeta>
  );
}

const equipos: Sesion['equipo'][] = ['ARED', 'T2', 'CEVIS'];

function MusculoHueso({ datos, crew_id, recargar, evaluacion }: PropsTarjeta) {
  const minutos = Number(evaluacion.datos.minutos_7_dias ?? 0);
  const minimo_minutos = Number(evaluacion.datos.minutos_minimos ?? 450);
  const dias_ejercicio = Number(evaluacion.datos.dias_con_ejercicio ?? 0);
  const minimo_dias = Number(evaluacion.datos.dias_minimos ?? 6);
  const riesgo = evaluacion.color === 'sin_datos' ? null : Math.round(Math.max(minimo_minutos > 0 ? 1 - minutos / minimo_minutos : 0, minimo_dias > 0 ? 1 - dias_ejercicio / minimo_dias : 0, 0) * 100);
  const dia_hoy = datos.dias.find((dia) => dia.fecha === hoy_utc());
  const sesiones_hoy = dia_hoy?.ejercicio ?? [];
  const [equipo, setEquipo] = useState<Sesion['equipo']>('ARED');
  const [duracion, setDuracion] = useState(45);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const etiqueta = evaluacion.color === 'verde' ? 'In target' : evaluacion.color === 'amarillo' ? 'Below target' : 'No data';

  const registrar = async (evento: FormEvent) => {
    evento.preventDefault();
    setEnviando(true);
    try {
      await registrar_sesion(crew_id, dia_hoy, { equipo, minutos: duracion });
      setError(null);
      await recargar();
    } catch (e) {
      setError(describeError(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta className="flex flex-col justify-between">
      <div className="space-y-5">
        <Encabezado icono="fitness_center" fondo="bg-teal-50 text-teal-600 border-teal-200/60" categoria="MUSCULOSKELETAL" titulo="Bone & Muscle Loss Risk" extra={<Chip color={evaluacion.color} texto={etiqueta} />} />
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          <div className="sm:col-span-5 flex flex-col items-center justify-center p-2">
            <Anillo porcentaje={riesgo ?? 0} color={estilo_color[evaluacion.color].trazo}>
              <span className="text-2xl font-telemetry-lg font-bold text-slate-800 tracking-tight">{riesgo === null ? '—' : `${riesgo}%`}</span>
              <span className="text-[11px] font-label-sm text-slate-400 -mt-0.5 text-center leading-tight px-2">below exercise target</span>
              <span className={`text-[10px] font-label-caps font-semibold px-2 py-0.5 rounded-full mt-1 border ${estilo_color[evaluacion.color].chip}`}>{etiqueta}</span>
            </Anillo>
          </div>
          <div className="sm:col-span-7 space-y-3 pl-0 sm:pl-2">
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-slate-700">Exercise minutes</span>
                <span className="font-label-sm text-slate-500"><strong className="text-slate-800">{numero(minutos)}</strong> / {numero(minimo_minutos)} min</span>
              </div>
              <Barra porcentaje={porcentaje(minutos, minimo_minutos)} color="#10B981" />
            </div>
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-slate-700">Days with exercise</span>
                <span className="font-label-sm text-slate-500"><strong className="text-slate-800">{dias_ejercicio}</strong> / {minimo_dias} of 7</span>
              </div>
              <Barra porcentaje={porcentaje(dias_ejercicio, minimo_dias)} color="#10B981" />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              0% means this week met the ISS exercise target ({numero(minimo_minutos)} min on {minimo_dias} days). The higher the number, the less protected bones and muscles are. Risk estimate, not a measurement.
            </p>
            <Fuente texto={evaluacion.fuente} />
          </div>
        </div>
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-label-caps font-bold text-slate-500 uppercase tracking-wider">Log exercise session</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${sesiones_hoy.length > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200/60'}`}>
              {sesiones_hoy.length > 0 ? 'Done today' : 'Pending'}
            </span>
          </div>
          <form className="flex flex-wrap items-center gap-2" onSubmit={registrar}>
            <select value={equipo} onChange={(e) => setEquipo(e.target.value as Sesion['equipo'])} aria-label="Equipment" className="py-1.5 pl-3 pr-8 bg-white border border-slate-300 rounded-lg text-xs font-label-sm text-slate-800 focus:ring-1 focus:ring-amber-500 focus:border-amber-500">
              {equipos.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
            </select>
            <input type="number" min={1} max={600} value={duracion} onChange={(e) => setDuracion(Number(e.target.value))} aria-label="Minutes" className="w-20 py-1.5 px-3 bg-white border border-slate-300 rounded-lg text-xs font-label-sm text-slate-800 focus:ring-1 focus:ring-amber-500 focus:border-amber-500" />
            <span className="text-xs text-slate-500">min</span>
            <button type="submit" disabled={enviando || duracion <= 0} className="ml-auto bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-medium text-xs rounded-lg px-3 py-2 flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98]">
              <Icono nombre="check" className="text-[16px]" />
              <span>Log session</span>
            </button>
          </form>
          {error && <div className="text-[11px] text-rose-600">{error}</div>}
          <div className="flex flex-wrap gap-1.5">
            {sesiones_hoy.length === 0 && <span className="text-[11px] text-slate-400">No sessions logged today. ARED, T2 and CEVIS are the ISS exercise devices (NTRS 20230004166).</span>}
            {sesiones_hoy.map((sesion, indice) => (
              <span key={indice} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-label-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {sesion.equipo} · {sesion.minutos} min
              </span>
            ))}
          </div>
        </div>
      </div>
    </Tarjeta>
  );
}

type Rango = 'hoy' | '7' | '30';

const filtrar_lecturas = (lecturas: Lectura[], rango: Rango) => {
  const hoy = hoy_utc();
  const desde = rango === 'hoy' ? hoy : new Date(Date.now() - (Number(rango) - 1) * 86_400_000).toISOString().slice(0, 10);
  return lecturas.filter((lectura) => lectura.registrado_en.slice(0, 10) >= desde).toReversed();
};

function SignosVitales({ datos, evaluacion }: { datos: DatosTripulante; evaluacion: (parametro: string) => Evaluacion }) {
  const [rango, setRango] = useState<Rango>('7');
  const lecturas = filtrar_lecturas(datos.lecturas, rango);
  const serie = (campo: keyof Lectura) => lecturas.map((l) => l[campo]).filter((v): v is number => typeof v === 'number');
  const pulso = serie('pulso_lpm');
  const spo2 = serie('spo2');
  const sistolica = serie('presion_sistolica');
  const ultima = datos.lecturas[0];
  const ultima_presion = datos.lecturas.find((l) => l.presion_sistolica !== null);
  const fuente = ultima?.fuente;
  const radiacion = evaluacion('radiacion');
  const desde_dosis = rango === 'hoy' ? hoy_utc() : new Date(Date.now() - (Number(rango) - 1) * 86_400_000).toISOString().slice(0, 10);
  const dosis = datos.dosis.filter((d) => d.observedAt.slice(0, 10) >= desde_dosis).toReversed().map((d) => d.value);
  const promedio = (valores: number[]) => valores.reduce((s, v) => s + v, 0) / (valores.length || 1);

  const tarjetas = [
    {
      clave: 'pulso', titulo: 'HEART RATE', icono: 'favorite', fondo: 'bg-rose-50 text-rose-500 border-rose-100', color: '#F43F5E',
      valor: ultima?.pulso_lpm ?? null, unidad: 'bpm', serie: pulso, estado: evaluacion('ritmo_cardiaco').color,
      pie: pulso.length ? <>Range: <span className="text-slate-600 font-semibold">{Math.min(...pulso)} – {Math.max(...pulso)} bpm</span></> : 'No readings in this range',
    },
    {
      clave: 'spo2', titulo: 'BLOOD OXYGEN', icono: 'water_drop', fondo: 'bg-teal-50 text-teal-600 border-teal-100', color: '#0D9488',
      valor: ultima?.spo2 ?? null, unidad: '%', serie: spo2, estado: evaluacion('spo2').color,
      pie: spo2.length ? <>Average: <span className="text-slate-600 font-semibold">{numero(promedio(spo2), 1)}%</span></> : 'No readings in this range',
    },
    {
      clave: 'presion', titulo: 'BLOOD PRESSURE', icono: 'monitor_heart', fondo: 'bg-blue-50 text-blue-600 border-blue-100', color: '#2563EB',
      valor: ultima_presion ? `${ultima_presion.presion_sistolica}/${ultima_presion.presion_diastolica}` : null, unidad: 'mmHg', serie: sistolica, estado: evaluacion('presion').color,
      pie: ultima_presion ? <>Last reading: <span className="text-slate-600 font-semibold">{ultima_presion.registrado_en.slice(5, 10)} {hora_utc(ultima_presion.registrado_en)}</span></> : 'No readings',
    },
    {
      clave: 'radiacion', titulo: 'RADIATION EXPOSURE', icono: 'arrows_outward', fondo: 'bg-amber-50 text-amber-600 border-amber-100', color: '#D97706',
      valor: radiacion.datos.dosis_dia_msv ?? null, unidad: 'mSv', serie: dosis, estado: radiacion.color, etiqueta: radiacion.color === 'verde' ? 'Safe' : undefined,
      pie: radiacion.datos.dosis_acumulada_msv !== undefined
        ? <>Accumulated: <span className="text-slate-600 font-semibold">{radiacion.datos.dosis_acumulada_msv} mSv ({radiacion.datos.porcentaje_limite_carrera}% of {radiacion.datos.limite_carrera_msv} mSv)</span></>
        : 'No dose recorded',
    },
  ];

  return (
    <section id="biometrics" className="space-y-4 scroll-mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800">Vital Signs</h2>
          {fuente && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-label-caps font-semibold border ${fuente === 'simulated' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${fuente === 'simulated' ? 'bg-slate-400' : 'bg-emerald-500 animate-ping'}`} />
              {fuente === 'simulated' ? 'Simulated data' : `Source: ${fuente}`}
            </span>
          )}
        </div>
        <div className="inline-flex p-1 bg-slate-200/60 rounded-xl text-xs font-semibold text-slate-600" role="tablist">
          {(['hoy', '7', '30'] as const).map((opcion) => (
            <button key={opcion} type="button" role="tab" aria-selected={rango === opcion} onClick={() => setRango(opcion)} className={`px-3.5 py-1 rounded-lg transition-all ${rango === opcion ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-900'}`}>
              {opcion === 'hoy' ? 'Today' : `${opcion} Days`}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {tarjetas.map((t) => (
          <article key={t.clave} className="bg-white rounded-card border border-slate-200/70 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${t.fondo}`}>
                    <Icono nombre={t.icono} className="text-[20px]" />
                  </div>
                  <span className="text-[11px] font-label-caps font-bold tracking-widest text-slate-400 uppercase">{t.titulo}</span>
                </div>
                <Chip color={t.estado} texto={'etiqueta' in t ? t.etiqueta : undefined} />
              </div>
              <div className="flex items-baseline gap-1.5 my-2">
                <span className="text-3xl font-telemetry-lg font-bold text-slate-800">{t.valor ?? '—'}</span>
                <span className="text-xs font-semibold text-slate-400">{t.unidad}</span>
              </div>
              <Sparkline valores={t.serie} color={t.color} id={`grad-${t.clave}`} />
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-label-sm text-slate-400">{t.pie}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Cardiaco({ datos, evaluacion, temperatura }: { datos: DatosTripulante; evaluacion: Evaluacion; temperatura: Evaluacion }) {
  const ultima = datos.lecturas.find((l) => l.pulso_lpm !== null || l.hrv_ms !== null);
  const ultima_temperatura = datos.lecturas.find((l) => l.temperatura_c !== null);
  const parametros = [
    { nombre: 'Heart Rate', valor: ultima?.pulso_lpm != null ? `${ultima.pulso_lpm} bpm` : '—', clase: 'text-slate-800' },
    { nombre: 'HRV SDNN', valor: ultima?.hrv_ms != null ? `${ultima.hrv_ms} ms` : '—', clase: estilo_color[evaluacion.color].texto },
    { nombre: 'Temperature', valor: ultima_temperatura?.temperatura_c != null ? `${numero(ultima_temperatura.temperatura_c, 1)} °C` : '—', clase: estilo_color[temperatura.color].texto },
    { nombre: 'Rhythm', valor: '—', clase: 'text-slate-400' },
    { nombre: 'PR / QRS', valor: '—', clase: 'text-slate-400' },
    { nombre: 'QTc Int', valor: '—', clase: 'text-slate-400' },
  ];

  return (
    <article className="col-span-12 xl:col-span-7 bg-white rounded-card border border-slate-200/70 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Encabezado icono="ecg_heart" fondo="bg-blue-50 text-blue-600 border-blue-200/60" categoria="CARDIAC TELEMETRY" titulo="Lead II Electrocardiogram" />
          <Chip color={evaluacion.color} />
        </div>
        <div className="relative w-full h-44 rounded-xl overflow-hidden ecg-grid bg-[#0d1e38] border border-cyan-900/40 shadow-inner flex flex-col items-center justify-center text-center gap-1">
          <Icono nombre="sensors_off" className="text-[28px] text-cyan-300/70" />
          <div className="text-sm font-semibold text-cyan-100">No ECG device connected</div>
          <div className="text-[11px] text-cyan-300/70 max-w-sm">The waveform, rhythm and intervals appear here only with a real ECG stream. Heart rate and HRV below come from the vitals log.</div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {parametros.map((p) => (
            <div key={p.nombre} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <div className="text-[9px] font-label-caps text-slate-400 uppercase tracking-wider">{p.nombre}</div>
              <div className={`text-sm font-telemetry-lg font-bold mt-0.5 ${p.clase}`}>{p.valor}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-3">{evaluacion.mensaje}</p>
        <Fuente texto={evaluacion.fuente} />
      </div>
    </article>
  );
}

function Sueno({ datos, evaluacion }: { datos: DatosTripulante; evaluacion: Evaluacion }) {
  const noches = datos.dias.filter((d) => d.sueno_horas !== null).slice(-7);
  const ultima = noches.at(-1);
  const horas = ultima?.sueno_horas ?? null;
  const calidad = ultima?.sueno_calidad ?? null;
  const deuda = evaluacion.datos.deuda_7_dias_horas;
  const maximo = 10;
  const umbral_fatiga = 6;
  const programadas = Number(evaluacion.datos.horas_programadas ?? 8.5);

  return (
    <article className="col-span-12 xl:col-span-5 bg-white rounded-card border border-slate-200/70 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="mb-3">
          <Encabezado
            icono="bedtime"
            fondo="bg-purple-50 text-[#7C6FE8] border-purple-200/60"
            categoria="REST"
            titulo="Sleep & Circadian Rhythm"
            extra={calidad !== null ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-[#7C6FE8] border border-purple-200/60">
                <Icono nombre="auto_awesome" className="text-[14px]" />
                Self-reported quality {calidad}/5
              </span>
            ) : <Chip color={evaluacion.color} />}
          />
        </div>
        <div className="flex items-baseline gap-6 mb-3">
          <div>
            <div className="text-[10px] font-label-caps text-slate-400 uppercase">LAST NIGHT</div>
            <div className="text-2xl font-telemetry-lg font-bold text-slate-800">
              {horas === null ? '—' : <>{Math.floor(horas)}<span className="text-sm font-normal text-slate-500 ml-1 mr-2">h</span>{Math.round((horas % 1) * 60)}<span className="text-sm font-normal text-slate-500 ml-1">m</span></>}
            </div>
          </div>
          <div className="border-l border-slate-200 pl-6">
            <div className="text-[10px] font-label-caps text-slate-400 uppercase">7-DAY SLEEP DEBT</div>
            <span className="text-2xl font-telemetry-lg font-bold text-slate-800">{deuda ?? '—'}<span className="text-sm font-normal text-slate-500 ml-0.5">h</span></span>
          </div>
          <div className="ml-auto"><Chip color={evaluacion.color} /></div>
        </div>
        <div className="relative bg-slate-50/70 rounded-xl p-3 border border-slate-200/60 my-1">
          <div className="text-[9px] font-label-caps text-slate-400 font-semibold mb-2">HOURS PER NIGHT · LAST 7 LOGGED</div>
          <div className="relative h-36">
            <div className="absolute inset-x-0 border-t border-dashed border-rose-300" style={{ bottom: `${(umbral_fatiga / maximo) * 100}%` }}>
              <span className="absolute -top-3 right-0 text-[9px] font-label-caps text-rose-500">≤6 h fatigue</span>
            </div>
            <div className="absolute inset-x-0 border-t border-dashed border-purple-300" style={{ bottom: `${(programadas / maximo) * 100}%` }}>
              <span className="absolute -top-3 left-0 text-[9px] font-label-caps text-purple-500">{programadas} h scheduled</span>
            </div>
            <div className="absolute inset-0 flex items-end justify-between gap-2 px-1">
              {noches.map((noche) => (
                <div key={noche.fecha} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    className={`w-full max-w-8 rounded-t-md ${noche.sueno_horas !== null && noche.sueno_horas <= umbral_fatiga ? 'bg-rose-400' : 'bg-[#7C6FE8]'}`}
                    style={{ height: `${((noche.sueno_horas ?? 0) / maximo) * 100}%` }}
                    title={`${noche.fecha}: ${noche.sueno_horas} h`}
                  />
                  <span className="text-[9px] font-label-sm text-slate-400 mt-1">{noche.fecha.slice(8, 10)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">{evaluacion.mensaje} Sleep stages need a sleep sensor and are not shown.</p>
      </div>
      <Fuente texto={evaluacion.fuente} />
    </article>
  );
}
