/**
 * Converts a 24-hour time string (e.g. "20:00:00" or "20:00") to 12-hour
 * format with AM/PM (e.g. "8:00 PM").
 */
export const formatTime12h = (time24) => {
  if (!time24) return '';
  try {
    const parts = String(time24).split(':');
    let hour = parseInt(parts[0], 10);
    const min = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    if (isNaN(hour)) return String(time24);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    if (hour === 0) hour = 12;
    if (hour > 12) hour -= 12;
    return `${hour}:${String(min).padStart(2, '0')} ${ampm}`;
  } catch {
    return String(time24);
  }
};
