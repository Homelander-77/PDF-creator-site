'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Badge, Button, ButtonLink, Card, Input, Skeleton, Toast, cn } from '@/components/ui';
import { CodeBlock } from '@/components/code-block';
import { ApiError, api, type ApiKey, type Me, type NewApiKey } from '@/lib/api';
import { PLANS, num } from '@/lib/plans';
import { plural } from '@/lib/time';
import { loginUrl } from '@/lib/next-url';

/** Сессия истекла посреди работы — сервер ответил 401. */
const isExpired = (err: unknown) => err instanceof ApiError && err.status === 401;

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [fresh, setFresh] = useState<NewApiKey | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'error' } | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Подтверждение отзыва: id ключа, для которого показан вопрос.
  const [confirming, setConfirming] = useState<string | null>(null);

  /**
   * Загрузка данных кабинета.
   *
   * Раньше при неудаче me оставался null — и человек видел вечный скелет
   * без единого намёка, что что-то сломалось. Теперь неудача переходит
   * в явное состояние с кнопкой «Повторить».
   */
  const load = useCallback(async () => {
    setLoadError(null);
    const [m, k] = await Promise.allSettled([api.me(), api.keys()]);

    if (m.status === 'fulfilled') setMe(m.value);
    if (k.status === 'fulfilled') setKeys(k.value.keys);

    const failed = [m, k].find((r) => r.status === 'rejected');
    if (!failed) return;

    const reason = (failed as PromiseRejectedResult).reason;
    if (isExpired(reason)) {
      router.replace(loginUrl(pathname));
      return;
    }
    // Любая неудача — явная ошибка с кнопкой «Повторить». Раньше она
    // показывалась, только если упали ОБА запроса: не загрузилась одна
    // квота — и над ней вечно висел скелет без единого объяснения.
    setLoadError(reason instanceof ApiError ? reason.message : 'Не удалось загрузить данные.');
    if (k.status === 'rejected') setKeys((prev) => prev ?? []);
  }, [router, pathname]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e?: FormEvent) {
    e?.preventDefault();
    if (creating) return;
    setCreating(true);
    setBlocked(null);
    try {
      const key = await api.createKey(name.trim() || 'default');
      setFresh(key);
      setName('');
      await load();
    } catch (err) {
      if (isExpired(err)) {
        router.replace(loginUrl(pathname));
      } else if (err instanceof ApiError && err.code === 'email_not_verified') {
        setBlocked(err.message);
      } else {
        setToast({
          msg: err instanceof ApiError ? err.message : 'Не удалось выпустить ключ.',
          tone: 'error',
        });
      }
    } finally {
      setCreating(false);
    }
  }

  /**
   * Отзыв необратим, поэтому спрашиваем — но подтверждением прямо в строке,
   * а не через window.confirm. Системное окно блокирует поток браузера,
   * не поддаётся оформлению и на телефоне выглядит чужеродно.
   */
  async function revoke(id: string) {
    setConfirming(null);
    try {
      await api.revokeKey(id);
      setKeys((k) => (k ?? []).filter((x) => x.id !== id));
      setToast({ msg: 'Ключ отозван — он перестал работать.', tone: 'success' });
    } catch (err) {
      if (isExpired(err)) {
        router.replace(loginUrl(pathname));
        return;
      }
      setToast({
        msg: err instanceof ApiError ? err.message : 'Не удалось отозвать ключ.',
        tone: 'error',
      });
    }
  }

  const used = me?.usage.pages_used ?? 0;
  const limit = me?.usage.pages_limit ?? 100;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const plan = PLANS.find((p) => p.id === me?.plan);

  return (
    <div className="page-enter mx-auto max-w-5xl px-5 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Ключи</h1>
          <p className="mt-1 text-[15px] text-muted">
            Отдельный ключ на каждое окружение — так утечка одного не задевает
            остальные.
          </p>
        </div>
        {me && (
          <div className="flex items-center gap-3">
            <Badge tone={me.plan === 'free' ? 'neutral' : 'accent'}>
              {plan?.name ?? me.plan}
            </Badge>
            {me.plan !== 'business' && (
              <ButtonLink href="/pricing" size="sm" variant="secondary">
                Повысить тариф
              </ButtonLink>
            )}
          </div>
        )}
      </div>

      {loadError && (
        <Card className="animate-fade-in mb-6 border-danger/30 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium text-danger">{loadError}</div>
              {/* Подсказка про порт нужна разработчику, а не клиенту. */}
              {process.env.NODE_ENV === 'development' && (
                <p className="mt-1 text-[14px] text-muted">
                  Проверьте, запущен ли сервер API на 3001.
                </p>
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={() => void load()}>
              Повторить
            </Button>
          </div>
        </Card>
      )}

      {/* ------------------------------ Квота ---------------------------- */}
      <Card className="mb-6 p-6">
        {me ? (
          <>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="text-[26px] font-semibold tracking-[-0.02em]">
                  {num(used)}
                </span>
                <span className="text-[15px] text-muted">
                  {' / '}
                  {num(limit)} {plural(limit, 'страница', 'страницы', 'страниц')}
                </span>
              </div>
              <span className="font-mono text-[13px] text-subtle">
                {periodLabel(me.period)} · {me.limits.requests_per_second} req/s
              </span>
            </div>

            {/* Полоса растёт трансформом по оси X, а не изменением width —
                width каждый кадр пересчитывает раскладку соседей. */}
            <div className="h-2 overflow-hidden rounded-full bg-sunken">
              <div
                className="h-full origin-left rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] transition-transform duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
                style={{ transform: `scaleX(${pct / 100})`, width: '100%' }}
              />
            </div>

            <p className="mt-2.5 text-[13.5px] text-muted">
              {me.usage.pages_remaining === 0 ? (
                <span className="text-danger">
                  Страницы на этот период закончились — запросы получают 402.
                </span>
              ) : (
                <>
                  {plural(me.usage.pages_remaining, 'Осталась', 'Осталось', 'Осталось')}{' '}
                  {num(me.usage.pages_remaining)}{' '}
                  {plural(me.usage.pages_remaining, 'страница', 'страницы', 'страниц')}
                  {pct >= 80 && (
                    <span className="text-warning"> — квота почти исчерпана</span>
                  )}
                </>
              )}
            </p>
          </>
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-2 w-full" />
          </div>
        )}
      </Card>

      {/* --------------------------- Новый ключ -------------------------- */}
      {fresh && (
        <Card className="animate-fade-up mb-6 border-accent/40 p-6">
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            <h2 className="font-medium">Ключ «{fresh.name}» создан</h2>
          </div>
          <p className="mb-4 text-[14px] text-muted">
            Скопируйте его сейчас. Мы храним только хеш — показать значение
            второй раз невозможно.
          </p>
          <CodeBlock code={fresh.api_key} filename="api key" />
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={() => setFresh(null)}>
              Ключ сохранён
            </Button>
          </div>
        </Card>
      )}

      {/* --------------------------- Создание ---------------------------- */}
      <Card className="mb-6 p-6">
        <h2 className="mb-4 font-medium">Выпустить ключ</h2>
        {/* Форма, а не div: Enter в поле названия выпускает ключ. */}
        <form onSubmit={create} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label="Название"
            placeholder="production"
            value={name}
            onChange={(e) => setName(e.target.value)}
            hint="Понадобится, чтобы понимать, какой ключ где используется."
          />
          <Button type="submit" loading={creating} className="sm:mb-6">
            Выпустить
          </Button>
        </form>

        {blocked && (
          <div className="animate-fade-in mt-4 rounded-[10px] border border-warning/25 bg-warning/8 px-3.5 py-2.5 text-[14px] text-warning">
            {blocked}
          </div>
        )}
      </Card>

      {/* ----------------------------- Список ---------------------------- */}
      <Card className="overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-medium">Активные ключи</h2>
        </div>

        {keys === null ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : keys.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-[15px] text-muted">Пока ни одного ключа.</p>
            <p className="mt-1 text-[13.5px] text-subtle">
              Выпустите первый — и можно делать запросы.
            </p>
          </div>
        ) : (
          <ul>
            {keys.map((k, i) => (
              <li
                key={k.id}
                className={cn(
                  'flex flex-wrap items-center gap-4 px-6 py-4',
                  i > 0 && 'border-t border-border',
                  'transition-colors duration-200 hover:bg-sunken/60',
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{k.name}</div>
                  <div className="mt-0.5 font-mono text-[13px] text-subtle">
                    {k.key_prefix}
                    <span className="text-border-strong">••••••••••••</span>
                  </div>
                </div>

                <KeyMeta lastUsed={k.last_used_at} created={k.created_at} />

                {confirming === k.id ? (
                  <div className="animate-fade-in flex items-center gap-2">
                    <span className="text-[13px] text-muted">Точно?</span>
                    <Button variant="danger" size="sm" onClick={() => revoke(k.id)}>
                      Отозвать
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirming(null)}
                    >
                      Отмена
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirming(k.id)}
                  >
                    Отозвать
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {toast && (
        <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />
      )}
    </div>
  );
}

/**
 * Когда ключ работал и когда появился — двумя подписанными блоками.
 *
 * Раньше это были две серые строки подряд, «использован …» и «создан …»,
 * и глаз не отличал одну от другой. Теперь у каждой своя подпись, а
 * активность видна по точке, ещё до чтения текста:
 *
 *   зелёная — запросы шли за последние сутки, ключ живой;
 *   серая   — использовался, но давно;
 *   пустая  — запросов не было ни разу.
 */
function KeyMeta({ lastUsed, created }: { lastUsed: string | null; created: string }) {
  const recent =
    lastUsed !== null && Date.now() - new Date(lastUsed).getTime() < 86_400_000;

  return (
    <dl className="flex gap-6 text-[13px] sm:text-right">
      <div>
        <dt className="text-[11.5px] text-subtle">Последний запрос</dt>
        <dd
          className="mt-0.5 flex items-center gap-1.5 sm:justify-end"
          title={lastUsed ? full(lastUsed) : undefined}
        >
          <span
            aria-hidden
            className={cn(
              'h-1.5 w-1.5 shrink-0 rounded-full',
              lastUsed === null
                ? 'border border-border-strong'
                : recent
                  ? 'bg-success ring-[3px] ring-success/15'
                  : 'bg-border-strong',
            )}
          />
          {lastUsed === null ? (
            <span className="text-subtle">ещё не было</span>
          ) : (
            <span className={recent ? 'text-fg' : 'text-muted'}>{fmt(lastUsed)}</span>
          )}
        </dd>
      </div>
      <div>
        <dt className="text-[11.5px] text-subtle">Создан</dt>
        <dd className="mt-0.5 text-muted" title={full(created)}>
          {fmt(created, false)}
        </dd>
      </div>
    </dl>
  );
}

/**
 * «Сегодня, 14:32», «вчера, 09:05», «3 дня назад», «12 сент. 2026».
 *
 * Сегодня и вчера — по календарю, а не «меньше суток назад»: иначе
 * запрос в 23:50 вчерашнего дня в 00:10 назывался бы «сегодня».
 */
function fmt(iso: string, withTime = true): string {
  const d = new Date(iso);
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
  const time = d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });

  if (days <= 0) return withTime ? `сегодня, ${time}` : 'сегодня';
  if (days === 1) return withTime ? `вчера, ${time}` : 'вчера';
  if (days < 30) return `${days} ${plural(days, 'день', 'дня', 'дней')} назад`;
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Полная дата для подсказки при наведении. */
function full(iso: string): string {
  return new Date(iso).toLocaleString('ru', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Сервер отдаёт начало периода датой: «2026-09-11» — у платного тарифа это
 * день оплаты, у бесплатного 1-е число. Сырая дата читается как отладка,
 * поэтому пишем словами. Старый формат «2026-09» тоже разбирается.
 */
function periodLabel(period: string): string {
  const d = new Date(period.length === 7 ? `${period}-01` : period);
  if (Number.isNaN(d.getTime())) return `период ${period}`;
  return `период с ${d.toLocaleDateString('ru', { day: 'numeric', month: 'long', timeZone: 'UTC' })}`;
}
