'use client';

import { useMemo, useState } from 'react';
import { CodeBlock } from '@/components/code-block';
import { API_BASE } from '@/lib/site';

/**
 * Конструктор запроса.
 *
 * Обычная документация заставляет собирать тело запроса в голове: прочитать
 * таблицу параметров, вспомнить единицы, не забыть кавычки. Здесь человек
 * щёлкает переключателями и получает готовый код, который можно вставить
 * и запустить.
 *
 * Всё считается в браузере: это склейка строки, а не обращение к серверу.
 */

type Source = 'html' | 'url' | 'markdown';
type Paper = 'a4' | 'letter' | 'a5';
type Margin = 'normal' | 'narrow' | 'none';
type Wait = '0s' | '1s' | '3s';
type Lang = 'curl' | 'javascript' | 'python' | 'go';

const PAPERS: Record<Paper, { label: string; width: string; height: string }> = {
  a4: { label: 'A4', width: '8.27in', height: '11.7in' },
  letter: { label: 'Letter', width: '8.5in', height: '11in' },
  a5: { label: 'A5', width: '5.83in', height: '8.27in' },
};

const MARGINS: Record<Margin, { label: string; size: string }> = {
  normal: { label: 'Обычные', size: '0.39in' },
  narrow: { label: 'Узкие', size: '0.2in' },
  none: { label: 'Без полей', size: '0' },
};

const SOURCES: Record<Source, { label: string; field: string; value: string }> = {
  html: { label: 'HTML', field: 'html', value: '<h1>Счёт №42</h1>' },
  url: { label: 'Ссылка', field: 'url', value: 'https://example.com/invoice' },
  markdown: { label: 'Markdown', field: 'markdown', value: '# Счёт №42' },
};

const LANGS: { id: Lang; label: string }[] = [
  { id: 'curl', label: 'curl' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'go', label: 'Go' },
];

/** Значение поля тела запроса: строк и флагов хватает. */
type Json = string | boolean | { [k: string]: Json };

export function RequestBuilder() {
  const [source, setSource] = useState<Source>('html');
  const [paper, setPaper] = useState<Paper>('a4');
  const [margin, setMargin] = useState<Margin>('normal');
  const [landscape, setLandscape] = useState(false);
  const [wait, setWait] = useState<Wait>('0s');
  const [lang, setLang] = useState<Lang>('curl');

  const body = useMemo<Record<string, Json>>(() => {
    const src = SOURCES[source];

    /**
     * В options попадает только то, что отличается от значений по
     * умолчанию. Запрос, где половина полей повторяет умолчания, читается
     * хуже и создаёт ощущение, что все они обязательны.
     */
    const options: Record<string, Json> = {};
    if (landscape) options.landscape = true;
    if (paper !== 'a4') {
      options.paperWidth = PAPERS[paper].width;
      options.paperHeight = PAPERS[paper].height;
    }
    if (margin !== 'normal') {
      const size = MARGINS[margin].size;
      options.marginTop = size;
      options.marginBottom = size;
      options.marginLeft = size;
      options.marginRight = size;
    }
    if (wait !== '0s') options.waitDelay = wait;

    const result: Record<string, Json> = { source, [src.field]: src.value };
    if (Object.keys(options).length > 0) result.options = options;
    return result;
  }, [source, paper, margin, landscape, wait]);

  const code = useMemo(() => snippet(lang, body), [lang, body]);

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-elevated">
      <div className="grid gap-6 border-b border-border p-5 sm:grid-cols-2">
        <Choice
          name="source"
          label="Что конвертируем"
          value={source}
          onChange={setSource}
          options={(Object.keys(SOURCES) as Source[]).map((k) => ({
            value: k,
            label: SOURCES[k].label,
          }))}
        />

        <Choice
          name="paper"
          label="Размер страницы"
          value={paper}
          onChange={setPaper}
          options={(Object.keys(PAPERS) as Paper[]).map((k) => ({
            value: k,
            label: PAPERS[k].label,
          }))}
        />

        <Choice
          name="margin"
          label="Поля"
          value={margin}
          onChange={setMargin}
          options={(Object.keys(MARGINS) as Margin[]).map((k) => ({
            value: k,
            label: MARGINS[k].label,
          }))}
        />

        <Choice
          name="wait"
          label="Ждать дорисовки"
          value={wait}
          onChange={setWait}
          options={[
            { value: '0s', label: 'Не ждать' },
            { value: '1s', label: '1 с' },
            { value: '3s', label: '3 с' },
          ]}
          hint="нужно, если страницу дорисовывает скрипт"
        />

        <label className="flex cursor-pointer select-none items-center gap-3 text-[14px] sm:col-span-2">
          <input
            type="checkbox"
            checked={landscape}
            onChange={(e) => setLandscape(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Альбомная ориентация
        </label>
      </div>

      <div
        role="tablist"
        aria-label="Язык примера"
        className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2"
      >
        {LANGS.map((l) => (
          <button
            key={l.id}
            role="tab"
            aria-selected={lang === l.id}
            onClick={() => setLang(l.id)}
            className={[
              'shrink-0 rounded-[8px] px-3 py-1.5 text-[13px] transition-colors duration-200',
              lang === l.id
                ? 'bg-accent-soft font-medium text-fg'
                : 'text-muted hover:bg-sunken hover:text-fg',
            ].join(' ')}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="p-3" role="tabpanel">
        <CodeBlock code={code} lang={lang === 'curl' ? 'bash' : lang} />
      </div>
    </div>
  );
}

/* ----------------------------- Переключатель ---------------------------- */

function Choice<T extends string>({
  name,
  label,
  value,
  onChange,
  options,
  hint,
}: {
  name: string;
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  hint?: string;
}) {
  return (
    <fieldset>
      {/*
        Настоящие радиокнопки, спрятанные под оформленные подписи.
        Свои «кнопки-переключатели» на div пришлось бы учить стрелкам,
        пробелу и объявлению для экранного диктора — здесь это работает
        само, потому что это и есть радиокнопки.
      */}
      <legend className="mb-2 text-[13px] font-medium text-muted">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <label
            key={o.value}
            className={[
              'cursor-pointer rounded-[8px] border px-3 py-1.5 text-[13px] transition-colors duration-200',
              'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent',
              /**
                Выбранный пункт раньше был accent-цветом по accent-soft —
                и в тёмной теме проверка контраста ругалась: цветной текст
                по цветной подложке недотягивал до 4.5:1 на кегле 13px.
                Основной цвет текста по той же подложке читается всегда,
                а выбор всё равно виден по рамке и заливке.
              */
              value === o.value
                ? 'border-accent bg-accent-soft font-medium text-fg'
                : 'border-border text-muted hover:border-border-strong hover:text-fg',
            ].join(' ')}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
      {hint && <p className="mt-1.5 text-[12.5px] text-subtle">{hint}</p>}
    </fieldset>
  );
}

/* ------------------------------- Генерация ------------------------------ */

/**
 * Печать объекта под конкретный язык.
 *
 * Разница между языками невелика — кавычки да написание логических
 * значений, — но подменять true на True поиском по готовой строке нельзя:
 * такое слово может оказаться внутри текста документа.
 */
function print(value: Json, lang: Lang, indent = 0): string {
  const pad = '  '.repeat(indent);
  const padInner = '  '.repeat(indent + 1);

  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') {
    if (lang === 'python') return value ? 'True' : 'False';
    return value ? 'true' : 'false';
  }

  const entries = Object.entries(value);
  if (entries.length === 0) return '{}';

  const inner = entries
    .map(([k, v]) => `${padInner}"${k}": ${print(v, lang, indent + 1)}`)
    .join(',\n');

  return `{\n${inner}\n${pad}}`;
}

function snippet(lang: Lang, body: Record<string, Json>): string {
  const url = `${API_BASE}/v1/convert`;

  if (lang === 'curl') {
    // Тело в одинарных кавычках: внутри только двойные, конфликта нет.
    const json = print(body, lang, 1);
    return `curl -X POST ${url} \\
  -H "Authorization: Bearer $PDF_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${json}' \\
  -o document.pdf`;
  }

  if (lang === 'javascript') {
    return `const res = await fetch('${url}', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${process.env.PDF_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(${print(body, lang, 1)}),
});

if (!res.ok) throw new Error(await res.text());

const pdf = Buffer.from(await res.arrayBuffer());
await writeFile('document.pdf', pdf);`;
  }

  if (lang === 'python') {
    return `import os, requests

res = requests.post(
    "${url}",
    headers={"Authorization": f"Bearer {os.environ['PDF_KEY']}"},
    json=${print(body, lang, 1)},
    timeout=60,
)
res.raise_for_status()

with open("document.pdf", "wb") as f:
    f.write(res.content)`;
  }

  return `payload := []byte(\`${print(body, lang, 0)}\`)

req, _ := http.NewRequest("POST", "${url}", bytes.NewReader(payload))
req.Header.Set("Authorization", "Bearer "+os.Getenv("PDF_KEY"))
req.Header.Set("Content-Type", "application/json")

res, err := http.DefaultClient.Do(req)
if err != nil {
    return err
}
defer res.Body.Close()

out, _ := os.Create("document.pdf")
io.Copy(out, res.Body)`;
}
