import type { PlatformError, PlatformErrorCode } from "../errors";

export type AdapterErrorReport = {
  path: string;
  code: PlatformErrorCode;
  message: string;
};

export function formatAdapterError(error: PlatformError): AdapterErrorReport {
  return {
    path: error.path ?? "adapter",
    code: error.code,
    message: error.message,
  };
}
