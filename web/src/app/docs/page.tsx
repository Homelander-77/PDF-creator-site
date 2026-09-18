import type { Metadata } from 'next';
import { API_BASE } from '@/lib/site';
import { PLANS, num } from '@/lib/plans';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CodeBlock } from '@/components/code-block';
import { DocsNav } from '@/components/docs-nav';
import { DocsSearch } from '@/components/docs-search';
import { RequestBuilder } from '@/components/request-builder';
import { Badge } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Документация',
  description: 'Справочник API pdfapi: аутентификация, конвертация, лимиты, ошибки.',
  alternates: { canonical: '/docs' },
};

const SECTIONS = [
  { id: 'quickstart', title: 'Быстрый старт' },
  { id: 'auth', title: 'Аутентификация' },
  { id: 'convert', title: 'Конвертация' },
  { id: 'options', title: 'Параметры страницы' },
  { id: 'quota', title: 'Квоты и лимиты' },
  { id: 'errors', title: 'Коды ошибок' },
  { id: 'sdk', title: 'Примеры на языках' },
];

export default function DocsPage() {
  return (
    <>
      <Header />

      {/*
        Колонка на телефоне, две колонки на широком экране.
        До этого контейнер всегда был строкой: боковой список просто
        прятался, и второй колонки не возникало. Теперь на телефоне
        вместо него полоса с разделами, и она должна встать НАД
        текстом, а не рядом с ним.
      */}
      <div className="mx-auto flex max-w-6xl flex-col px-5 py-12 lg:flex-row lg:gap-12">
        <DocsNav sections={SECTIONS} />

        <main className="page-enter min-w-0 flex-1 pb-16">
          <div className="mb-12">
            <Badge tone="accent">v1</Badge>
            <h1 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.03em] sm:text-[38px]">
              Документация
            </h1>
            <p className="mt-3 max-w-[62ch] text-[17px] leading-relaxed text-muted">
              Один эндпоинт для конвертации, ключ в заголовке, PDF в ответе.
              Ниже — всё, что нужно знать.
            </p>

            {/*
              Поиск стоит здесь, а не в боковой навигации: на телефоне
              её просто нет, а искать оттуда хочется в первую очередь.
              Cmd+K и «/» работают на всей странице независимо от того,
              видно кнопку или нет.
            */}
            <div className="mt-6 max-w-[320px]">
              <DocsSearch />
            </div>
          </div>

          {/* ---------------------------- Quickstart --------------------- */}
          <Section id="quickstart" title="Быстрый старт">
            <P>
              Зарегистрируйтесь, подтвердите почту и выпустите ключ в кабинете.
              Дальше — один запрос:
            </P>
            <CodeBlock
              lang="bash"
              code={`curl -X POST ${API_BASE}/v1/convert \\
  -H "Authorization: Bearer pdf_live_ВАШ_КЛЮЧ" \\
  -H "Content-Type: application/json" \\
  -d '{"source":"html","html":"<h1>Привет</h1>"}' \\
  -o document.pdf`}
            />
            <P>
              В ответе — бинарный PDF и заголовки с расходом. Второй запрос
              за остатком делать не нужно.
            </P>
            <CodeBlock
              lang="http"
              code={`HTTP/1.1 200 OK
Content-Type: application/pdf
X-Pages-Rendered: 1
X-Quota-Limit: 10000
X-Quota-Used: 143
X-Quota-Remaining: 9857`}
            />
          </Section>

          {/* ------------------------------ Auth ------------------------- */}
          <Section id="auth" title="Аутентификация">
            <P>
              Ключ передаётся в заголовке. Поддерживаются два вида — выбирайте
              удобный:
            </P>
            <CodeBlock
              lang="http"
              code={`Authorization: Bearer pdf_live_xK9pQ2mRt7vN...
# или
X-API-Key: pdf_live_xK9pQ2mRt7vN...`}
            />
            <Callout>
              Полное значение ключа показывается один раз при выпуске. В базе
              хранится только SHA-256 — восстановить ключ невозможно даже нам.
              Потеряли — выпустите новый и отзовите старый.
            </Callout>
            <P>
              Держите отдельные ключи для прода, стейджинга и локальной
              разработки. Утёкший ключ гасится мгновенно и по отдельности,
              остальные продолжают работать.
            </P>
          </Section>

          {/* ---------------------------- Convert ------------------------ */}
          <Section id="convert" title="Конвертация">
            <Endpoint method="POST" path="/v1/convert" />
            <P>Тело запроса — JSON. Поле <Code>source</Code> определяет остальные:</P>

            <Table
              head={['source', 'Обязательные поля', 'Тариф']}
              rows={[
                ['html', 'html — строка с разметкой', 'все'],
                ['url', 'url — публичный адрес страницы', 'premium и выше'],
                ['markdown', 'markdown — текст', 'premium и выше'],
                ['office', 'file — docx, xlsx, pptx', 'premium и выше'],
              ]}
            />

            <CodeBlock
              lang="javascript"
              filename="convert.js"
              code={`const res = await fetch('${API_BASE}/v1/convert', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${process.env.PDF_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    source: 'html',
    html: '<h1>Счёт №42</h1><p>К оплате: 12 000 ₽</p>',
    options: { marginTop: '20mm', marginBottom: '20mm' },
  }),
});

if (!res.ok) throw new Error(await res.text());
const pdf = Buffer.from(await res.arrayBuffer());`}
            />

            <div id="builder" className="scroll-mt-[7.5rem] pt-4 lg:scroll-mt-24">
              <H3>Соберите свой запрос</H3>
              <P>
                Переключатели ниже собирают тело запроса и готовый код. В{' '}
                <Code>options</Code> попадает только то, что отличается от
                значений по умолчанию — копировать лишнее незачем.
              </P>
              <RequestBuilder />
            </div>

            <Callout tone="warn">
              Адрес в <Code>source: url</Code> резолвится и проверяется до
              запроса. Внутренние диапазоны — 127.0.0.1, 10.x, 192.168.x,
              169.254.169.254 — отклоняются с ошибкой{' '}
              <Code>url_not_allowed</Code>, в том числе если в них
              разрешается ваш домен.
            </Callout>
          </Section>

          {/* ---------------------------- Options ------------------------ */}
          <Section id="options" title="Параметры страницы">
            <P>
              Необязательный объект <Code>options</Code>. Размеры принимаются
              в тех же единицах, что и CSS.
            </P>
            <Table
              head={['Параметр', 'Тип', 'По умолчанию']}
              rows={[
                ['landscape', 'boolean', 'false'],
                ['paperWidth', 'string', '8.27in (A4)'],
                ['paperHeight', 'string', '11.7in (A4)'],
                ['marginTop / marginBottom', 'string', '0.39in'],
                ['marginLeft / marginRight', 'string', '0.39in'],
                ['waitDelay', 'string', '0s'],
              ]}
            />
            <P>
              <Code>waitDelay</Code> нужен, если страница дорисовывается
              скриптом: график, шрифт с CDN, данные по fetch. Без задержки
              PDF снимется до отрисовки.
            </P>
          </Section>

          {/* ----------------------------- Quota ------------------------- */}
          <Section id="quota" title="Квоты и лимиты">
            <P>
              Считаются <b>страницы готового документа</b>, а не запросы.
              Документ на сорок страниц стоит сорок.
            </P>
            {/*
              Цифры берутся из lib/plans.ts — того же файла, из которого
              их читают лендинг и калькулятор. Документация, расходящаяся
              с прайсом, хуже, чем её отсутствие.
            */}
            <Table
              head={['Тариф', 'Страниц в месяц', 'Запросов в секунду', 'Всплеск']}
              rows={PLANS.map((p) => [
                p.id,
                num(p.pages),
                String(p.rps),
                String(p.burst),
              ])}
            />
            <P>
              Страница резервируется до рендера и доначисляется после — реальный
              объём известен только по готовому файлу. Поэтому последний
              документ в месяце может выйти за лимит, но не более чем на себя
              самого: следующий запрос получит <Code>402</Code>.
            </P>
            <P>
              Превышение скорости даёт <Code>429</Code> с заголовком{' '}
              <Code>Retry-After</Code>. Считается по ключу, а не по аккаунту —
              шумный стейджинг не мешает проду.
            </P>
          </Section>

          {/* ----------------------------- Errors ------------------------ */}
          <Section id="errors" title="Коды ошибок">
            <P>Ошибки приходят JSON-объектом с полем <Code>error</Code>.</P>
            <Table
              head={['Код', 'HTTP', 'Что делать']}
              rows={[
                ['missing_api_key', '401', 'Добавьте заголовок с ключом'],
                ['invalid_api_key', '401', 'Ключ неизвестен или отозван'],
                ['email_not_verified', '403', 'Подтвердите почту в кабинете'],
                ['source_not_allowed', '403', 'Формат недоступен на вашем тарифе'],
                ['quota_exceeded', '402', 'Месячный лимит исчерпан'],
                ['rate_limit_exceeded', '429', 'Повторите через Retry-After секунд'],
                ['url_not_allowed', '400', 'Адрес ведёт во внутреннюю сеть'],
                ['render_failed', '502', 'Документ не отрендерился — проверьте разметку'],
                ['—', '504', 'Рендер не уложился в 30 секунд'],
              ]}
            />
            <CodeBlock
              lang="json"
              code={`{
  "error": "quota_exceeded",
  "message": "Исчерпан месячный лимит: 100 страниц.",
  "used": 100,
  "limit": 100
}`}
            />
          </Section>

          {/* ------------------------------ SDK -------------------------- */}
          <Section id="sdk" title="Примеры на языках">
            <H3>Node.js</H3>
            <CodeBlock
              lang="javascript"
              code={`import { writeFile } from 'node:fs/promises';

const res = await fetch('${API_BASE}/v1/convert', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${process.env.PDF_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ source: 'html', html: '<h1>Отчёт</h1>' }),
});

if (!res.ok) throw new Error(await res.text());

await writeFile('report.pdf', Buffer.from(await res.arrayBuffer()));
console.log('страниц:', res.headers.get('X-Pages-Rendered'));`}
            />

            <H3>Python</H3>
            <CodeBlock
              lang="python"
              code={`import os, requests

res = requests.post(
    "${API_BASE}/v1/convert",
    headers={"Authorization": f"Bearer {os.environ['PDF_KEY']}"},
    json={"source": "html", "html": "<h1>Отчёт</h1>"},
    timeout=60,
)
res.raise_for_status()

with open("report.pdf", "wb") as f:
    f.write(res.content)

print("страниц:", res.headers["X-Pages-Rendered"])`}
            />

            <H3>PHP</H3>
            <CodeBlock
              lang="php"
              code={`$ch = curl_init('${API_BASE}/v1/convert');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . getenv('PDF_KEY'),
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'source' => 'html',
        'html'   => '<h1>Накладная</h1>',
    ]),
]);
file_put_contents('invoice.pdf', curl_exec($ch));`}
            />

            <H3>Go</H3>
            <CodeBlock
              lang="go"
              code={`body, _ := json.Marshal(map[string]string{
    "source": "html",
    "html":   "<h1>Акт</h1>",
})

req, _ := http.NewRequest("POST",
    "${API_BASE}/v1/convert", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer "+os.Getenv("PDF_KEY"))
req.Header.Set("Content-Type", "application/json")

res, err := http.DefaultClient.Do(req)`}
            />

            <H3>Ruby</H3>
            <CodeBlock
              lang="ruby"
              code={`require 'net/http'
require 'json'

uri = URI('${API_BASE}/v1/convert')

req = Net::HTTP::Post.new(uri)
req['Authorization'] = "Bearer #{ENV.fetch('PDF_KEY')}"
req['Content-Type']  = 'application/json'
req.body = JSON.dump(source: 'html', html: '<h1>Договор</h1>')

res = Net::HTTP.start(uri.host, uri.port, use_ssl: true) { |http| http.request(req) }
raise res.body unless res.is_a?(Net::HTTPSuccess)

File.binwrite('contract.pdf', res.body)`}
            />

            <H3>C#</H3>
            <CodeBlock
              lang="csharp"
              code={`using var http = new HttpClient();
http.DefaultRequestHeaders.Authorization =
    new AuthenticationHeaderValue("Bearer", Environment.GetEnvironmentVariable("PDF_KEY"));

var payload = JsonSerializer.Serialize(new
{
    source = "html",
    html = "<h1>Смета</h1>",
});

var res = await http.PostAsync(
    "${API_BASE}/v1/convert",
    new StringContent(payload, Encoding.UTF8, "application/json"));

res.EnsureSuccessStatusCode();
await File.WriteAllBytesAsync("estimate.pdf", await res.Content.ReadAsByteArrayAsync());`}
            />
          </Section>
        </main>
      </div>

      <Footer />
    </>
  );
}

/* ---------------------------- Мелкие блоки ----------------------------- */

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-16 scroll-mt-[7.5rem] lg:scroll-mt-24">
      <h2 className="mb-5 border-b border-border pb-3 text-[26px] font-semibold tracking-[-0.02em]">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-3 text-[18px] font-medium tracking-tight">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-[68ch] text-[15.5px] leading-[1.75] text-muted">{children}</p>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-[5px] border border-border bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-fg">
      {children}
    </code>
  );
}

function Endpoint({ method, path }: { method: string; path: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-border bg-sunken px-4 py-3">
      <span className="rounded-md bg-accent px-2 py-0.5 font-mono text-[12px] font-semibold text-accent-fg">
        {method}
      </span>
      <span className="font-mono text-[14px]">{path}</span>
    </div>
  );
}

function Callout({
  children,
  tone = 'info',
}: {
  children: React.ReactNode;
  tone?: 'info' | 'warn';
}) {
  return (
    <div
      className={
        tone === 'warn'
          ? 'rounded-[10px] border-l-2 border-warning bg-warning/8 px-4 py-3 text-[14.5px] leading-relaxed text-fg'
          : 'rounded-[10px] border-l-2 border-accent bg-accent-soft px-4 py-3 text-[14.5px] leading-relaxed text-fg'
      }
    >
      {children}
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-border">
      <table className="w-full min-w-[520px] text-left text-[14px]">
        <thead className="bg-sunken">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 font-medium text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              {r.map((c, j) => (
                <td
                  key={j}
                  className={j === 0 ? 'px-4 py-2.5 font-mono text-[13px]' : 'px-4 py-2.5 text-muted'}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
