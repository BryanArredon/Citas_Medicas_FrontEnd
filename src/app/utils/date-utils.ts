export function parseServerDateToLocal(dateStr?: string): Date {
  if (!dateStr) return new Date(NaN);

  // Si ya trae Z u offset (+/-HH:MM) -> Date lo interpreta correctamente
  const hasOffsetOrZ = /[zZ]|[+\-]\d{2}:\d{2}$/.test(dateStr);
  if (hasOffsetOrZ) {
    return new Date(dateStr);
  }

  // Limpia la fracción de segundos y normalízala a 3 dígitos (ms)
  let cleaned = dateStr;
  const fracMatch = cleaned.match(/\.(\d+)$/);
  if (fracMatch && fracMatch[1]) {
    let frac = fracMatch[1];
    if (frac.length > 3) frac = frac.slice(0, 3);
    else if (frac.length < 3) frac = frac.padEnd(3, '0');
    cleaned = cleaned.replace(/\.\d+$/, '.' + frac);
  }

  return new Date(cleaned + 'Z');
}
