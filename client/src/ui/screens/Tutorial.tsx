import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import TutorialGrid from "../components/TutorialGrid";
import { Block } from "@/types/types";
import { Card } from "../elements/card";
import GameBonus from "../containers/GameBonus";
import { transformDataContratIntoBlock } from "@/utils/gridUtils";
import { BonusName } from "@/enums/bonusEnum";
import { useLerpNumber } from "@/hooks/useLerpNumber";
import NextLine from "../components/NextLine";
import { useMediaQuery } from "react-responsive";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MaxComboIcon from "../components/MaxComboIcon";
import { faFire, faStar } from "@fortawesome/free-solid-svg-icons";
import { set } from "date-fns";

const Tutorial = ({
  showGrid,
  showTutorialText,
  tutorial,
  setTutorial,
}: {
  showGrid: any;
  showTutorialText: any;
  tutorial: any;
  setTutorial: (value: boolean) => void;
}) => {
  const [level, setLevel] = useState<number>(1);
  const [score, setScore] = useState<number | undefined>(0);
  const [tutorialStep, setTutorialStep] = useState<number>(1); // Step 1 of the tutorial
  const [isIntermission, setIsIntermission] = useState<boolean>(false); // Intermission state
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });
  const [waveCount, setWaveCount] = useState(2);
  const [totemCount, setTotemCount] = useState(2);
  const [hammerCount, setHammerCount] = useState(3);
  const [bonus, setBonus] = useState<BonusName>(BonusName.NONE);
  const [isTxProcessing, setIsTxProcessing] = useState(false);
  const [gridData, setGridData] = useState<number[][]>([
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [3, 0, 0, 2, 0, 0, 0, 0],
    [0, 1, 2, 3, 0],
    [2, 0, 0, 3, 2],
    [1, 0, 2, 2, 0, 0, 1, 1],
    [3, 0, 0, 1, 0, 0, 2], // 9th row
  ]);

  const usebonus = useRef<{
    useBonus: (bonus: any, row_index: any, block_index: any) => boolean;
  } | null>(null);
  const rows = 10;
  const cols = 8;
  const gridSize = isMdOrLarger ? 50 : 40;
  const combo = 0;
  const maxCombo = 0;
  let nextLine = [0, 0, 0, 0];

  const updateValue = (intermission: boolean) => {
    setScore((score ?? 0) + 15);
    setIsIntermission(intermission);
  };

  const handleBonusWaveClick = () => {
    if (waveCount === 0) return;
    if (bonus === BonusName.WAVE) {
      setBonus(BonusName.NONE);
    } else setBonus(BonusName.WAVE);
  };

  const handleBonusTikiClick = () => {
    if (totemCount === 0) return;
    if (bonus === BonusName.TIKI) {
      setBonus(BonusName.NONE);
    } else setBonus(BonusName.TIKI);
  };

  const handleBonusHammerClick = () => {
    if (hammerCount === 0) return;
    if (bonus === BonusName.HAMMER) {
      setBonus(BonusName.NONE);
    } else setBonus(BonusName.HAMMER);
  };

  const applybonus = async ({
    bonus,
    row_index,
    block_index,
  }: {
    bonus: any;
    row_index: any;
    block_index: any;
  }) => {
    try {
      if (usebonus.current) {
        const bonusApplied = usebonus.current.useBonus(
          bonus,
          row_index,
          block_index,
        );

        if (bonusApplied) {
          console.log("Bonus applied successfully!");
          return true;
        } else {
          console.log("Bonus not applied");
          return false;
        }
      }
    } catch (error) {
      console.error("Error executing bonus:", error);
      throw error;
    }
  };

  const selectBlock = useCallback(
    async (block: Block) => {
      if (bonus === BonusName.HAMMER && tutorialStep === 2) {
        const bonusApplied = await applybonus({
          bonus: BonusName.HAMMER,
          row_index: block.y,
          block_index: block.x,
        });

        if (bonusApplied) {
          // Move to intermission before Step 3
          setHammerCount(hammerCount - 1);
          setScore((score ?? 0) + 25);
          setIsIntermission(true); // Show congratulations message
        }
      } else if (bonus === BonusName.WAVE && tutorialStep === 3) {
        const bonusApplied = await applybonus({
          bonus: BonusName.WAVE,
          row_index: block.y,
          block_index: block.x,
        });

        if (bonusApplied) {
          // Move to intermission before Step 4
          setWaveCount(waveCount - 1);
          setScore((score ?? 0) + 400);
          setIsIntermission(true);
        }
      } else if (bonus === BonusName.TIKI && tutorialStep === 4) {
        const bonusApplied = await applybonus({
          bonus: BonusName.TIKI,
          row_index: block.y,
          block_index: block.x,
        });

        if (bonusApplied) {
          // Move to intermission before Step 4
          setWaveCount(totemCount - 1);
          setScore((score ?? 0) + 250);
          setIsIntermission(true);
        }
      }

      // For tutorial step 1, track block movement
      if (tutorialStep === 1) {
        const isTargetBlock = block.y === 8 && block.x === 2;
        const finalPosition = Math.round(block.x);

        if (isTargetBlock && finalPosition === 2) {
          // Block moved to correct position
          setScore((score ?? 0) + 100);
          setIsIntermission(true); // Show congratulations message
        }
      }
    },
    [bonus, tutorialStep],
  );

  const handleContinue = () => {
    // Move to the next step
    setIsIntermission(false);
    setTutorialStep(tutorialStep + 1);
  };

  const tutorialTargetBlock: {
    x: number;
    y: number;
    type: "block" | "row";
  } | null = useMemo(() => {
    if (tutorialStep === 1) {
      return { x: 2, y: 8, type: "block" }; // The block we want to highlight in step 1
    }
    if (tutorialStep === 2) {
      return { x: 6, y: 9, type: "block" }; // Block to be hammered
    }
    if (tutorialStep === 3) {
      return { x: 0, y: 8, type: "row" }; // The row we want to highlight for the wave bonus
    }
    if (tutorialStep === 4) {
      return { x: 0, y: 9, type: "block" }; // The block we want to highlight in step 4
    }
    return null;
  }, [tutorialStep]);

  const memorizedInitialData = useMemo(
    () => transformDataContratIntoBlock(gridData),
    [gridData],
  );
  const memorizedNextLineData = useMemo(
    () => transformDataContratIntoBlock([nextLine]),
    [nextLine],
  );

  const displayScore = useLerpNumber(score, { integer: true });
  const displayCombo = useLerpNumber(combo, { integer: true });
  const displayMaxCombo = useLerpNumber(maxCombo, { integer: true });

  const endTutorial = () => {
    setTutorial(false);
  };
  return (
    <div className="flex flex-col items-center w-[500px] relative">
      {showGrid && (
        <>
          {/* Intermission: Show Congratulations Message */}
          {isIntermission && (
            <div className="absolute z-50 flex flex-col items-center p-6 bg-blue-600 rounded-lg shadow-md top-1/3">
              <h2 className="text-2xl font-bold mb-4">Congratulations!</h2>
              <p className="mb-4">
                You have successfully completed Step {tutorialStep}.
              </p>
              <button
                onClick={handleContinue}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                Continue to the Next Step
              </button>
            </div>
          )}
          <Card
            className={`p-4 bg-secondary ${isTxProcessing ? "cursor-wait" : "cursor-move"}`}
          >
            <div
              className={`${isMdOrLarger ? "w-[420px]" : "w-[338px]"} mb-4 flex justify-between`}
            >
              <div className="w-5/12">
                <GameBonus
                  onBonusWaveClick={handleBonusWaveClick}
                  onBonusTikiClick={handleBonusTikiClick}
                  onBonusHammerClick={handleBonusHammerClick}
                  hammerCount={hammerCount}
                  tikiCount={totemCount}
                  waveCount={waveCount}
                  bonus={bonus}
                />
              </div>
              <div className="flex gap-2">
                <div
                  className={`flex items-center ${isMdOrLarger ? "text-4xl" : "text-2xl"}`}
                >
                  <span>{displayScore}</span>
                  <FontAwesomeIcon
                    icon={faStar}
                    className="text-yellow-500 ml-1"
                    width={26}
                    height={26}
                  />
                </div>
                <div
                  className={`flex items-center ${isMdOrLarger ? "text-4xl" : "text-2xl"}`}
                >
                  <span
                    className={`${isMdOrLarger ? "w-[38px]" : "w-[26px]"} text-right`}
                  >
                    {displayCombo}
                  </span>
                  <FontAwesomeIcon
                    icon={faFire}
                    className="text-yellow-500 ml-1"
                    width={26}
                    height={26}
                  />
                </div>
                <div
                  className={`flex items-center ${isMdOrLarger ? "text-4xl" : "text-2xl"}`}
                >
                  <span
                    className={`${isMdOrLarger ? "w-[20px]" : "w-[13px]"} text-right`}
                  >
                    {displayMaxCombo}
                  </span>
                  <MaxComboIcon
                    width={isMdOrLarger ? 31 : 25}
                    height={isMdOrLarger ? 31 : 25}
                    className="text-yellow-500 ml-1"
                  />
                </div>
              </div>
            </div>
            {/* Step-specific instructions */}
            {tutorialStep === 1 && (
              <div className="text-center p-4 bg-blue-600 rounded-md mb-4 absolute -left-[22%] mt-2 z-50 w-[155px]">
                <h2>
                  Step 1: Move the highlighted block two steps to the right.
                </h2>
              </div>
            )}
            {tutorialStep === 2 && (
              <div className="text-center p-4 bg-blue-600 rounded-md mb-4 absolute -left-[37%] mt-2 z-50 w-[225px]">
                <h2>
                  Step 2: Click on the hammer icon on the top left of the game
                  screen, then click on the highlighted block to use the bonus
                  and remove it.
                </h2>
              </div>
            )}
            {tutorialStep === 3 && (
              <div className="text-center p-4 bg-blue-600 rounded-md mb-4 absolute -left-[37%] mt-2 z-50 w-[225px]">
                <h2>
                  Step 3: Click on the wave icon on the top left of the game
                  screen, then double click on the highlighted row of blocks to
                  use the bonus and remove it.
                </h2>
              </div>
            )}
            {tutorialStep === 4 && (
              <div className="text-center p-4 bg-blue-600 rounded-md mb-4 absolute -left-[37%] mt-2 z-50 w-[225px]">
                <h2>
                  Step 4: Click on the totem icon on the top left of the game
                  screen, then click on the highlighted block to use the bonus
                  and remove it and blocks of similar size.
                </h2>
              </div>
            )}
            {tutorialStep === 5 && (
              <div className="text-center p-4 bg-blue-600 rounded-md mb-4 absolute left-[14%] top-1/3 mt-2 z-50 w-[355px] h-fit">
                <h2>
                  Step 5? There's no step 5. You're done! Congratulations!
                  You've completed the tutorial. use the button below to exit
                  tutorial mode and play the real game.
                </h2>
                <button
                  onClick={endTutorial}
                  className="mt-4 bg-white text-black px-4 py-3 rounded-md"
                >
                  Exit Tutorial
                </button>
              </div>
            )}
            <div className="flex justify-center items-center">
              <TutorialGrid
                initialData={memorizedInitialData}
                nextLineData={memorizedNextLineData}
                gridSize={gridSize}
                gridHeight={rows}
                gridWidth={cols}
                selectBlock={selectBlock}
                bonus={bonus}
                account={null}
                tutorialStep={tutorialStep}
                intermission={isIntermission}
                tutorialTargetBlock={tutorialTargetBlock}
                onUpdate={updateValue}
                ref={usebonus}
              />
            </div>
            <br />
            <div className="flex justify-center items-center">
              <NextLine
                nextLineData={transformDataContratIntoBlock([nextLine])}
                gridSize={gridSize}
                gridHeight={1}
                gridWidth={cols}
              />
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default Tutorial;
