type LogColor = "info" | "success" | "danger";
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

export function consoleTSLog(...args: any[]): void {
  const now = new Date();
  const time = now.toTimeString().split(" ")[0];
  const milliseconds = now.getMilliseconds().toString().padStart(3, "0");

  let color: LogColor | undefined;
  let messageArgs: any[];

  // Vérifier si le premier argument est une couleur
  if (
    typeof args[0] === "string" &&
    ["info", "success", "danger"].includes(args[0])
  ) {
    color = args[0] as LogColor;
    messageArgs = args.slice(1); // Exclut la couleur des arguments du message
  } else {
    color = "info"; // Couleur par défaut
    messageArgs = args; // Utilise tous les arguments comme message
  }

  // Définir la couleur de fond selon le type de log
  let backgroundColor;
  switch (color) {
    case "info":
      backgroundColor = "blue";
      break;
    case "success":
      backgroundColor = "green";
      break;
    case "danger":
      backgroundColor = "red";
      break;
  }

  // Afficher le message avec le timestamp stylisé
  console.log(
    `%c[${time}.${milliseconds}]`,
    `font-weight: bold; background-color: ${backgroundColor}; color: white; padding: 2px 4px; border-radius: 3px;`,
    ...messageArgs,
  );
}
