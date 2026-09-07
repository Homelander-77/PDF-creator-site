'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, type Session } from '@/lib/api';

type State =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; session: Session };

/**
 * Кто сейчас в браузере.
 *
 * Кука httpOnly — JavaScript её не видит, поэтому единственный способ узнать,
 * вошёл ли человек, это спросить сервер. Отсюда состояние 'loading': пока
 * ответ не пришёл, мы не знаем ничего и не должны показывать ни кабинет,
 * ни форму входа — иначе интерфейс мигнёт не тем.
 */
export function useSession() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const refresh = useCallback(async () => {
    try {
      const session = await api.session();
      setState({ status: 'authenticated', session });
    } catch {
      setState({ status: 'anonymous' });
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
