type Props = {
  texto: string;
  detalle?: string;
  tamano?: 'pagina' | 'seccion' | 'linea';
  tono?: 'claro' | 'oscuro';
};

const medidas = { pagina: 'w-20 h-20', seccion: 'w-12 h-12', linea: 'w-6 h-6' };

export function Orbita({ clase = 'w-12 h-12' }: { clase?: string }) {
  return (
    <span className={`relative inline-flex items-center justify-center shrink-0 ${clase}`} aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full cargando-orbita" viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" strokeWidth="1.4">
        <ellipse cx="12" cy="12" rx="10" ry="3.9" strokeOpacity="0.85" transform="rotate(30 12 12)" />
      </svg>
      <svg className="absolute inset-0 w-full h-full cargando-orbita-inversa" viewBox="0 0 24 24" fill="none" stroke="#4F7CF0" strokeWidth="1.4">
        <ellipse cx="12" cy="12" rx="10" ry="3.9" strokeOpacity="0.7" transform="rotate(-30 12 12)" />
      </svg>
      <span className="relative w-[22%] h-[22%]">
        <span className="absolute inset-0 rounded-full bg-[#2DD4BF] cargando-pulso" />
        <span className="absolute inset-0 rounded-full bg-[#2DD4BF]" />
      </span>
    </span>
  );
}

export default function Cargando({ texto, detalle, tamano = 'seccion', tono = 'claro' }: Props) {
  const color_texto = tono === 'oscuro' ? 'text-slate-300' : 'text-slate-500';
  if (tamano === 'linea') {
    return (
      <span className={`inline-flex items-center gap-2 text-xs font-label-caps font-semibold tracking-widest uppercase ${color_texto}`} role="status">
        <Orbita clase={medidas.linea} />
        {texto}
      </span>
    );
  }
  return (
    <div
      className={`flex flex-col items-center justify-center text-center gap-3 ${tamano === 'pagina' ? 'min-h-[60vh]' : 'py-8'}`}
      role="status"
      aria-live="polite"
    >
      <Orbita clase={medidas[tamano]} />
      <div className={`text-[11px] font-label-caps font-bold tracking-[0.2em] uppercase ${color_texto}`}>{texto}</div>
      {detalle && <div className="text-xs text-slate-400 max-w-xs">{detalle}</div>}
    </div>
  );
}
