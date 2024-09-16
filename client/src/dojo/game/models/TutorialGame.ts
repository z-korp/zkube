import { Mode, ModeType } from '../types/mode';
import { DifficultyType } from '../types/difficulty';
import { BasicSlidingStep, HammerBonusStep, TikiBonusStep, TutorialStep, WaveBonusStep } from './TutorialStep';
import { Game } from './game';

export class TutorialGame extends Game {
  currentStep: number;
  steps: TutorialStep[];

  constructor() {
    super({
      mode: new Mode(ModeType.Tutorial),
      difficulty: DifficultyType.Easy, 
    });
    this.currentStep = 0;
    this.steps = this.initializeSteps();
  }

  private initializeSteps(): TutorialStep[] {
    return [
      new BasicSlidingStep(),
      new HammerBonusStep(),
      new WaveBonusStep(),
      new TikiBonusStep()
    ];
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.setupCurrentStep();
    }
  }

  setupCurrentStep() {
    this.steps[this.currentStep].setup(this);
  }


  

  // Override necessary Game methods
  // For example:
//   applyAction(action: GameAction) {
//     super.applyAction(action);
//     // Add tutorial-specific logic here
//   }
}