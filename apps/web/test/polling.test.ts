import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sondear } from '../src/lib/polling';

type Oyente = () => void;

const pagina = { hidden: false, oyentes: new Set<Oyente>() };

beforeEach(() => {
  vi.useFakeTimers();
  pagina.hidden = false;
  pagina.oyentes.clear();
  vi.stubGlobal('document', {
    get hidden() {
      return pagina.hidden;
    },
    addEventListener: (_tipo: string, oyente: Oyente) => pagina.oyentes.add(oyente),
    removeEventListener: (_tipo: string, oyente: Oyente) => pagina.oyentes.delete(oyente),
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const cambiar_visibilidad = (oculta: boolean) => {
  pagina.hidden = oculta;
  for (const oyente of pagina.oyentes) oyente();
};

describe('sondear', () => {
  it('runs on every interval while the page is visible', () => {
    const tarea = vi.fn();
    sondear(tarea, () => 1000);
    vi.advanceTimersByTime(3500);
    expect(tarea).toHaveBeenCalledTimes(3);
  });

  it('stops asking while the page is hidden and catches up once when it comes back', () => {
    const tarea = vi.fn();
    sondear(tarea, () => 1000);
    cambiar_visibilidad(true);
    vi.advanceTimersByTime(10_000);
    expect(tarea).toHaveBeenCalledTimes(0);
    cambiar_visibilidad(false);
    expect(tarea).toHaveBeenCalledTimes(1);
  });

  it('refreshes right away when you come back to the tab, even on a slow pace', () => {
    const tarea = vi.fn();
    sondear(tarea, () => 60_000);
    cambiar_visibilidad(true);
    vi.advanceTimersByTime(6000);
    cambiar_visibilidad(false);
    expect(tarea).toHaveBeenCalledTimes(1);
    cambiar_visibilidad(true);
    cambiar_visibilidad(false);
    expect(tarea).toHaveBeenCalledTimes(1);
  });

  it('follows a pace that changes: fast while something is in progress, slow otherwise', () => {
    const tarea = vi.fn();
    let ritmo = 1000;
    sondear(tarea, () => ritmo);
    vi.advanceTimersByTime(2000);
    expect(tarea).toHaveBeenCalledTimes(2);
    ritmo = 5000;
    vi.advanceTimersByTime(4000);
    expect(tarea).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1000);
    expect(tarea).toHaveBeenCalledTimes(3);
  });

  it('stops for good when cancelled', () => {
    const tarea = vi.fn();
    const parar = sondear(tarea, () => 1000);
    parar();
    vi.advanceTimersByTime(5000);
    cambiar_visibilidad(false);
    expect(tarea).toHaveBeenCalledTimes(0);
    expect(pagina.oyentes.size).toBe(0);
  });
});
