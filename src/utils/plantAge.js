export function getPlantAgeLabel(dateValue) {
  const start = new Date(dateValue);
  if (Number.isNaN(start.getTime())) {
    return 'Age unknown';
  }

  const today = new Date();
  const diffMs = today.getTime() - start.getTime();
  const days = Math.max(0, Math.floor(diffMs / 86400000));

  if (days < 1) {
    return 'Added today';
  }
  if (days < 30) {
    return `${days} day${days === 1 ? '' : 's'} old`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months === 1 ? '' : 's'} old`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) {
    return `${years} year${years === 1 ? '' : 's'} old`;
  }
  return `${years}y ${remainingMonths}m old`;
}
