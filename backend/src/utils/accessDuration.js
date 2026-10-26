// UTC calendar arithmetic clamps the original day to the destination month.
// Existing explicit day-based purchases continue to use elapsed 24-hour days.
export function validDuration(value) {
  const days = value.durationDays, months = value.durationMonths;
  return (days == null) !== (months == null) && (months != null
    ? Number.isSafeInteger(months) && months >= 1 && months <= 1200
    : Number.isSafeInteger(days) && days >= 1 && days <= 36500);
}
export function accessExpiry(start, duration) {
  if (!validDuration(duration) || !(start instanceof Date) || !Number.isFinite(start.getTime())) throw new TypeError('Invalid access period');
  if (duration.durationDays != null) return new Date(start.getTime() + duration.durationDays * 86400000);
  const end = new Date(start), day = end.getUTCDate();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + duration.durationMonths);
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(day, last));
  return end;
}
