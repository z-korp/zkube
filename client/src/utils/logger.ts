type LogArgs = unknown[];

const isDev = import.meta.env.DEV;

export function createLogger(scope: string) {
  const withScope = (args: LogArgs) => [`[${scope}]`, ...args];

  return {
    debug: (...args: LogArgs) => {
      if (isDev) console.debug(...withScope(args));
    },
    info: (...args: LogArgs) => {
      if (isDev) console.info(...withScope(args));
    },
    warn: (...args: LogArgs) => {
      if (isDev) console.warn(...withScope(args));
    },
    error: (...args: LogArgs) => {
      console.error(...withScope(args));
    },
  };
}
