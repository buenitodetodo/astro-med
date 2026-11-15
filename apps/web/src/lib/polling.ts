const paso_ms = 1000;
const espera_al_volver_ms = 5000;

export const sondear = (tarea: () => void, ritmo_ms: () => number) => {
  let ultimo = Date.now();
  const correr_si_toca = (espera_ms: number) => {
    if (document.hidden || Date.now() - ultimo < espera_ms) return;
    ultimo = Date.now();
    tarea();
  };
  const intervalo = setInterval(() => correr_si_toca(ritmo_ms()), paso_ms);
  const al_volver = () => correr_si_toca(Math.min(ritmo_ms(), espera_al_volver_ms));
  document.addEventListener('visibilitychange', al_volver);
  return () => {
    clearInterval(intervalo);
    document.removeEventListener('visibilitychange', al_volver);
  };
};
