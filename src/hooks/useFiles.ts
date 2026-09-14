import { useSyncExternalStore } from "react";
import { localFiles } from "../lib/local-files";
export function useFiles() {
  useSyncExternalStore(
    localFiles.subscribe,
    localFiles.getVersion,
    localFiles.getVersion,
  );
  return {
    files: localFiles.list(),
    file: localFiles.selectedId
      ? localFiles.get(localFiles.selectedId)
      : undefined,
    busy: localFiles.processing,
  };
}
