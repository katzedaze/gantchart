export interface GanttConfig {
  startDate: Date;
  pixelsPerDay: number;
}

export function dateToPixel(date: Date, config: GanttConfig): number {
  const diffMs = date.getTime() - config.startDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.round(diffDays * config.pixelsPerDay);
}

export function pixelToDate(pixel: number, config: GanttConfig): Date {
  const days = pixel / config.pixelsPerDay;
  const ms = days * 1000 * 60 * 60 * 24;
  return new Date(config.startDate.getTime() + ms);
}

export function calculateBarWidth(
  startDate: string | null,
  dueDate: string | null,
  config: GanttConfig
): number {
  if (!startDate || !dueDate) return config.pixelsPerDay;
  const start = new Date(startDate);
  const end = new Date(dueDate);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.max(Math.round(diffDays * config.pixelsPerDay), config.pixelsPerDay);
}

export function calculateBarLeft(
  startDate: string | null,
  config: GanttConfig
): number {
  if (!startDate) return 0;
  return dateToPixel(new Date(startDate), config);
}

export function getDateRange(
  issues: Array<{ start_date: string | null; due_date: string | null }>,
  paddingDays: number = 7
): { start: Date; end: Date } {
  const now = new Date();
  let minDate = now;
  let maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  for (const issue of issues) {
    if (issue.start_date) {
      const d = new Date(issue.start_date);
      if (d < minDate) minDate = d;
    }
    if (issue.due_date) {
      const d = new Date(issue.due_date);
      if (d > maxDate) maxDate = d;
    }
  }

  return {
    start: new Date(minDate.getTime() - paddingDays * 24 * 60 * 60 * 1000),
    end: new Date(maxDate.getTime() + paddingDays * 24 * 60 * 60 * 1000),
  };
}

export function generateDateColumns(
  start: Date,
  end: Date,
  pixelsPerDay: number
): Array<{ date: Date; label: string; x: number }> {
  const columns: Array<{ date: Date; label: string; x: number }> = [];
  const current = new Date(start);
  let x = 0;

  while (current <= end) {
    columns.push({
      date: new Date(current),
      label: `${current.getMonth() + 1}/${current.getDate()}`,
      x,
    });
    current.setDate(current.getDate() + 1);
    x += pixelsPerDay;
  }

  return columns;
}

export function formatDate(date: string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ja-JP");
}
