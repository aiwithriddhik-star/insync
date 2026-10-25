/** Today's date as YYYY-MM-DD in the user's own timezone (toISOString() would use UTC and be a day off overnight in IST). */
export const todayInput = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

export const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export const formatShortDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export const daysBetween = (start: string, end: string) =>
  Math.round((new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86400000);
