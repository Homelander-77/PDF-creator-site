'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError, api, type Session } from '@/lib/api';

type State =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; session: Session }
  | { status: 'error'; message: string };

/**
 * Кто сейчас в браузере.
 *
 * Кука httpOnly — JavaScript её не видит, поэтому единственный способ узнать,
 * вошёл ли человек, это спросить сервер. Отсюда состояние 'loading': пока
 * ответ не пришёл, мы не знаем ничего и не должны показывать ни кабинет,
 * ни форму входа — иначе интерфейс мигнёт не тем.
 *
 * «Не вошёл» и «сервер не ответил» — разные состояния. Раньше любой сбой
 * считался выходом: упал API на минуту — и человека выкидывало из кабинета
 * на форму входа, где он вводил пароль, получал ту же ошибку и не понимал,
 * что происходит. Анонимом считаем только по 401.
 */
export function useSession() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const refresh = useCallback(async () => {
    try {
      const session = await api.session();
      setState({ status: 'authenticated', session });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setState({ status: 'anonymous' });
      } else {
        setState({
          status: 'error',
          message: err instanceof ApiError ? err.message : 'Не удалось связаться с сервером.',
        });
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    setState({ status: 'anonymous' });
  }, []);

  return { ...state, refresh, logout };
}
