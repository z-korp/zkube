import { useConnect, useAccount } from "@starknet-react/core";
import { motion } from "framer-motion";

const Connect = () => {
  const { connect, connectors } = useConnect();
  const { address, status } = useAccount();

  if (status === "connected" && address) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {connectors.map((connector) => (
        <span key={connector.id}>
          <motion.div
            animate={{
              scale: [1, 1.2, 1, 1.2, 1, 1, 1.2, 1, 1.2, 1],
              backgroundColor: [
                "#FFFFFF",
                "#47D1D9",
                "#8BA3BC",
                "#1974D1",
                "#44A4D9",
                "#FFFFFF",
              ],
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 1,
            }}
            onClick={() => {
              connect({ connector });
            }}
            className="cursor-pointer p-2 text-black bg-blue-500 rounded-lg font-bold"
          >
            Connect
          </motion.div>
        </span>
      ))}
    </div>
  );
};

export default Connect;
