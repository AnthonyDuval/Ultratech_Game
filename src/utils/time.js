export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatSystemTime(date = new Date()) {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
