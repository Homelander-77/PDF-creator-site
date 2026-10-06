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
/**
 * Один запрос на всех, кто спросил одновременно.
 *
 * На главной сессию спрашивают шапка, подвал и три карточки тарифов —
 * и раньше уходило пять одинаковых запросов /auth/session. Теперь, пока
 * запрос в пути, все ждут его же. Кешем это не является: как только ответ
 * пришёл, следующий вызов спросит сервер заново — иначе после входа или
 * выхода страница видела бы устаревшее состояние.
 */
let inflight: Promise<State> | null = null;

function fetchSession(): Promise<State> {
  inflight ??= api
    .session()
    .then((session): State => ({ status: 'authenticated', session }))
    .catch((err): State =>
      err instanceof ApiError && err.status === 401
        ? { status: 'anonymous' }
        : {
            status: 'error',
            message: err instanceof ApiError ? err.message : 'Не удалось связаться с сервером.',
          },
    )
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useSession() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const refresh = useCallback(async () => {
    setState(await fetchSession());
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
