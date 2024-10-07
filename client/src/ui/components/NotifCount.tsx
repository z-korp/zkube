import { Badge } from "../elements/badge";

const NotifCount = ({ count }: { count: number }) => {
  return (
    <Badge
      variant="destructive"
      className="absolute -top-2 -right-2 w-5 h-5 flex justify-center items-center text-xs rounded-full p-0"
    >
      {count}
    </Badge>
  );
};

export default NotifCount;
