import { TutorialGrid,Block } from "./TutorialGrid";



// interface Block {
//     value: number;
//     color: number;
//   }

export class CubeSlidingTutorial {
    private grid: TutorialGrid;
    private currentStep: number;
    private instructions: string[];
  
    constructor() {
      this.grid = new TutorialGrid(4, 4);
      this.currentStep = 0;
      this.instructions = [
        "Welcome to the Zkube tutorial!",
        "Tap and drag the highlighted cube to move it.",
        "Slide the cube to complete a line.",
        "Great job! You've completed the basic sliding tutorial."
      ];
      this.setupInitialGrid();
    }
  
    private setupInitialGrid(): void {
      // Set up a simple initial state for the tutorial
      this.grid.setBlock(3, 1, 1, 1); // Slidable cube
      this.grid.setBlock(3, 0, 1, 2);
      this.grid.setBlock(3, 2, 1, 2);
      this.grid.setBlock(3, 3, 1, 2);
    }
  
    public getCurrentInstruction(): string {
      return this.instructions[this.currentStep];
    }
  
    public handleCubeSlide(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
      if (this.grid.slideCube(fromRow, fromCol, toRow, toCol)) {
        this.grid.applyGravity();
        const linesCleared = this.grid.clearLines();
        if (linesCleared > 0) {
          this.advanceStep();
        }
        return true;
      }
      return false;
    }
  
    private advanceStep(): void {
      this.currentStep++;
    }
  
    public isTutorialComplete(): boolean {
      return this.currentStep >= this.instructions.length - 1;
    }
  
    public getGridState(): Block[][] {
      return this.grid.getGridState();
    }
  }