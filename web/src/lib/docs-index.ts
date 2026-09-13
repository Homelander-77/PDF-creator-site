/**
 * Указатель для поиска по документации.
 *
 * Список составлен руками, а не собран из текста страницы. Это осознанно:
 * автоматический сбор находит ровно те слова, которые уже написаны, а ищут
 * люди по другим — «водяной знак», «429», «таймаут», «почему пустая
 * страница». Поэтому у каждой записи есть свои ключевые слова.
 */

export type DocEntry = {
  /** Куда ведём. Может быть якорь в документации или другая страница. */
  href: string;
  title: string;
  /** Раздел — показывается серой подписью, чтобы отличать похожие записи. */
  section: string;
  /** Слова, по которым эту запись должно находить. */
  keywords: string;
};

export const DOC_ENTRIES: DocEntry[] = [
  {
    href: '/docs#quickstart',
    title: 'Быстрый старт',
    section: 'Документация',
    keywords: 'первый запрос curl начать регистрация ключ пример hello world',
  },
  {
    href: '/docs#auth',
    title: 'Передача ключа в заголовке',
    section: 'Аутентификация',
    keywords: 'authorization bearer x-api-key заголовок токен авторизация 401',
  },
  {
    href: '/docs#auth',
    title: 'Ключ показывается один раз',
    section: 'Аутентификация',
    keywords: 'потерял ключ восстановить sha-256 хеш отозвать выпустить новый',
  },
  {
    href: '/docs#convert',
    title: 'POST /v1/convert',
    section: 'Конвертация',
    keywords: 'эндпоинт адрес запрос тело json конвертация справочник api',
  },
  {
    href: '/docs#convert',
    title: 'Источники: HTML, ссылка, Markdown, Office',
    section: 'Конвертация',
    keywords: 'source html url markdown office docx xlsx pptx libreoffice файл',
  },
  {
    href: '/docs#convert',
    title: 'Запрет на внутренние адреса',
    section: 'Конвертация',
    keywords:
      'ssrf url_not_allowed 127.0.0.1 localhost 169.254.169.254 внутренняя сеть безопасность',
  },
  {
    href: '/docs#builder',
    title: 'Собрать запрос переключателями',
    section: 'Конвертация',
    keywords: 'конструктор песочница сгенерировать код пример curl javascript python go',
  },
  {
    href: '/docs#options',
    title: 'Поля и размер страницы',
    section: 'Параметры',
    keywords:
      'options margintop marginbottom marginleft marginright paperwidth paperheight a4 letter поля отступы',
  },
  {
    href: '/docs#options',
    title: 'Альбомная ориентация',
    section: 'Параметры',
    keywords: 'landscape альбомная горизонтальная поворот ориентация',
  },
  {
    href: '/docs#options',
    title: 'Ожидание отрисовки',
    section: 'Параметры',
    keywords:
      'waitdelay пустая страница график шрифт не успел fetch задержка скрипт не отрисовался',
  },
  {
    href: '/docs#quota',
    title: 'Считаются страницы, а не запросы',
    section: 'Квоты',
    keywords: 'квота лимит страницы расход x-pages-rendered сколько осталось',
  },
  {
    href: '/docs#quota',
    title: 'Ограничение скорости и всплески',
    section: 'Квоты',
    keywords: 'rate limit 429 retry-after запросов в секунду burst всплеск token bucket',
  },
  {
    href: '/docs#errors',
    title: 'quota_exceeded — 402',
    section: 'Ошибки',
    keywords: '402 лимит исчерпан кончились страницы оплата',
  },
  {
    href: '/docs#errors',
    title: 'invalid_api_key — 401',
    section: 'Ошибки',
    keywords: '401 ключ неизвестен отозван неверный',
  },
  {
    href: '/docs#errors',
    title: 'email_not_verified — 403',
    section: 'Ошибки',
    keywords: '403 подтвердите почту письмо не пришло верификация',
  },
  {
    href: '/docs#errors',
    title: 'render_failed и таймаут 504',
    section: 'Ошибки',
    keywords: '502 504 не отрендерился таймаут 30 секунд долго разметка сломана',
  },
  {
    href: '/docs#sdk',
    title: 'Примеры на языках',
    section: 'Документация',
    keywords:
      'python php go node javascript ruby c# dotnet библиотека sdk клиент пример кода',
  },
  {
    href: '/pricing',
    title: 'Тарифы и калькулятор',
    section: 'Сайт',
    keywords: 'цена стоимость сколько стоит тариф free premium business рубли калькулятор',
  },
  {
    href: '/dashboard',
    title: 'Кабинет: выпуск и отзыв ключей',
    section: 'Сайт',
    keywords: 'ключи кабинет выпустить отозвать личный кабинет квота остаток',
  },
];

/**
 * Отбор записей под запрос.
 *
 * Совпадать должны все слова запроса, но каждое — в любом месте записи.
 * Так «429 лимит» находит нужное, а порядок слов значения не имеет.
 */
export function searchDocs(query: string): DocEntry[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return DOC_ENTRIES.slice(0, 8);

  const scored = DOC_ENTRIES.map((entry) => {
    const title = entry.title.toLowerCase();
    const section = entry.section.toLowerCase();
    const keywords = entry.keywords.toLowerCase();

    let score = 0;
    for (const term of terms) {
      if (title.includes(term)) score += 3;
      else if (keywords.includes(term)) score += 2;
      else if (section.includes(term)) score += 1;
      else return null; // не нашлось ни в одном поле — запись не подходит
    }
    return { entry, score };
  }).filter((x): x is { entry: DocEntry; score: number } => x !== null);

  return scored.sort((a, b) => b.score - a.score).map((x) => x.entry);
}
