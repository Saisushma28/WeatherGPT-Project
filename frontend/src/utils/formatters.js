export function formatTemp(celsius, unit = 'C') {
  if (celsius === undefined || celsius === null) return '--';
  if (unit === 'F') {
    return `${Math.round((celsius * 9) / 5 + 32)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

export function formatTime(isoString) {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    return isoString.split('T')[1] || isoString;
  }
}

export function formatDate(isoDate, locale = 'en-IN') {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
  } catch (e) {
    return isoDate;
  }
}

export function getAlertColorClass(color) {
  switch (color?.toLowerCase()) {
    case 'red':
      return 'border-red-500 bg-red-950/40 text-red-200';
    case 'orange':
      return 'border-amber-500 bg-amber-950/40 text-amber-200';
    case 'yellow':
      return 'border-yellow-500 bg-yellow-950/40 text-yellow-200';
    default:
      return 'border-emerald-500 bg-emerald-950/40 text-emerald-200';
  }
}
