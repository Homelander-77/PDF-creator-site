'use client';

import { useState } from 'react';
import { cn } from './ui';

/**
 * Подсветка своя, без библиотеки.
 *
 * highlight.js и Prism весят 30–90 КБ и тянут за собой парсер языка. Для
 * четырёх примеров на лендинге это несоразмерно: страница грузится дольше
 * ради украшения. Здесь простой набор регулярок на строки, комментарии,
 * ключевые слова и числа — на глаз результат тот же.
 */
const KEYWORDS =
  'const|let|var|function|async|await|import|from|export|return|new|class|' +
  'if|else|for|while|try|catch|def|print|require|curl|func|package|with|' +
  'open|throw|true|false|null|None';

/**
 * ОДИН проход, а не цепочка replace.
 *
 * Наивная версия из четырёх последовательных замен ломается: первая
 * оборачивает строку в <span class="tok-str">, а третья находит слово
 * class уже ВНУТРИ этого тега и оборачивает его ещё раз. Получается
 * вложенная каша, которая вылезает в текст.
 *
 * Альтернация в одной регулярке решает это структурно: совпавший кусок
 * потребляется целиком и повторно не сканируется. Порядок веток важен —
 * строки идут первыми, поэтому решётка внутри кавычек не станет
 * комментарием.
 */
const TOKENS = new RegExp(
  [
    `("(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|\`(?:\\\\.|[^\`\\\\])*\`)`,
    `((?:#|//)[^\\n]*)`,
    `\\b(${KEYWORDS})\\b`,
    `\\b(\\d+(?:\\.\\d+)?)\\b`,
  ].join('|'),
  'g',
);

function highlight(code: string): string {
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped.replace(
    TOKENS,
    (match, str?: string, com?: string, kw?: string, num?: string) => {
      if (str) return `<span class="tok-str">${str}</span>`;
      if (com) return `<span class="tok-com">${com}</span>`;
      if (kw) return `<span class="tok-kw">${kw}</span>`;
      if (num) return `<span class="tok-num">${num}</span>`;
      return match;
    },
  );
}

export function CodeBlock({
  code,
  lang,
  filename,
  className,
}: {
  code: string;
  lang?: string;
  filename?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* буфер недоступен — не беда, код видно и так */
    }
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[14px] border border-border bg-sunken',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="font-mono text-[12px] text-subtle">
          {filename ?? lang ?? 'shell'}
        </span>
        <button
          onClick={copy}
          className="rounded-md px-2 py-1 font-mono text-[12px] text-subtle transition-colors duration-200 hover:bg-accent-soft hover:text-accent"
          aria-label="Скопировать код"
        >
          {copied ? 'скопировано' : 'копировать'}
        </button>
      </div>

      <pre className="overflow-x-auto p-4 text-[13px] leading-[1.7]">
        <code
          className="font-mono"
          dangerouslySetInnerHTML={{ __html: highlight(code) }}
        />
      </pre>

    </div>
  );
}
