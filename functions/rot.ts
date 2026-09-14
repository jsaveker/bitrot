import { retiredFilesResponse } from "../server/retired-files";

// All methods fail closed, including legacy clients and preflight requests.
export const onRequest: PagesFunction = () => retiredFilesResponse();
