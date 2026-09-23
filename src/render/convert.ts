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
);

export type RenderResult = { pdf: Buffer; pages: number; ms: number };

export class RenderError extends Error {
    constructor(readonly code: 'url_not_allowed' | 'render_failed' | 'render_timeout' | 'unavailable') {
        super(code);
    }
}

export async function render(input: RenderInput): Promise<RenderResult> {
    const pages = Number(process.env.FAKE_PAGES ?? 1);
    return {
        pdf: Buffer.from('%PDF-1.4\n% заглушка\n'),
        pages: Math.min(pages, input.maxPages),
        ms: 0,
    };
}
