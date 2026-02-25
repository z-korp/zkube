import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import type { HTMLAttributes } from "react";
import Grid from "./Grid";
import type { BonusType } from "../../dojo/game/types/bonus";
import { useMoveStore } from "../../stores/moveTxStore";

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock("./ConfettiExplosion", () => ({
  default: () => <div data-testid="confetti" />,
}));

vi.mock("../elements/animatedText", () => ({
  default: () => null,
}));

vi.mock("@/dojo/useDojo", () => ({
  useDojo: () => ({
    setup: {
      systemCalls: {
        move: vi.fn(async () => undefined),
      },
    },
  }),
}));

vi.mock("@/contexts/hooks", () => ({
  useMusicPlayer: () => ({
    playExplode: vi.fn(),
    playSwipe: vi.fn(),
  }),
}));

vi.mock("@/ui/elements/theme-provider/hooks", () => ({
  useTheme: () => ({ themeTemplate: "theme-1" }),
}));

vi.mock("@/config/themes", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/config/themes")>();
  return {
    ...actual,
    getThemeColors: () => ({
      particles: {
        explosion: ["#ffffff"],
      },
    }),
  };
});

vi.mock("@/hooks/useGridAnimations", () => ({
  default: () => ({
    shouldBounce: false,
    animateText: undefined,
    resetAnimateText: vi.fn(),
    setAnimateText: vi.fn(),
    animatedPoints: 0,
    setAnimatedPoints: vi.fn(),
    animatedCubes: 0,
    setAnimatedCubes: vi.fn(),
  }),
}));

vi.mock("@/hooks/useTransitionBlocks", () => ({
  default: () => ({
    transitioningBlocks: [],
    handleTransitionBlockStart: vi.fn(),
    handleTransitionBlockEnd: vi.fn(),
  }),
}));

describe("Grid drag interactions", () => {
  const baseProps = {
    gameId: 1,
    initialData: [{ id: 1, x: 0, y: 9, width: 1 }],
    nextLineData: [],
    setNextLineHasBeenConsumed: vi.fn(),
    gridSize: 20,
    gridWidth: 8,
    gridHeight: 10,
    selectBlock: vi.fn(),
    bonus: "None" as BonusType,
    account: null,
    isTxProcessing: false,
    setIsTxProcessing: vi.fn(),
    score: 0,
    combo: 0,
    maxCombo: 0,
    setOptimisticScore: vi.fn(),
    setOptimisticCombo: vi.fn(),
    setOptimisticMaxCombo: vi.fn(),
    activeBonusLevel: 0,
    levelTransitionPending: false,
  };

  beforeEach(() => {
    useMoveStore.setState({
      isMoveComplete: false,
      queue: [],
      isQueueProcessing: false,
      lastFailedMoveError: null,
    });
  });

  it("desktop drag remains responsive after a no-move click", () => {
    const { container } = render(<Grid {...baseProps} />);
    const block = container.querySelector(".block") as HTMLDivElement;
    const surface = container.querySelector("#grid .display-grid") as HTMLDivElement;

    expect(block.style.left).toBe("1px");

    fireEvent.mouseDown(block, { clientX: 10 });
    fireEvent.mouseUp(document);

    fireEvent.mouseDown(block, { clientX: 10 });
    fireEvent.mouseMove(surface, { clientX: 50 });

    expect((container.querySelector(".block") as HTMLDivElement).style.left).not.toBe("1px");
  });

  it("mobile drag remains responsive after a no-move tap", () => {
    const { container } = render(<Grid {...baseProps} />);
    const block = container.querySelector(".block") as HTMLDivElement;
    const surface = container.querySelector("#grid .display-grid") as HTMLDivElement;

    expect(block.style.left).toBe("1px");

    fireEvent.touchStart(block, {
      touches: [{ clientX: 10, clientY: 10 }],
    });
    fireEvent.touchEnd(document, {
      changedTouches: [{ clientX: 10, clientY: 10 }],
    });

    fireEvent.touchStart(block, {
      touches: [{ clientX: 10, clientY: 10 }],
    });
    fireEvent.touchMove(surface, {
      touches: [{ clientX: 50, clientY: 10 }],
    });

    expect((container.querySelector(".block") as HTMLDivElement).style.left).not.toBe("1px");
  });
});
