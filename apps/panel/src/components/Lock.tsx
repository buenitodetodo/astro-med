import { useEffect, useState, type FormEvent } from 'react';
import { evento_bloqueo } from '../lib/api';
import Panel from './Panel';

type Estado = 'revisando' | 'bloqueado' | 'abierto';

export default function Candado() {
  const [estado, setEstado] = useState<Estado>('revisando');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    void (async () => {
      const respuesta = await fetch('/auth/session').catch(() => null);
      if (!respuesta || !respuesta.ok) return setEstado('abierto');
      const datos = (await respuesta.json().catch(() => ({ ok: true }))) as { ok?: boolean };
      setEstado(datos.ok ? 'abierto' : 'bloqueado');
    })();
    const bloquear = () => setEstado('bloqueado');
    window.addEventListener(evento_bloqueo, bloquear);
    return () => window.removeEventListener(evento_bloqueo, bloquear);
  }, []);

  const entrar = async (evento: FormEvent) => {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    const respuesta = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clave }),
    }).catch(() => null);
    setEnviando(false);
    if (respuesta?.ok) {
      setClave('');
      return setEstado('abierto');
    }
    if (respuesta?.status === 503) return setError('The panel has no password yet. (Code PANEL-503)');
    if (respuesta?.status === 401) return setError('Wrong password.');
    setError('Could not check the password. Try again. (Code PANEL-00)');
  };

  const salir = async () => {
    await fetch('/auth/logout', { method: 'POST' }).catch(() => null);
    setEstado('bloqueado');
  };

  if (estado === 'abierto') return <Panel salir={() => void salir()} />;

  return (
    <main className="min-h-screen grid place-items-center px-4">
      {estado === 'revisando' ? (
        <p className="text-texto-3 text-sm">Checking access…</p>
      ) : (
        <form onSubmit={entrar} className="tarjeta w-full max-w-sm p-6 space-y-4" aria-labelledby="titulo-acceso">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-acento text-[28px]">lock</span>
            <div>
              <h1 id="titulo-acceso" className="font-display text-lg font-bold">Mission Simulator</h1>
              <p className="text-xs text-texto-3">Restricted. Enter the team password to continue.</p>
            </div>
          </div>
          <label className="block">
            <span className="etiqueta">Password</span>
            <input
              className="campo"
              type="password"
              autoComplete="current-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoFocus
              required
            />
          </label>
          {error && (
            <p className="text-sm text-critico" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="boton w-full bg-serie text-fondo hover:bg-acento" disabled={enviando || !clave}>
            <span className="material-symbols-outlined text-[18px]">lock_open</span>
            {enviando ? 'Checking…' : 'Unlock'}
          </button>
        </form>
      )}
    </main>
  );
}
