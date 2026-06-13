/**
 * Formats a 24-hour time string (HH:mm or HH:mm:ss) into a 12-hour AM/PM string prepended by " at ".
 * E.g., "14:30" -> " at 2:30 PM", "09:15" -> " at 9:15 AM", "09:15:00" -> " at 9:15 AM".
 * Returns an empty string if the input is null, undefined, or invalid.
 */
export function formatTimeWithAt(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return '';
  const [h, m] = parts;
  const hours = parseInt(h, 10);
  if (isNaN(hours)) return '';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return ` at ${displayHours}:${m} ${ampm}`;
}
