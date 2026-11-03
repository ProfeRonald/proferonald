export function createPageHandler({ template, getPost, render }) {
  return async (req, res) => {
    // No shared cache can retain a withdrawn publication or private preview.
    res.set('Cache-Control', 'private,no-store,max-age=0');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (!['GET', 'HEAD'].includes(req.method)) { res.set('Allow', 'GET, HEAD'); res.status(405).send('Método no permitido'); return; }
    const url = new URL(req.originalUrl || req.url, 'https://proferonald.com');
    const id = /^\/publicaciones\/([-\w]{20})\/?$/.exec(url.pathname)?.[1];
    if (!id) { res.status(404).send('Publicación no disponible'); return; }
    try {
      const shell = await template();
      // Private previews are only an empty shell. The client must authenticate before reading a draft.
      if (url.searchParams.get('preview') === '1') { res.set('X-Robots-Tag', 'noindex,nofollow'); res.status(200).type('html').send(shell); return; }
      const html = await render(shell, id, await getPost(id));
      if (!html) { res.status(404).send('Publicación no disponible'); return; }
      res.status(200).type('html').send(html);
    } catch {
      console.error('[ProfeRonald]', 'public-page', 'app/read-error');
      res.status(503).send('No se pudo cargar la publicación. Vuelve a intentarlo.');
    }
  };
}
