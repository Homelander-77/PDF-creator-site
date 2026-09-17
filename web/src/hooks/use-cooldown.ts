'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Обратный отсчёт до момента, когда можно повторить запрос.
 *
 * Хранится не «сколько осталось», а момент, до которого ждём. Разница
 * важная: счётчик, который каждую секунду уменьшает сам себя, врёт, стоит
 * браузеру придержать вкладку в фоне или ноутбуку уснуть — таймеры там
 * стреляют реже, и отсчёт отстаёт от реального времени. Здесь же каждый
 * тик просто смотрит на часы, поэтому после пробуждения значение сразу
 * верное.
 */
export function useCooldown() {
  const [deadline, setDeadline] = useState(0);
  const [left, setLeft] = useState(0);

  const start = useCallback((seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    setDeadline(Date.now() + seconds * 1000);
    setLeft(Math.ceil(seconds));
  }, []);

  useEffect(() => {
    if (deadline === 0) return;

    /**
     * Тик чаще секунды — намеренно.
     *
     * При ровно секундном интервале момент срабатывания постепенно уползает
     * относительно смены цифры, и отсчёт то замирает на два тика, то
     * перескакивает через значение. Четыре проверки в секунду стоят
     * копейки, а цифры меняются ровно.
     *
     * Сам таймер при этом создаётся один раз на всё ожидание: зависимость
     * здесь — момент окончания, а не оставшиеся секунды.
     */
    const id = setInterval(() => {
      const rest = Math.ceil((deadline - Date.now()) / 1000);
      if (rest > 0) {
        setLeft(rest);
      } else {
        setLeft(0);
        setDeadline(0);
      }
    }, 250);

    return () => clearInterval(id);
  }, [deadline]);

  return { left, active: left > 0, start };
}
