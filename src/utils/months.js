export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function getCurrentMonthNumber() {
  return new Date().getMonth() + 1;
}

export function formatMonths(months = []) {
  return months.map((month) => monthNames[month - 1]).filter(Boolean).join(", ");
}

export function includesCurrentMonth(months = []) {
  return months.includes(getCurrentMonthNumber());
}
