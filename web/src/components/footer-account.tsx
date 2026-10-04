'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';

const LINK = 'text-sm text-muted transition-colors duration-200 hover:text-fg';

/**
 * Колонка «Аккаунт» в подвале.
 *
 * Сам подвал серверный и одинаковый для всех, а эта колонка зависит от
 * того, кто смотрит. Раньше вошедший человек видел здесь «Вход» и
 * «Регистрация» — будто его не узнали. Теперь гость видит вход и
 * регистрацию, вошедший — кабинет и выход.
 *
 * Пока ответ сервера не пришёл, показываем вариант для гостя: на
 * публичных страницах их подавляющее большинство.
 */
export function FooterAccount() {
  const router = useRouter();
  const session = useSession();

  if (session.status === 'authenticated') {
    return (
      <ul className="space-y-2">
        <li>
          <Link href="/dashboard" className={LINK}>
            Кабинет
          </Link>
        </li>
        <li>
          <button
            type="button"
            className={LINK}
            onClick={async () => {
              await session.logout();
              router.replace('/');
              router.refresh();
            }}
          >
            Выйти
          </button>
        </li>
      </ul>
    );
  }

  return (
    <ul className="space-y-2">
      <li>
        <Link href="/login" className={LINK}>
          Вход
        </Link>
      </li>
      <li>
        <Link href="/register" className={LINK}>
          Регистрация
        </Link>
      </li>
    </ul>
  );
}
