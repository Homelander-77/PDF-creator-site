import { PDFDocument } from 'pdf-lib';
import { marked } from 'marked';

import { RenderError } from './errors.js';
import { validateWaitDelay } from './options.js';
import { assertHttpUrlAllowed } from './safetyUrl.js';

export { RenderError } from './errors.js';

export type PageOptions = {
    landscape?: boolean;
    paperWidth?: string; paperHeight?: string;
    marginTop?: string; marginBottom?: string;
    marginLeft?: string; marginRight?: string;
    waitDelay?: string;
};

export type RenderInput = { maxPages: number; options?: PageOptions } & (
    | { source: 'html'; html: string }
    | { source: 'url'; url: string }
    | { source: 'markdown'; markdown: string }
    | { source: 'office'; filename: string; fileBase64: string }
);

export type RenderResult = { pdf: Buffer; pages: number; ms: number };

const GOTENBERG = process.env.GOTENBERG_URL ?? 'http://localhost:3100';

export async function render(input: RenderInput): Promise<RenderResult> {
    const started = Date.now();
    const form = new FormData();
    let path: string;

    if (input.source === 'url') {
        await assertHttpUrlAllowed(input.url);
        path = '/forms/chromium/convert/url';
        form.append('url', input.url);
    } else if (input.source === 'office') {
        path = '/forms/libreoffice/convert';
        const file = Buffer.from(input.fileBase64, 'base64');
        form.append('files', new Blob([file]), input.filename);
    } else {
        const html = input.source === 'markdown' ? await marked.parse(input.markdown) : input.html;
        path = '/forms/chromium/convert/html';
        form.append('files', new Blob([html], { type: 'text/html' }), 'index.html');
    }

    form.append('nativePageRanges', `1-${input.maxPages}`);

    if (input.source === 'office') {
        if (input.options?.landscape !== undefined) {
            form.append('landscape', String(input.options.landscape));
        }
    } else {
        validateWaitDelay(input.options?.waitDelay);
        for (const [k, v] of Object.entries(input.options ?? {})) {
            if (v !== undefined) {
                form.append(k, String(v));
            }
        }
    }

    for (const [k, v] of Object.entries(input.options ?? {})) {
        if (v !== undefined) {
          form.append(k, String(v));
        }
    }

    let res: Response;
    try {
        res = await fetch(GOTENBERG + path, {
            method: 'POST',
            body: form,
            signal: AbortSignal.timeout(30_000),
        });
    } catch (e) {
        if ((e as Error).name === 'TimeoutError') throw new RenderError('render_timeout');
        throw new RenderError('unavailable');
    }

    if (!res.ok) {
      const message = await res.text();
      if (res.status === 503 && message.includes('The request exceeded the time limit')) {
        throw new RenderError('render_timeout');
      }
      throw new RenderError('render_failed');
    }

    const pdf = Buffer.from(await res.arrayBuffer());
    const pages = (await PDFDocument.load(pdf)).getPageCount();
    return { pdf, pages, ms: Date.now() - started };
}
