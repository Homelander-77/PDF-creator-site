import { Reveal } from '@/components/ui';

/**
 * Путь запроса от вашего кода до готового файла.
 *
 * Схема нужна ровно для одного: показать, что происходит между «отправил»
 * и «получил». Текстом это занимает абзац, который никто не читает.
 *
 * Движение по цепочке сделано анимацией самой связи, а не точки внутри
 * неё: точка размером в шесть пикселей, сдвинуть её на всю ширину связи
 * через transform нельзя — проценты считаются от размера самого элемента.
 * Поэтому двигается прозрачная обёртка во всю ширину, а точка едет вместе
 * с ней. Это по-прежнему один transform, без пересчёта раскладки.
 */

const NODES = [
  {
    title: 'Ваш код',
    text: 'POST с разметкой или ссылкой',
    icon: 'M8 6 2 12l6 6M16 6l6 6-6 6',
  },
  {
    title: 'Шлюз',
    text: 'Ключ, лимит, проверка адреса',
    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  },
  {
    title: 'Очередь и рендер',
    text: 'Chromium в изоляции, без сети наружу',
    icon: 'M4 4h16v12H4zM8 20h8M12 16v4',
  },
  {
    title: 'PDF в ответе',
    text: 'Файл и расход в заголовках',
    icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 12v6M9 15l3 3 3-3',
  },
];

export function FlowDiagram() {
  return (
    <Reveal>
      <ol className="flow">
        {NODES.map((node, i) => (
          <li key={node.title} className="flow-step">
            <div className="flow-card">
              <span className="flow-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d={node.icon} />
                </svg>
              </span>
              <div className="min-w-0">
                <div className="text-[15px] font-medium tracking-tight">
                  {node.title}
                </div>
                <div className="mt-0.5 text-[13.5px] leading-snug text-muted">
                  {node.text}
                </div>
              </div>
            </div>

            {i < NODES.length - 1 && (
              /**
               * Связь — оформление, а не содержание: списку из четырёх
               * шагов она ничего не добавляет, а экранный диктор
               * прочитал бы её как пустой элемент.
               */
              <div
                className="flow-link"
                style={{ ['--i' as string]: String(i) }}
                aria-hidden
              >
                <span className="flow-run">
                  <span className="flow-dot" />
                </span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </Reveal>
  );
}
