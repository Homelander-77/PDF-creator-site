import Link from 'next/link';

const GROUPS = [
  {
    title: 'Продукт',
    links: [
      { href: '/#features', label: 'Возможности' },
      { href: '/#pricing', label: 'Тарифы' },
      { href: '/docs', label: 'Документация' },
    ],
  },
  {
    title: 'Разработчикам',
    links: [
      { href: '/docs#quickstart', label: 'Быстрый старт' },
      { href: '/docs#api', label: 'Справочник API' },
      { href: '/docs#errors', label: 'Коды ошибок' },
    ],
  },
  {
    title: 'Аккаунт',
    links: [
      { href: '/login', label: 'Вход' },
      { href: '/register', label: 'Регистрация' },
      { href: '/dashboard', label: 'Кабинет' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3 font-semibold tracking-tight">pdfapi</div>
          <p className="max-w-[26ch] text-sm leading-relaxed text-muted">
            HTML, Markdown и Office в PDF. Один HTTP-запрос, никакого Chromium
            на вашей стороне.
          </p>
        </div>

        {GROUPS.map((g) => (
          <div key={g.title}>
            <div className="mb-3 text-[13px] font-medium text-subtle">{g.title}</div>
            <ul className="space-y-2">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted transition-colors duration-200 hover:text-fg"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-[13px] text-subtle sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} pdfapi</span>
          <span className="font-mono">status: все системы в норме</span>
        </div>
      </div>
    </footer>
  );
}
