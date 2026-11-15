import type { ReactNode } from 'react';
import type { Color } from '../lib/astro-med';

export const Icono = ({ nombre, className = '' }: { nombre: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`} aria-hidden="true">
    {nombre}
  </span>
);

export const Anillo = ({ porcentaje, color, className = 'w-36 h-36', grosor = 3.2, children }: {
  porcentaje: number;
  color: string;
  className?: string;
  grosor?: number;
  children?: ReactNode;
}) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
      <circle cx="18" cy="18" fill="transparent" r="15.5" stroke="#F1F5F9" strokeWidth="3" />
      <circle
        cx="18"
        cy="18"
        fill="transparent"
        r="15.5"
        stroke={color}
        strokeDasharray={`${Math.max(0, Math.min(100, porcentaje)) * 0.974}, 100`}
        strokeLinecap="round"
        strokeWidth={grosor}
        className="transition-all duration-500"
      />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
  </div>
);

export const Barra = ({ porcentaje, color }: { porcentaje: number; color: string }) => (
  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, porcentaje))}%`, backgroundColor: color }} />
  </div>
);

export const Sparkline = ({ valores, color, id }: { valores: number[]; color: string; id: string }) => {
  if (valores.length < 2) {
    return <div className="h-10 w-full my-2 flex items-center text-[11px] font-label-sm text-slate-300">Not enough readings</div>;
  }
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const rango = maximo - minimo || 1;
  const puntos = valores.map((valor, indice) => [(indice / (valores.length - 1)) * 100, 26 - ((valor - minimo) / rango) * 20] as const);
  const linea = puntos.map(([x, y], indice) => `${indice === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <div className="h-10 w-full my-2">
      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 30">
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${linea} L100,30 L0,30 Z`} fill={`url(#${id})`} />
        <path d={linea} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
};

export const estilo_color: Record<Color, { chip: string; punto: string; texto: string; etiqueta: string; trazo: string }> = {
  verde: { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', punto: 'bg-emerald-500', texto: 'text-emerald-600', etiqueta: 'Normal', trazo: '#10B981' },
  amarillo: { chip: 'bg-amber-50 text-amber-700 border-amber-200', punto: 'bg-amber-500', texto: 'text-amber-600', etiqueta: 'Caution', trazo: '#F59E0B' },
  rojo: { chip: 'bg-rose-50 text-rose-700 border-rose-200', punto: 'bg-rose-500', texto: 'text-rose-600', etiqueta: 'Alert', trazo: '#F0566A' },
  informativo: { chip: 'bg-blue-50 text-blue-700 border-blue-200', punto: 'bg-blue-500', texto: 'text-blue-600', etiqueta: 'Info', trazo: '#4F7CF0' },
  sin_datos: { chip: 'bg-slate-50 text-slate-500 border-slate-200', punto: 'bg-slate-400', texto: 'text-slate-500', etiqueta: 'No data', trazo: '#94A3B8' },
};

export const Chip = ({ color, texto }: { color: Color; texto?: string }) => (
  <span className={`text-[10px] font-label-caps font-bold px-2 py-0.5 rounded border ${estilo_color[color].chip}`}>{texto ?? estilo_color[color].etiqueta}</span>
);

export const Baliza = ({ color }: { color: Color }) => (
  <span className="flex h-2 w-2 relative">
    <span className={`pulse-beacon absolute inline-flex h-full w-full rounded-full opacity-75 ${estilo_color[color].punto}`} />
    <span className={`relative inline-flex rounded-full h-2 w-2 ${estilo_color[color].punto}`} />
  </span>
);

export const Encabezado = ({ icono, fondo, categoria, titulo, extra }: {
  icono: string;
  fondo: string;
  categoria: string;
  titulo: string;
  extra?: ReactNode;
}) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${fondo}`}>
        <Icono nombre={icono} className="text-[22px]" />
      </div>
      <div>
        <div className="text-[11px] font-label-caps font-bold tracking-widest text-slate-400 uppercase">{categoria}</div>
        <h3 className="text-base font-bold text-slate-800">{titulo}</h3>
      </div>
    </div>
    {extra}
  </div>
);

export const Tarjeta = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <article className={`bg-white rounded-card border border-slate-200/70 p-6 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>{children}</article>
);

export const Fuente = ({ texto }: { texto: string }) => <p className="text-[10px] text-slate-400 font-body-sm leading-relaxed">Source: {texto}</p>;

export const hora_utc = (iso: string) => `${iso.slice(11, 16)} UTC`;

export const numero = (valor: number, decimales = 0) =>
  valor.toLocaleString('en-US', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
