import { SensButton, SensIcon } from '@sens/prototype-kit';
import {
  WEEKDAYS,
  buildMonthCells,
  calendarState,
  countTradingDays,
  formatMonth,
  type CalendarCell,
  type CalendarOverride,
} from '../domain';

interface CalendarViewProps {
  year: number;
  month: number;
  view: 'month' | 'year';
  overrides: Map<string, CalendarOverride>;
  onNavigate: (year: number, month: number) => void;
  onViewChange: (view: 'month' | 'year') => void;
  onSelectDate: (date: string) => void;
}

function DateCell({ cell, onSelect }: { cell: CalendarCell; onSelect: (date: string) => void }) {
  const classNames = [
    'calendar-cell',
    !cell.inMonth ? 'calendar-cell--adjacent' : '',
    cell.isToday ? 'calendar-cell--today' : '',
  ].filter(Boolean).join(' ');
  const content = (
    <button
      type="button"
      className={classNames}
      data-calendar-status={cell.status}
      data-in-month={cell.inMonth ? 'true' : 'false'}
      aria-current={cell.isToday ? 'date' : undefined}
      aria-label={`${cell.date}，${cell.status === 'trading' ? '交易日' : '非交易日'}${cell.note ? `，${cell.note}` : ''}`}
      title={cell.note || undefined}
      onClick={() => onSelect(cell.date)}
    >
      <span className="calendar-cell__date">{cell.day}</span>
      <span className={`calendar-status calendar-status--${cell.status}`}>
        <span className="calendar-status__dot" aria-hidden />
        <span>{cell.status === 'trading' ? '交易日' : '非交易日'}</span>
      </span>
      {cell.note ? <span className="calendar-cell__note">{cell.note}</span> : null}
    </button>
  );
  return content;
}

function MonthView({ year, month, overrides, onSelectDate }: Pick<CalendarViewProps, 'year' | 'month' | 'overrides' | 'onSelectDate'>) {
  const allCells = buildMonthCells(year, month, overrides);
  const occupiedDays = new Date(year, month, 1).getDay() + new Date(year, month + 1, 0).getDate();
  const cells = allCells.slice(0, occupiedDays <= 35 ? 35 : 42);
  return (
    <section className="month-calendar" data-testid="month-calendar" aria-label={formatMonth(year, month)}>
      <div className="weekday-row" role="row">
        {WEEKDAYS.map((day) => <div key={day} className="weekday" role="columnheader">{day}</div>)}
      </div>
      <div className="month-grid">
        {cells.map((cell) => <DateCell key={cell.date} cell={cell} onSelect={onSelectDate} />)}
      </div>
    </section>
  );
}

function MiniMonth({ year, month, overrides, onOpen }: { year: number; month: number; overrides: Map<string, CalendarOverride>; onOpen: () => void }) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0).getDate();
  const blanks = Array.from({ length: first.getDay() });
  const dates = Array.from({ length: last }, (_, index) => index + 1);
  return (
    <button type="button" className="mini-month" onClick={onOpen} aria-label={`查看${month + 1}月`}>
      <strong>{month + 1}月</strong>
      <span className="mini-weekdays">{WEEKDAYS.map((day) => <span key={day}>{day.slice(1)}</span>)}</span>
      <span className="mini-grid">
        {blanks.map((_, index) => <span key={`blank-${index}`} aria-hidden />)}
        {dates.map((day) => {
          const state = calendarState(new Date(year, month, day), overrides);
          return <span key={day} className={`mini-day mini-day--${state.status}`}>{day}</span>;
        })}
      </span>
    </button>
  );
}

export function CalendarView({ year, month, view, overrides, onNavigate, onViewChange, onSelectDate }: CalendarViewProps) {
  const moveMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    onNavigate(next.getFullYear(), next.getMonth());
  };
  const moveYear = (delta: number) => onNavigate(year + delta, month);
  const configured = countTradingDays(year, month, overrides);
  return (
    <main className="calendar-page" data-testid="trading-calendar">
      <section className="calendar-toolbar" data-testid="calendar-toolbar" aria-label="日历工具栏">
        <div className="calendar-navigation">
          <SensButton tone="secondary" onClick={() => onNavigate(2026, 8)}>今天</SensButton>
          <SensButton tone="tertiary" aria-label={view === 'month' ? '上一月' : '上一年'} icon={<SensIcon name="left" />} onClick={() => view === 'month' ? moveMonth(-1) : moveYear(-1)} />
          <SensButton tone="tertiary" aria-label={view === 'month' ? '下一月' : '下一年'} icon={<SensIcon name="right" />} onClick={() => view === 'month' ? moveMonth(1) : moveYear(1)} />
          <h1 aria-live="polite">{view === 'month' ? formatMonth(year, month) : `${year}年`}</h1>
        </div>
        <div className="view-switch" role="tablist" aria-label="日历视图">
          <button type="button" role="tab" aria-selected={view === 'month'} onClick={() => onViewChange('month')}>月视图</button>
          <button type="button" role="tab" aria-selected={view === 'year'} onClick={() => onViewChange('year')}>年视图</button>
        </div>
      </section>
      <section className="calendar-meta" data-testid="calendar-meta" aria-label="日历状态说明">
        <div className="legend">
          <span><i className="legend-dot legend-dot--trading" />交易日</span>
          <span><i className="legend-dot legend-dot--closed" />非交易日</span>
          <span><i className="legend-today" />今天</span>
        </div>
        <span>{view === 'month' ? `当前月份已配置 ${configured} 个交易日` : '点击月份可进入月视图'}</span>
      </section>
      {view === 'month' ? (
        <MonthView year={year} month={month} overrides={overrides} onSelectDate={onSelectDate} />
      ) : (
        <section className="year-grid" data-testid="year-calendar" aria-label={`${year}年日历`}>
          {Array.from({ length: 12 }, (_, index) => (
            <MiniMonth
              key={index}
              year={year}
              month={index}
              overrides={overrides}
              onOpen={() => { onNavigate(year, index); onViewChange('month'); }}
            />
          ))}
        </section>
      )}
    </main>
  );
}
