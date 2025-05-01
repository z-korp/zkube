import React, {
  useCallback,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import "../../../grid.css";
import { Account } from "starknet";
import { GameState } from "@/enums/gameEnums";
import { Block } from "@/types/types";
import {
  removeCompleteRows,
  concatenateAndShiftBlocksTutorial,
  isGridFull,
  removeBlocksSameWidth,
  removeBlocksSameRow,
  removeBlockId,
  getBlocksSameRow,
  getBlocksSameWidth,
} from "@/utils/gridUtils";
import { MoveType } from "@/enums/moveEnum";
import AnimatedText from "../../elements/animatedText";
import { ComboMessages } from "@/enums/comboEnum";
import { motion } from "framer-motion";
import { BonusType } from "@/dojo/game/types/bonus";
import BlockContainer from "./TutorialBlock";
import ConfettiExplosion, { ConfettiExplosionRef } from "../ConfettiExplosion";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/elements/alert-dialog";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";

interface GridProps {
  initialData: Block[];
  nextLineData: Block[];
  gridSize: number;
  gridWidth: number;
  gridHeight: number;
  selectBlock: (block: Block) => void;
  onMove?: (rowIndex: number, startIndex: number, finalIndex: number) => void;
  bonus: BonusType;
  account: Account | null;
  tutorialStep: number;
  tutorialTargetBlock: { x: number; y: number; type: "block" | "row" }[] | null;
  onUpdate: (intermission: boolean) => void;
  ref: any;
  intermission?: boolean;
  setHighlightedTiki?: (highlighted: boolean) => void;
  setHighlightedWave?: (highlighted: boolean) => void;
  setHighlightedHammer?: (highlighted: boolean) => void;
  setDisabledTiki?: (disabled: boolean) => void;
  setDisabledWave?: (disabled: boolean) => void;
  setDisabledHammer?: (disabled: boolean) => void;
}

const TutorialGrid: React.FC<GridProps> = forwardRef(
  (
    {
      initialData,
      nextLineData,
      gridHeight,
      gridWidth,
      gridSize,
      selectBlock,
      onMove,
      bonus,
      account,
      tutorialStep,
      tutorialTargetBlock,
      onUpdate,
      intermission,
      setDisabledHammer,
      setDisabledTiki,
      setDisabledWave,
      setHighlightedHammer,
      setHighlightedTiki,
      setHighlightedWave,
    },
    ref,
  ) => {
    const gravitySpeed = 100;

    const [blocks, setBlocks] = useState<Block[]>(initialData);
    const [isMoving, setIsMoving] = useState(true);
    const [gameState, setGameState] = useState<GameState>(GameState.WAITING);
    const [transitioningBlocks, setTransitioningBlocks] = useState<number[]>(
      [],
    );
    const [lineExplodedCount, setLineExplodedCount] = useState(0);
    const [shouldBounce, setShouldBounce] = useState(false);
    const [animateText, setAnimateText] = useState<ComboMessages>(
      ComboMessages.None,
    );
    const explosionRef = useRef<ConfettiExplosionRef>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const [gridPosition, setGridPosition] = useState<DOMRect | null>(null);
    const [dragging, setDragging] = useState<Block | null>(null);
    const [dragStartX, setDragStartX] = useState(0);
    const [initialX, setInitialX] = useState(0);
    const [pendingMove, setPendingMove] = useState<{
      block: Block;
      rowIndex: number;
      startX: number;
      finalX: number;
    } | null>(null);
    const [blockBonus, setBlockBonus] = useState<Block | null>(null);
    const [actionPerformed, setActionPerformed] = useState(false);
    const [bonusSelectWarning, setBonusSelectWarning] = useState(false);

    const { themeTemplate } = useTheme();
    const imgAssets = ImageAssets(themeTemplate);

    useEffect(() => {
      if (gridRef.current) {
        const position = gridRef.current.getBoundingClientRect();
        setGridPosition(position);
      }
    }, []);

    const handleTransitionBlockStart = (id: number) => {
      setTransitioningBlocks((prev) => [...prev, id]);
    };

    const handleTransitionBlockEnd = (id: number) => {
      setTransitioningBlocks((prev) =>
        prev.filter((blockId) => blockId !== id),
      );
    };

    useEffect(() => {
      if (initialData.length === 0) return;
      setBlocks(initialData);
    }, [initialData]);

    const calculateFallDistance = useCallback(
      (block: Block, blocks: Block[]) => {
        let maxFall = gridHeight - block.y - 1;
        for (let y = block.y + 1; y < gridHeight; y++) {
          if (isCollision(block.x, y, block.width, blocks, block.id)) {
            maxFall = y - block.y - 1;
            break;
          }
        }
        return maxFall;
      },
      [gridHeight],
    );

    const isCollision = (
      x: number,
      y: number,
      width: number,
      blocks: Block[],
      blockId: number,
    ) => {
      return blocks.some(
        (block) =>
          block.id !== blockId &&
          block.y === y &&
          x < block.x + block.width &&
          x + width > block.x,
      );
    };

    const applyGravity = useCallback(() => {
      setBlocks((prevBlocks) => {
        const newBlocks = prevBlocks.map((block) => {
          const fallDistance = calculateFallDistance(block, prevBlocks);
          if (fallDistance > 0) {
            return { ...block, y: block.y + 1 };
          }
          return block;
        });

        const blocksChanged = !prevBlocks.every((block) => {
          const newBlock = newBlocks.find((b) => b.id === block.id);
          return newBlock && block.x === newBlock.x && block.y === newBlock.y;
        });

        setIsMoving(blocksChanged);

        return newBlocks;
      });
    }, [calculateFallDistance]);

    useEffect(() => {
      const interval = setInterval(() => {
        if (
          gameState === GameState.GRAVITY ||
          gameState === GameState.GRAVITY2 ||
          gameState === GameState.GRAVITY_BONUS
        ) {
          applyGravity();
        }
      }, gravitySpeed);

      return () => clearInterval(interval);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState]);

    const handleDragStart = (x: number, block: Block) => {
      setActionPerformed(true);
      setDragging(block);
      setDragStartX(x);
      setInitialX(block.x);
      setGameState(GameState.DRAGGING);
    };

    const handleDragMove = (x: number, moveType: MoveType) => {
      if (!dragging) return;

      const deltaX = x - dragStartX;
      const newX = initialX + deltaX / gridSize;
      const boundedX = Math.max(0, Math.min(gridWidth - dragging.width, newX));

      if (
        !isBlocked(
          initialX,
          boundedX,
          dragging.y,
          dragging.width,
          blocks,
          dragging.id,
        )
      ) {
        if (boundedX <= 0 || boundedX >= gridWidth - dragging.width) {
          if (moveType === MoveType.TOUCH) {
            endDrag();
            return;
          } else {
            setInitialX(blocks.find((b) => b.id === dragging.id)?.x ?? 0);
          }
        }
        setBlocks((prevBlocks) =>
          prevBlocks.map((b) =>
            b.id === dragging.id ? { ...b, x: boundedX } : b,
          ),
        );
      }
    };

    const endDrag = useCallback(() => {
      if (!dragging) return;

      setBlocks((prevBlocks) => {
        const updatedBlocks = prevBlocks.map((b) => {
          if (b.id === dragging.id) {
            const finalX = Math.round(b.x);
            if (Math.trunc(finalX) !== Math.trunc(initialX)) {
              setPendingMove({
                block: b,
                rowIndex: b.y,
                startX: initialX,
                finalX,
              });
            }
            return { ...b, x: finalX };
          }
          return b;
        });
        return updatedBlocks;
      });

      setDragging(null);
      setIsMoving(true);
      setGameState(GameState.GRAVITY);
    }, [dragging, initialX, nextLineData, gridHeight]);

    const handleBonusApplication = (block: Block) => {
      setActionPerformed(true);
      setBlockBonus(block);
      if (bonus === BonusType.Wave) {
        setBlocks((prevBlocks) => {
          const updatedBlocks = removeBlocksSameRow(block, prevBlocks);
          return updatedBlocks;
        });
        getBlocksSameRow(block.y, blocks).forEach((b) => {
          if (gridPosition === null) return;
          handleTriggerLocalExplosion(
            gridPosition.left + b.x * gridSize + (b.width * gridSize) / 2,
            gridPosition.top + b.y * gridSize,
          );
        });
      } else if (bonus === BonusType.Totem) {
        setBlocks((prevBlocks) => {
          const updatedBlocks = removeBlocksSameWidth(block, prevBlocks);
          return updatedBlocks;
        });
        getBlocksSameWidth(block, blocks).forEach((b) => {
          if (gridPosition === null) return;
          handleTriggerLocalExplosion(
            gridPosition.left + b.x * gridSize + (b.width * gridSize) / 2,
            gridPosition.top + b.y * gridSize,
          );
        });
      } else if (bonus === BonusType.Hammer) {
        setBlocks((prevBlocks) => {
          const updatedBlocks = removeBlockId(block, prevBlocks);
          return updatedBlocks;
        });
        if (gridPosition === null) return;
        handleTriggerLocalExplosion(
          gridPosition.left + block.x * gridSize + (block.width * gridSize) / 2,
          gridPosition.top + block.y * gridSize,
        );
      }

      setIsMoving(true);
      setGameState(GameState.GRAVITY_BONUS);
    };

    const handleMouseDown = (e: React.MouseEvent, block: Block) => {
      e.preventDefault();

      if (bonus !== BonusType.None) {
        handleBonusApplication(block);
        return;
      }

      switch (tutorialStep) {
        case 2: {
          setBonusSelectWarning(true);
          console.log("Step 2");
          break;
        }
        case 3: {
          setBonusSelectWarning(true);
          console.log("Step 3");
          break;
        }
        case 4: {
          setBonusSelectWarning(true);
          console.log("Step 4");
          break;
        }
        default:
          handleDragStart(e.clientX, block);
          break;
      }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      e.preventDefault();
      if (dragging) {
        handleDragMove(e.clientX, MoveType.MOUSE);
      }
    };

    const handleTouchStart = (e: React.TouchEvent, block: Block) => {
      e.preventDefault();
      e.stopPropagation();

      if (bonus !== BonusType.None) {
        handleBonusApplication(block);
        return;
      }

      switch (tutorialStep) {
        case 2: {
          setBonusSelectWarning(true);
          break;
        }
        case 3: {
          setBonusSelectWarning(true);
          break;
        }
        case 4: {
          setBonusSelectWarning(true);
          break;
        }
        default:
          {
            const touch = e.touches[0];
            handleDragStart(touch.clientX, block);
          }
          break;
      }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      //e.preventDefault();
      if (dragging) {
        const touch = e.touches[0];
        handleDragMove(touch.clientX, MoveType.TOUCH);
      }
    };

    const handleTouchEnd = useCallback(
      (e: React.TouchEvent) => {
        //e.preventDefault();
        endDrag();
      },
      [endDrag],
    );

    useEffect(() => {
      if (!dragging) return;

      const handleMouseUp = () => {
        endDrag();
      };

      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }, [dragging, endDrag]);

    const isBlocked = (
      initialX: number,
      newX: number,
      y: number,
      width: number,
      blocks: Block[],
      blockId: number,
    ) => {
      const rowBlocks = blocks.filter(
        (block) => block.y === y && block.id !== blockId,
      );

      if (newX > initialX) {
        return rowBlocks.some(
          (block) => block.x >= initialX + width && block.x < newX + width,
        );
      } else {
        return rowBlocks.some(
          (block) => block.x + block.width > newX && block.x <= initialX,
        );
      }
    };

    const isHighlighted = (block: Block) => {
      if (!tutorialTargetBlock || actionPerformed) return false;

      return tutorialTargetBlock.some((targetBlock) => {
        if (targetBlock.type === "row") {
          return block.y === targetBlock.y;
        } else {
          return block.x === targetBlock.x && block.y === targetBlock.y;
        }
      });
    };

    const resetAnimateText = (): void => {
      setAnimateText(ComboMessages.None);
    };

    const handleTriggerLocalExplosion = (x: number, y: number) => {
      if (explosionRef.current) {
        explosionRef.current.triggerLocalExplosion({ x, y });
      }
    };

    const handleLineClear = (
      newGravityState: GameState,
      newStateOnComplete: GameState,
    ) => {
      const { updatedBlocks, completeRows } = removeCompleteRows(
        blocks,
        gridWidth,
        gridHeight,
      );

      if (updatedBlocks.length < blocks.length) {
        setLineExplodedCount(lineExplodedCount + completeRows.length);

        completeRows.forEach((rowIndex) => {
          const blocksSameRow = blocks.filter((block) => block.y === rowIndex);
          const gridRect = gridRef.current?.getBoundingClientRect();

          if (gridRect) {
            blocksSameRow.forEach((block) => {
              const explosionX =
                gridRect.left +
                block.x * gridSize +
                (block.width * gridSize) / 2;
              const explosionY =
                gridRect.top + block.y * gridSize + gridSize / 2;

              handleTriggerLocalExplosion(explosionX, explosionY);
            });
          }
        });

        setBlocks(updatedBlocks);
        setIsMoving(true);
        setGameState(newGravityState);
      } else {
        setGameState(newStateOnComplete);
      }
    };

    useEffect(() => {
      if (gameState === GameState.LINE_CLEAR) {
        handleLineClear(GameState.GRAVITY, GameState.ADD_LINE);
      } else if (gameState === GameState.LINE_CLEAR2) {
        handleLineClear(GameState.GRAVITY2, GameState.UPDATE_AFTER_MOVE);
      } else if (gameState === GameState.LINE_CLEAR_BONUS) {
        handleLineClear(GameState.GRAVITY_BONUS, GameState.UPDATE_AFTER_BONUS);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState, blocks]);

    useEffect(() => {
      if (
        gameState === GameState.ADD_LINE &&
        pendingMove &&
        transitioningBlocks.length === 0
      ) {
        const { startX, finalX } = pendingMove;
        if (startX !== finalX) {
          const updatedBlocks = concatenateAndShiftBlocksTutorial(
            blocks,
            nextLineData,
            gridHeight,
          );
          //setNextLineHasBeenConsumed(true);
          if (isGridFull(updatedBlocks)) {
            setGameState(GameState.UPDATE_AFTER_MOVE);
          } else {
            setBlocks(updatedBlocks);
          }
        }
        setIsMoving(true);
        setGameState(GameState.GRAVITY2);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState, blocks, pendingMove, transitioningBlocks]);

    useEffect(() => {
      if (lineExplodedCount > 0) {
        setShouldBounce(true);
        setTimeout(() => setShouldBounce(false), 500);
      }
    }, [lineExplodedCount]);

    useEffect(() => {
      if (
        gameState === GameState.UPDATE_AFTER_MOVE ||
        gameState === GameState.UPDATE_AFTER_BONUS
      ) {
        if (tutorialStep === 1) {
          setTimeout(() => {
            onUpdate(true);
          }, 500);
        }
        if (tutorialStep === 2 || tutorialStep === 3 || tutorialStep === 4) {
          if (ref) {
            (ref as (type: BonusType) => void)(BonusType.None);
          }
          setTimeout(() => {
            onUpdate(true);
          }, 500);
        }
      }
    }, [gameState]);

    useEffect(() => {
      if (!isMoving && transitioningBlocks.length === 0) {
        if (gameState === GameState.GRAVITY) {
          setGameState(GameState.LINE_CLEAR);
        } else if (gameState === GameState.GRAVITY2) {
          setGameState(GameState.LINE_CLEAR2);
        } else if (gameState === GameState.GRAVITY_BONUS) {
          setGameState(GameState.LINE_CLEAR_BONUS);
        }
      }
    }, [gameState, isMoving, transitioningBlocks]);

    useEffect(() => {
      if (
        gameState === GameState.GRAVITY_BONUS &&
        !isMoving &&
        transitioningBlocks.length === 0
      ) {
        setGameState(GameState.LINE_CLEAR);
      }
    }, [gameState, isMoving, transitioningBlocks]);

    useEffect(() => {
      if (gameState === GameState.UPDATE_AFTER_BONUS) {
        selectBlock(blockBonus as Block);
        setBlockBonus(null);
        setGameState(GameState.WAITING);
      }
    }, [gameState, blockBonus, selectBlock]);

    useEffect(() => {
      setActionPerformed(false);

      switch (tutorialStep) {
        case 2:
          setHighlightedHammer && setHighlightedHammer(true);
          setDisabledHammer && setDisabledHammer(false);
          setHighlightedTiki && setHighlightedTiki(false);
          setDisabledTiki && setDisabledTiki(true);
          setHighlightedWave && setHighlightedWave(false);
          setDisabledWave && setDisabledWave(true);
          break;
        case 3:
          setHighlightedHammer && setHighlightedHammer(false);
          setDisabledHammer && setDisabledHammer(true);
          setHighlightedTiki && setHighlightedTiki(false);
          setDisabledTiki && setDisabledTiki(true);
          setHighlightedWave && setHighlightedWave(true);
          setDisabledWave && setDisabledWave(false);
          break;
        case 4:
          setHighlightedHammer && setHighlightedHammer(false);
          setDisabledHammer && setDisabledHammer(true);
          setHighlightedTiki && setHighlightedTiki(true);
          setDisabledTiki && setDisabledTiki(false);
          setHighlightedWave && setHighlightedWave(false);
          setDisabledWave && setDisabledWave(true);
          break;
        default:
          setHighlightedHammer && setHighlightedHammer(false);
          setDisabledHammer && setDisabledHammer(true);
          setHighlightedTiki && setHighlightedTiki(false);
          setDisabledTiki && setDisabledTiki(true);
          setHighlightedWave && setHighlightedWave(false);
          setDisabledWave && setDisabledWave(true);
          break;
      }
    }, [tutorialStep]);

    return (
      <>
        <ConfettiExplosion
          ref={explosionRef}
          colorSet={["#47D1D9", "#8BA3BC", "#1974D1", "#44A4D9", "#01040B"]}
        />
        <motion.div
          animate={shouldBounce ? { scale: [1, 1.1, 1, 1.1, 1] } : {}}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <div
            className="grid-background"
            ref={gridRef}
            style={{ position: "relative" }}
          >
            <div
              className="relative"
              style={{
                height: `${gridHeight * gridSize + 2}px`,
                width: `${gridWidth * gridSize + 2}px`,
                backgroundImage:
                  "linear-gradient(#1E293B 2px, transparent 2px), linear-gradient(to right, #1E293B 2px, #10172A 2px)",
                backgroundSize: `${gridSize}px ${gridSize}px`,
              }}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {blocks.map((block) => (
                <BlockContainer
                  key={block.id}
                  block={block}
                  gridSize={gridSize}
                  isTxProcessing={false}
                  transitionDuration={200}
                  state={gameState}
                  handleMouseDown={(e) => handleMouseDown(e, block)}
                  handleTouchStart={(e) => handleTouchStart(e, block)}
                  onTransitionBlockStart={() =>
                    handleTransitionBlockStart(block.id)
                  }
                  onTransitionBlockEnd={() =>
                    handleTransitionBlockEnd(block.id)
                  }
                  isHighlighted={isHighlighted(block)}
                  isClickable={!tutorialStep || isHighlighted(block)}
                />
              ))}
              <div className="flex items-center justify-center font-sans z-20 pointer-events-none">
                <AnimatedText textEnum={animateText} reset={resetAnimateText} />
              </div>
            </div>
          </div>
          <AlertDialog open={bonusSelectWarning}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  <div className="flex items-center justify-center gap-2">
                    <img
                      className="w-12 h-12"
                      src={imgAssets.logo}
                      alt="tiki image"
                    ></img>
                    <p>&gt;</p>
                    <p> Genius in sleep mode?</p>
                  </div>
                </AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="flex flex-col items-center justify-center gap-6">
                    <p>Select your bonus before clicking on block</p>
                    {tutorialStep === 2 && (
                      <img className="w-8 h-8" src={imgAssets.hammer}></img>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setBonusSelectWarning(false)}>
                  I got it !
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      </>
    );
  },
);

export default TutorialGrid;
