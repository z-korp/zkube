import { Button } from "../elements/button";
import { useNftBalance } from "@/hooks/useNftBalance";

const Nfts = ({ address }: { address: string }) => {
  const { refetch, isLoading, isError, error, balance } =
    useNftBalance(address);

  return (
    <div className="p-4">
      {isLoading && <p className="text-gray-600">Loading...</p>}
      {isError && (
        <p className="text-red-500">
          Error: {error?.message || "Failed to fetch NFT balance"}
        </p>
      )}
      {error && (
        <p className="text-red-500">
          Mint Error: {error?.message || "Failed to mint"}
        </p>
      )}
      <p className="text-lg">NFT Balance: {balance.toString()}</p>
      <Button
        onClick={async () => {
          await refetch;
        }}
      >
        Refetch
      </Button>
    </div>
  );
};

export default Nfts;
