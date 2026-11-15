import { useRef, useState } from 'react';

export type Marca = { dia: number; tipo: 'cambio' | 'aviso' | 'evento' };
type Punto = { dia: number; valor: number };
type Referencia = { valor: number; etiqueta: string };

type Props = {
  titulo: string;
  unidad: string;
  puntos: Punto[];
  dias_totales: number;
  fechas: Record<number, string>;
  referencias?: Referencia[];
  marcas: Marca[];
  extra?: (Punto & { etiqueta: string }) | null;
  decimales?: number;
};

const ancho = 360;
const alto = 150;
const izquierda = 38;
const derecha = 10;
const arriba = 14;
const abajo = 22;

export const estilo_marca: Record<Marca['tipo'], { color: string; trazo: string; nombre: string }> = {
  cambio: { color: '#fab219', trazo: '5 3', nombre: 'Changes start (hidden)' },
  aviso: { color: '#3987e5', trazo: '', nombre: 'First watcher alert' },
  evento: { color: '#d03b3b', trazo: '1.5 3', nombre: 'Event' },
};

const orden_marca: Record<Marca['tipo'], number> = { aviso: 0, cambio: 1, evento: 2 };

const formato = (valor: number, decimales: number) => valor.toLocaleString('en-US', { maximumFractionDigits: decimales, minimumFractionDigits: decimales });

export default function Grafica({ titulo, unidad, puntos, dias_totales, fechas, referencias = [], marcas, extra, decimales = 0 }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const [encima, setEncima] = useState<number | null>(null);

  const valores = [...puntos.map((p) => p.valor), ...referencias.map((r) => r.valor), ...(extra ? [extra.valor] : [])];
  const minimo_bruto = valores.length ? Math.min(...valores) : 0;
  const maximo_bruto = valores.length ? Math.max(...valores) : 1;
  const holgura = Math.max((maximo_bruto - minimo_bruto) * 0.15, Math.abs(maximo_bruto) * 0.02, 10 ** -decimales);
  const minimo = minimo_bruto - holgura;
  const maximo = maximo_bruto + holgura;

  const x = (dia: number) => izquierda + ((dia - 1) / Math.max(1, dias_totales - 1)) * (ancho - izquierda - derecha);
  const y = (valor: number) => arriba + (1 - (valor - minimo) / (maximo - minimo)) * (alto - arriba - abajo);

  const linea = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.dia).toFixed(1)},${y(p.valor).toFixed(1)}`).join(' ');
  const marcas_y = [minimo + (maximo - minimo) * 0.1, (minimo + maximo) / 2, maximo - (maximo - minimo) * 0.1];

  const mover = (evento: React.PointerEvent<SVGSVGElement>) => {
    const caja = svg.current?.getBoundingClientRect();
    if (!caja || puntos.length === 0) return;
    const en_svg = ((evento.clientX - caja.left) / caja.width) * ancho;
    const dia = Math.round(((en_svg - izquierda) / (ancho - izquierda - derecha)) * (dias_totales - 1) + 1);
    const cercano = puntos.reduce((mejor, p) => (Math.abs(p.dia - dia) < Math.abs(mejor.dia - dia) ? p : mejor), puntos[0]!);
    setEncima(cercano.dia);
  };

  const punto_encima = puntos.find((p) => p.dia === encima) ?? null;
  const extra_encima = extra && extra.dia === encima ? extra : null;
  const ultimo = puntos.at(-1);
  const resumen = ultimo ? `${titulo}: latest ${formato(ultimo.valor, decimales)} ${unidad} on day ${ultimo.dia}` : `${titulo}: no data yet`;

  return (
    <figure className="tarjeta p-3">
      <figcaption className="flex items-baseline justify-between gap-2 mb-1">
        <span className="font-display text-sm font-semibold text-texto">{titulo}</span>
        <span className="font-mono text-[11px] text-texto-3">{unidad}</span>
      </figcaption>
      <svg
        ref={svg}
        viewBox={`0 0 ${ancho} ${alto}`}
        className="w-full h-auto touch-none select-none"
        role="img"
        aria-label={resumen}
        onPointerMove={mover}
        onPointerLeave={() => setEncima(null)}
      >
        {marcas_y.map((valor) => (
          <g key={valor}>
            <line x1={izquierda} x2={ancho - derecha} y1={y(valor)} y2={y(valor)} stroke="#1c2a3e" strokeWidth={1} />
            <text x={izquierda - 6} y={y(valor) + 3} textAnchor="end" fontSize={9} fill="#7d8ba0" fontFamily="JetBrains Mono">
              {formato(valor, decimales)}
            </text>
          </g>
        ))}
        {[1, Math.ceil(dias_totales / 2), dias_totales].map((dia) => (
          <text key={dia} x={x(dia)} y={alto - 6} textAnchor="middle" fontSize={9} fill="#7d8ba0" fontFamily="JetBrains Mono">
            d{dia}
          </text>
        ))}
        {referencias.map((referencia) => (
          <g key={referencia.etiqueta}>
            <line x1={izquierda} x2={ancho - derecha} y1={y(referencia.valor)} y2={y(referencia.valor)} stroke="#7d8ba0" strokeWidth={1} strokeDasharray="2 3" />
            <text x={ancho - derecha} y={y(referencia.valor) - 3} textAnchor="end" fontSize={9} fill="#a9b6c8" fontFamily="JetBrains Mono">
              {referencia.etiqueta}
            </text>
          </g>
        ))}
        {marcas.toSorted((a, b) => orden_marca[a.tipo] - orden_marca[b.tipo]).map((marca) => (
          <line
            key={`${marca.tipo}-${marca.dia}`}
            x1={x(marca.dia)}
            x2={x(marca.dia)}
            y1={arriba - 4}
            y2={alto - abajo}
            stroke={estilo_marca[marca.tipo].color}
            strokeWidth={marca.tipo === 'evento' ? 2 : 1.5}
            strokeDasharray={estilo_marca[marca.tipo].trazo}
            strokeLinecap="round"
          />
        ))}
        {puntos.length === 0 && (
          <text x={ancho / 2} y={alto / 2} textAnchor="middle" fontSize={11} fill="#7d8ba0">
            No data yet
          </text>
        )}
        <path d={linea} fill="none" stroke="#22a594" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {puntos.map((p) => (
          <circle key={p.dia} cx={x(p.dia)} cy={y(p.valor)} r={p.dia === encima ? 4.5 : 2.5} fill="#22a594" stroke="#0f1724" strokeWidth={2} />
        ))}
        {extra && (
          <g>
            <circle cx={x(extra.dia)} cy={y(extra.valor)} r={5} fill="#0f1724" stroke="#d03b3b" strokeWidth={2} />
            <text x={x(extra.dia) - 7} y={y(extra.valor) + 3} textAnchor="end" fontSize={9} fill="#e6edf6" fontFamily="JetBrains Mono">
              {extra.etiqueta}
            </text>
          </g>
        )}
        {punto_encima && (
          <g pointerEvents="none">
            <line x1={x(punto_encima.dia)} x2={x(punto_encima.dia)} y1={arriba} y2={alto - abajo} stroke="#a9b6c8" strokeWidth={1} />
            {(() => {
              const lineas = [
                `Day ${punto_encima.dia} · ${fechas[punto_encima.dia] ?? ''}`,
                `${formato(punto_encima.valor, decimales)} ${unidad}`,
                ...(extra_encima ? [`${extra_encima.etiqueta}: ${formato(extra_encima.valor, decimales)}`] : []),
              ];
              const caja_ancho = 132;
              const caja_alto = 14 + lineas.length * 13;
              const a_la_izquierda = x(punto_encima.dia) > ancho / 2;
              const caja_x = a_la_izquierda ? x(punto_encima.dia) - caja_ancho - 8 : x(punto_encima.dia) + 8;
              return (
                <g>
                  <rect x={caja_x} y={arriba} width={caja_ancho} height={caja_alto} rx={6} fill="#162132" stroke="#22324a" />
                  {lineas.map((texto, i) => (
                    <text
                      key={texto}
                      x={caja_x + 8}
                      y={arriba + 16 + i * 13}
                      fontSize={i === 1 ? 11 : 9.5}
                      fontWeight={i === 1 ? 600 : 400}
                      fill={i === 1 ? '#e6edf6' : '#a9b6c8'}
                      fontFamily="JetBrains Mono"
                    >
                      {texto}
                    </text>
                  ))}
                </g>
              );
            })()}
          </g>
        )}
      </svg>
    </figure>
  );
}
