import { Badge } from "../elements/badge";

const NotifCount = ({ count }: { count: number }) => {
  return (
    <Badge
      variant="destructive"
      className="absolute -top-3 -right-0 w-5 h-5 flex justify-center items-center text-xs rounded-full p-0 z-50"
    >
      {count}
    </Badge>
  );
};

export default NotifCount;
