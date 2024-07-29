import { useState } from "react";

const useTemplateTheme = () => {
  const [themeTemplate, setThemeTemplate] = useState("theme-2");

  return { themeTemplate };
};

export default useTemplateTheme;
