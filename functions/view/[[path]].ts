import { retiredFilesResponse } from "../../server/retired-files";

export const onRequest: PagesFunction = () => retiredFilesResponse();
