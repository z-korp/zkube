import { Star } from "lucide-react";

type StarSize = "sm" | "md" | "lg";

interface StarRatingProps {
  stars: number;
  maxStars?: number;
  size?: StarSize;
}

const ICON_SIZE: Record<StarSize, number> = {
  sm: 14,
  md: 18,
  lg: 24,
};

const StarRating: React.FC<StarRatingProps> = ({
  stars,
  maxStars = 3,
  size = "md",
}) => {
  const iconSize = ICON_SIZE[size];

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => (
        <Star
          key={i}
          size={iconSize}
          className={
            i < stars
              ? "text-yellow-400 fill-yellow-400"
              : "text-slate-600"
          }
        />
      ))}
    </div>
  );
};

export default StarRating;
