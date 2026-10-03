import { PDFDocument } from 'pdf-lib';
import { marked } from 'marked';

const GOTENBERG = process.env.GOTENBERG_URL ?? 'http://localhost:3100';

export type PageOption = {
    landscape?: boolean;
    paperWidth?: string; paperHeight?: string;
    marginTop?: string; marginBottom?: string;
    marginLeft?: string; marginRight?: string;
    waitDelay?: string;
};

export type RenderInput = { maxPages: number; option?: PageOption } & (
    | { source: 'html', html: string }
    | { source: 'url', url: string }
    | { source: 'markdown', markdown: string }
);

export type RenderResult = { pdf: Buffer; pages: number; ms: number };

export class RenderError extends Error {
    constructor(readonly code: 'url_not_allowed' | 'render_failed' | 'render_timeout' | 'unavailable') {
        super(code);
    }
}

export async function render(input: RenderInput) {

}


