/* eslint-disable @typescript-eslint/no-explicit-any */
import { dojoConfig } from "../../../../dojo.config";

export const get_short_namespace = (namespace: any) => {
  const parts = namespace.split("_");
  const short =
    parts[0] +
    parts
      .slice(1)
      .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  return short;
};

export const translateName = (selector: any) => {
  const model = dojoConfig().manifest.models.find(
    (model: any) => model.selector === selector
  );
  return model?.tag?.split("-")[1];
};
