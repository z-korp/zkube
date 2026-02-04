import { useState, useEffect } from "react";

const useTemplateTheme = () => {
  const [themeTemplate, setThemeTemplate] = useState("theme-1");

  useEffect(() => {
    console.log("ThemeTemplate updated:", themeTemplate);
  }, [themeTemplate]);

  return { themeTemplate, setThemeTemplate };
};

export default useTemplateTheme;
