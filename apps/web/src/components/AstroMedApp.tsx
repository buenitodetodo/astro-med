import { useState } from 'react';
import { getCrewId, setCrewId } from '../lib/api';
import { useEstadosTripulacion, useTripulante } from '../lib/astro-med';
import Asistente from './Assistant';
import Dashboard from './Dashboard';
import Historial from './History';
import Emergencia, { type Emergencia as EmergenciaActiva } from './Emergency';
import Sidebar from './Sidebar';
import Cargando from './Loading';

export default function AstroMedApp({ pagina }: { pagina: 'summary' | 'assistant' | 'history' }) {
  const [crew_id, setCrew] = useState(getCrewId());
  const [sos, setSos] = useState<{ inicial?: EmergenciaActiva } | null>(null);
  const { datos, error, recargar } = useTripulante(crew_id);
  const [me_previo, setMePrevio] = useState(datos?.me ?? null);
  if (datos?.me && datos.me !== me_previo) setMePrevio(datos.me);
  const estados = useEstadosTripulacion(me_previo?.demoCrew.map((miembro) => miembro.id) ?? []);

  const elegir_tripulante = (id: string) => {
    setCrewId(id);
    setCrew(id);
  };

  return (
    <>
      <Sidebar me={me_previo} crew_id={crew_id} elegir_tripulante={elegir_tripulante} estados={estados} pagina={pagina} activar_sos={() => setSos({})} />
      {pagina === 'history' ? (
        <Historial crew_id={crew_id} />
      ) : pagina === 'assistant' ? (
        <Asistente crew_id={crew_id} abrir_sos={(emergencia) => setSos((previo) => (previo?.inicial?.id === emergencia.id ? previo : { inicial: emergencia }))} />
      ) : datos ? (
        <Dashboard datos={datos} crew_id={crew_id} recargar={recargar} />
      ) : (
        <main className="lg:ml-[290px] min-h-screen bg-[#F4F7FB] px-4 pb-6 pt-[4.5rem] lg:p-8">
          {error ? (
            <div className="max-w-xl p-5 rounded-card bg-white border border-rose-200 text-sm text-rose-700">
              <div className="font-bold mb-1">We couldn’t load the health data</div>
              <div>{error}</div>
              <button type="button" onClick={() => void recargar()} className="mt-3 px-4 py-2 rounded-lg bg-[#0B1B3A] hover:bg-[#13285a] text-white text-sm font-semibold">
                Try again
              </button>
            </div>
          ) : (
            <Cargando tamano="pagina" texto="Syncing telemetry" detalle="Loading the latest health data for this crew member." />
          )}
        </main>
      )}
      {sos && (
        <Emergencia
          crew_id={crew_id}
          inicial={sos.inicial}
          cerrar={() => {
            setSos(null);
            void recargar();
          }}
        />
      )}
    </>
  );
}
