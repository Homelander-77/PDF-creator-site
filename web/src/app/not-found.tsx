import Link from 'next/link';
import { Button } from '@/components/ui';

/**
 * Страница 404.
 *
 * Без этого файла Next показывает свою служебную заглушку — чёрный текст
 * на белом, без шапки, без темы. Человек, попавший туда по битой ссылке,
 * решает, что сайт сломан. Своя страница стоит двадцати строк.
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <div className="aurora opacity-40" aria-hidden />

      <div className="animate-fade-up">
        <div className="font-mono text-[13px] text-subtle">404</div>

        <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.02em] sm:text-[40px]">
          Страница не найдена
        </h1>

        <p className="mx-auto mt-3 max-w-[44ch] text-[16px] leading-relaxed text-muted">
          Ссылка устарела или в адресе опечатка. Всё рабочее — на главной
          и в документации.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/">
            <Button size="lg">На главную</Button>
          </Link>
          <Link href="/docs">
            <Button size="lg" variant="secondary">
              Документация
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
