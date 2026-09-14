/** Public cloud-file storage is retired. Never inspect bodies or access storage here. */
export function retiredFilesResponse(): Response {
  return new Response(
    JSON.stringify({
      error:
        "Cloud file storage is retired. Open /lab to work with files locally in your browser.",
      code: "CLOUD_FILES_RETIRED",
    }),
    {
      status: 410,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy":
          "default-src 'none'; frame-ancestors 'none'; sandbox",
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Bitrot-File-Policy": "local-only-v1",
      },
    },
  );
}

export function isRetiredFilePath(pathname: string): boolean {
  return /^\/(upload|list|view|rot|freeze)(\/|$)/i.test(pathname);
}
