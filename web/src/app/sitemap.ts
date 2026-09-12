import type { MetadataRoute } from 'next';
import { PUBLIC_ROUTES, SITE_URL } from '@/lib/site';

/**
 * sitemap.xml — список страниц, которые имеет смысл индексировать.
 *
 * Собирается из PUBLIC_ROUTES в lib/site.ts, а не перечисляется здесь
 * заново: два независимых списка страниц неизбежно разъезжаются, и первым
 * отстаёт тот, который никто не видит глазами.
 *
 * lastModified ставим датой сборки. Точнее было бы брать дату изменения
 * содержимого, но для двух почти статичных страниц это лишняя механика.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
