export class RenderError extends Error {
  constructor(readonly code: | 'url_not_allowed' | 'render_failed' | 'render_timeout' | 'unavailable') { 
    super(code); 
  }
}
