import { uint256 } from "starknet";
import { erc721ABI } from "@/utils/erc721";
import { erc20ABI } from "@/utils/erc20";
import {
  useAccount,
  useContract,
  useSendTransaction,
} from "@starknet-react/core";
import { useSettings } from "./useSettings";

const {
  VITE_PUBLIC_GAME_TOKEN_ADDRESS,
  VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
} = import.meta.env;

export const useNftMint = () => {
  const { address } = useAccount();
  const { settings } = useSettings();

  const { contract: contract_erc20 } = useContract({
    abi: erc20ABI,
    address: VITE_PUBLIC_GAME_TOKEN_ADDRESS,
  });

  const { contract: contract_erc721 } = useContract({
    abi: erc721ABI,
    address: VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
  });

  /*const {
    data: price,
    isError: isPriceError,
    isLoading: isPriceLoading,
    error: priceError,
  } = useReadContract({
    abi: [
      {
        type: "function",
        name: "get_mint_price",
        inputs: [],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
    ] as const,
    functionName: "get_mint_price",
    address: VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
    watch: true,
    enabled: true,
    refetchInterval: 10000,
    blockIdentifier: BlockTag.PENDING,
  });

  console.log("price", price);
  console.log("priceError", priceError);

  const formattedPrice = price ? BigInt(price.toString()) : 0n;

  console.log("price", price);*/

  const {
    isError: isMintError,
    error: mintError,
    sendAsync: mint,
    isPending,
  } = useSendTransaction({
    calls:
      address &&
      contract_erc20 &&
      VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS &&
      contract_erc721 &&
      VITE_PUBLIC_GAME_TOKEN_ADDRESS
        ? [
            contract_erc20.populate("approve", [
              VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
              uint256.bnToUint256(settings?.game_price || 0n),
            ]),
            contract_erc721.populate("public_mint", [address]),
          ]
        : undefined,
  });

  return {
    mint,
    error: mintError,
    isError: isMintError,
    isPending,
  };
};
