export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validarCelular(celular: string): boolean {
  const numeroLimpo = celular.replace(/\D/g, '');
  return /^(\d{10}|\d{11})$/.test(numeroLimpo);
}
