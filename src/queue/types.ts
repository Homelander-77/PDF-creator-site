import type { RenderInput } from '../render/index.js';

export interface RenderJobData {
    input: RenderInput;
}

export interface RenderJobResult {
    pdfBase64: string;
    pages: number;
    ms: number;
}
