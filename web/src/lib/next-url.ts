/**
 * Куда вернуть человека после входа.
 *
 * Адрес приходит из строки запроса — то есть его может подставить кто
 * угодно. Без проверки ссылка вида /login?next=https://evil.example
 * после ввода пароля уводила бы на чужой сайт (open redirect). Поэтому
 * пускаем только пути внутри нашего сайта: начинается с одного «/», без
 * «//» и «/\» — браузер читает их как адрес другого домена.
 */
export function safeNext(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (!raw) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  return raw;
}

/** /login?next=… для текущего адреса. */
export function loginUrl(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`;
}
