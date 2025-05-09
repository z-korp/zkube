/* eslint-disable @typescript-eslint/no-explicit-any */
import { hexToAscii } from "@dojoengine/utils";
import { components, translateName } from "./components.ts";

function parseData(value: any, type: any) {
  switch (typeof type) {
    case "string":
      return hexToAscii(value);
    case "number":
      return parseInt(value);
    case "boolean":
      return Boolean(parseInt(value));
    default:
      return value;
  }
}

export function translateEvent(event: any) {
  const name = translateName(event.keys[1]);
  const data = event.data;

  const keysNumber = parseInt(data[0]);

  if (!components[name as keyof typeof components]) return;
  const component = components[name as keyof typeof components];

  const values = [
    ...data.slice(1, 1 + keysNumber),
    ...data.slice(keysNumber + 2),
  ];
  const parsedFields = Object.keys(component).reduce((acc, key, index) => {
    if (component[key as keyof typeof component] === "array") {
      return {
        ...acc,
        [key]: values
          .splice(index + 1, parseInt(values[index]))
          .map((x) => parseInt(x)),
      };
    }

    return {
      ...acc,
      [key]: parseData(values[index], component[key as keyof typeof component]),
    };
  }, {});

  return {
    componentName: name,
    ...parsedFields,
  };
}
