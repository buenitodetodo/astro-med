export function redondear(valor: number, decimales?: number): number;
export function redondear(valor: number | null, decimales?: number): number | null;
export function redondear(valor: number | null, decimales = 1) {
  return valor === null ? null : Math.round(valor * 10 ** decimales) / 10 ** decimales;
}

export const promedio = (valores: number[]) => valores.reduce((suma, valor) => suma + valor, 0) / valores.length;

export const desviacion_estandar = (valores: number[]) => {
  if (valores.length < 2) return 0;
  const media = promedio(valores);
  const suma_cuadrados = valores.reduce((suma, valor) => suma + (valor - media) ** 2, 0);
  return Math.sqrt(suma_cuadrados / (valores.length - 1));
};
