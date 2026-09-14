import {
  isRetiredFilePath,
  retiredFilesResponse,
} from "../server/retired-files";

// Also cover bare /view, trailing slashes, and descendants before static fallback.
export const onRequest: PagesFunction = (context) => {
  const url = new URL(context.request.url);
  let path: string;
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    return new Response("Invalid path", { status: 400 });
  }
  return isRetiredFilePath(path) ? retiredFilesResponse() : context.next();
};
