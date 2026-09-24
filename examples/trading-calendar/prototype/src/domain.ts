export type CalendarStatus = 'trading' | 'closed';

export interface CalendarOverride {
  date: string;
  status: CalendarStatus;
  note: string;
}

export interface CalendarCell extends CalendarOverride {
  day: number;
  inMonth: boolean;
  isToday: boolean;
}

export interface DateRangeRule {
  id: number;
  start: string;
  end: string;
}

export const TODAY = new Date(2026, 8, 22);
export const TODAY_ISO = '2026-09-22';
export const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const INITIAL_SPECIAL_DAYS: CalendarOverride[] = [
  { date: '2026-09-03', status: 'closed', note: '休市安排' },
  { date: '2026-09-17', status: 'closed', note: '临时休市' },
  { date: '2026-09-20', status: 'trading', note: '调休开市' },
  { date: '2026-09-25', status: 'closed', note: '节假日休市' },
];

export function createInitialOverrides() {
  return new Map(INITIAL_SPECIAL_DAYS.map((item) => [item.date, item]));
}

export function toIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromIso(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function defaultStatus(date: Date): CalendarStatus {
  const weekday = date.getDay();
  return weekday === 0 || weekday === 6 ? 'closed' : 'trading';
}

export function calendarState(date: Date, overrides: Map<string, CalendarOverride>): CalendarOverride {
  const iso = toIso(date);
  return overrides.get(iso) ?? { date: iso, status: defaultStatus(date), note: '' };
}

export function buildMonthCells(
  year: number,
  month: number,
  overrides: Map<string, CalendarOverride>,
): CalendarCell[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const state = calendarState(date, overrides);
    return {
      ...state,
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      isToday: state.date === TODAY_ISO,
    };
  });
}

export function countTradingDays(year: number, month: number, overrides: Map<string, CalendarOverride>) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  let count = 0;
  for (let day = 1; day <= lastDay; day += 1) {
    if (calendarState(new Date(year, month, day), overrides).status === 'trading') count += 1;
  }
  return count;
}

export function formatMonth(year: number, month: number) {
  return `${year}年${month + 1}月`;
}

export function formatDate(value: string) {
  const date = fromIso(value);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function isHistorical(value: string) {
  return value < TODAY_ISO;
}

export function datesInRange(start: string, end: string) {
  const dates: string[] = [];
  const cursor = fromIso(start);
  const last = fromIso(end);
  while (cursor <= last) {
    dates.push(toIso(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}
