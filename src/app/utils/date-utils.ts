export function parseServerDateToLocal(dateString: string): Date {
  if (!dateString) return new Date();
  
  // Si ya es una fecha ISO completa
  if (dateString.includes('T')) {
    const date = new Date(dateString);
    // Ajustar por diferencia de zona horaria
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + timezoneOffset);
  }
  
  // Si es solo fecha (sin hora)
  return new Date(dateString);
}

export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const date = new Date(dateStr);
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  
  date.setHours(hours || 0, minutes || 0, seconds || 0, 0);
  return date;
}