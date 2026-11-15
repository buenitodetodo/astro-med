import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import { decidir, esquema_respuesta, leer_ronda, type Ronda } from './health/doctor';
import { config_del_medico, describir_error, leer_config, preguntar_lmstudio, type Mensaje } from './health/models';
import { votacion } from './health/thresholds';

export type ParametrosDoctor = { caso_id: string; mensajes: Mensaje[] };

type Papel = 'razonamiento' | 'medico';

export class DoctorWorkflow extends WorkflowEntrypoint<Env, ParametrosDoctor> {
  async run(event: WorkflowEvent<ParametrosDoctor>, step: WorkflowStep) {
    const { caso_id, mensajes } = event.payload;
    const config = leer_config(this.env);
    const total = votacion.rondas_por_modelo.valor;
    const limite_paso = `${Math.ceil(config.limite_ms / 1000) + 15} seconds` as const;

    const correr_rondas = async (papel: Papel) => {
      const modelo = config[papel];
      const config_papel = papel === 'medico' ? config_del_medico(config) : config;
      const rondas: Ronda[] = [];
      for (let numero = 1; numero <= total; numero += 1) {
        const anterior = rondas.at(-1);
        if (anterior && !anterior.ok && anterior.conexion) {
          rondas.push(anterior);
          continue;
        }
        let ronda: Ronda;
        try {
          ronda = await step.do(`${papel}-${numero}`, { retries: { limit: 0, delay: '1 second' }, timeout: limite_paso }, async () => {
            let resultado: Ronda;
            try {
              resultado = leer_ronda(
                await preguntar_lmstudio(config_papel, { modelo, mensajes, esquema: esquema_respuesta, temperatura: config.temperatura }),
              );
            } catch (error) {
              resultado = { ok: false, error: describir_error(error), conexion: true };
            }
            await this.env.DB.prepare('UPDATE casos_doctor SET rondas_hechas = rondas_hechas + 1 WHERE id = ?').bind(caso_id).run();
            return resultado;
          });
        } catch (error) {
          ronda = { ok: false, error: describir_error(error), conexion: true };
        }
        rondas.push(ronda);
      }
      return rondas;
    };

    const [rondas_razonamiento, rondas_medico] = await Promise.all([correr_rondas('razonamiento'), correr_rondas('medico')]);

    return step.do('votar', async () => {
      const resultado = decidir(rondas_razonamiento, rondas_medico);
      const rondas = JSON.stringify({ razonamiento: rondas_razonamiento, medico: rondas_medico });
      const errores = [...new Set([...rondas_razonamiento, ...rondas_medico].flatMap((ronda) => (ronda.ok ? [] : [ronda.error])))];
      await this.env.DB.prepare(
        `UPDATE casos_doctor SET estado = ?, resultado = ?, rondas = ?, error = ?, rondas_hechas = rondas_totales, terminado_en = ? WHERE id = ?`,
      )
        .bind(
          resultado ? 'listo' : 'error',
          resultado ? JSON.stringify(resultado) : null,
          rondas,
          resultado ? null : `No model gave a valid answer: ${errores.slice(0, 3).join(' | ')}`,
          new Date().toISOString(),
          caso_id,
        )
        .run();
      return { estado: resultado ? 'listo' : 'error' };
    });
  }
}
