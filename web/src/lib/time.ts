/**
 * Человеческая запись промежутка времени.
 *
 * Сервер отдаёт секунды — 47, 180, 10800. Показывать их как есть нельзя:
 * «повторите через 10800 секунд» никто в уме не переводит. Здесь единица
 * выбирается по величине, а мелкие разряды отбрасываются, когда они уже
 * не важны: на трёх часах лишние секунды только мешают.
 */
export function formatWait(totalSeconds: number): string {
  const sec = Math.max(0, Math.ceil(totalSeconds));

  if (sec < 60) return `${sec} ${plural(sec, 'секунду', 'секунды', 'секунд')}`;

  if (sec < 3600) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    // До часа секунды ещё имеют смысл: человек реально ждёт с таймером
    // перед глазами и хочет видеть, что счётчик идёт.
    return s === 0
      ? `${m} ${plural(m, 'минуту', 'минуты', 'минут')}`
      : `${m} ${plural(m, 'минуту', 'минуты', 'минут')} ${s} с`;
  }

  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return m === 0
    ? `${h} ${plural(h, 'час', 'часа', 'часов')}`
    : `${h} ${plural(h, 'час', 'часа', 'часов')} ${m} мин`;
}

/**
 * Русское склонение по числу.
 *
 * 1 секунду, 2 секунды, 5 секунд — и отдельно 11–14, которые ведут себя
 * как «много» вопреки последней цифре: 21 секунду, но 11 секунд.
 */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod100 = Math.abs(n) % 100;
  const mod10 = mod100 % 10;

  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
