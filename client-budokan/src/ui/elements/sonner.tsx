import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import { useMediaQuery } from "react-responsive";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ position, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  
  // On mobile, show toasts at top-center; on desktop use the provided position or default
  const responsivePosition = isMobile ? "top-center" : (position ?? "bottom-right");

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={responsivePosition}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
