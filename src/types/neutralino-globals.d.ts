export {};

declare global {
  interface Window {
    NL_APPID?: string;
    NL_ARGS?: string[];
    NL_CINJECTED?: boolean;
    NL_GINJECTED?: boolean;
    NL_PATH?: string;
    NL_PORT?: string | number;
    NL_TOKEN?: string;
  }
}
