import { useState } from "react";

const useTemplateTheme = () => {
  const [themeTemplate, setThemeTemplate] = useState("theme-1");

  return { themeTemplate };
};

export default useTemplateTheme;
