export function money(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount || 0));
}

export function dateOnly(value) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

export function dateTime(value) {
  return value ? new Date(value).toLocaleString() : '—';
}
