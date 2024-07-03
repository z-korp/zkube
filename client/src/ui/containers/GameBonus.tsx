import { Button } from '../elements/button';

export const GameBonus = () => {
  return (
    <div className="grid grid-cols-3 w-full">
      <div className="flex flex-col items-start">
        <Button variant="outline"></Button>
      </div>
      <div className="flex flex-col items-center">
        <Button variant="outline"></Button>
      </div>

      <div className="flex flex-col gap-2 w-full items-end py-1">
        <Button variant="outline"></Button>
      </div>
    </div>
  );
};
