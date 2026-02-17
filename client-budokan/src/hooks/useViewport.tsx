import { useEffect } from "react";

const useViewport = () => {
  useEffect(() => {
    const setViewportHeight = () => {
      // Get the viewport height and multiply by 1% to get a value for a vh unit
      const vh = window.innerHeight * 0.01;
      // Set the value in the --vh custom property to the root of the document
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    // Initial call
    setViewportHeight();
    // Re-calculate on resize
    window.addEventListener("resize", setViewportHeight);
    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener("resize", setViewportHeight);
    };
  }, []);
};
export default useViewport;
