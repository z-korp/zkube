import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/ui/utils";

const TooltipProvider = TooltipPrimitive.Provider;

// ─── Touch detection ───
const getIsTouch = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

const subscribeTouch = (cb: () => void) => {
  const mql = window.matchMedia("(hover: none)");
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};

// ─── Context for touch-toggle state ───
const TouchCtx = React.createContext<{
  isTouch: boolean;
  toggle: () => void;
} | null>(null);

// ─── Tooltip root — adds controlled open/close for touch devices ───
const Tooltip: React.FC<
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>
> = ({ children, open: controlledOpen, onOpenChange, ...props }) => {
  const [touchOpen, setTouchOpen] = React.useState(false);
  const isTouch = React.useSyncExternalStore(subscribeTouch, getIsTouch, () => false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>();

  const toggle = React.useCallback(() => {
    setTouchOpen((prev) => {
      const next = !prev;
      clearTimeout(timerRef.current);
      if (next) {
        // Auto-dismiss after 2.5s
        timerRef.current = setTimeout(() => setTouchOpen(false), 2500);
      }
      return next;
    });
  }, []);

  React.useEffect(() => () => clearTimeout(timerRef.current), []);

  // If caller already controls open state, pass through
  if (controlledOpen !== undefined) {
    return (
      <TooltipPrimitive.Root open={controlledOpen} onOpenChange={onOpenChange} {...props}>
        <TouchCtx.Provider value={{ isTouch, toggle }}>{children}</TouchCtx.Provider>
      </TooltipPrimitive.Root>
    );
  }

  // Touch: controlled via tap toggle. Pointer: uncontrolled (hover).
  return (
    <TooltipPrimitive.Root
      open={isTouch ? touchOpen : undefined}
      onOpenChange={isTouch ? setTouchOpen : onOpenChange}
      {...props}
    >
      <TouchCtx.Provider value={{ isTouch, toggle }}>{children}</TouchCtx.Provider>
    </TooltipPrimitive.Root>
  );
};

// ─── Trigger — adds click toggle on touch devices ───
const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ onClick, ...props }, ref) => {
  const ctx = React.useContext(TouchCtx);

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ctx?.isTouch) {
        ctx.toggle();
      }
      onClick?.(e);
    },
    [ctx, onClick],
  );

  return <TooltipPrimitive.Trigger ref={ref} onClick={handleClick} {...props} />;
});
TooltipTrigger.displayName = "TooltipTrigger";

// ─── Content — unchanged ───
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-[2000] overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
