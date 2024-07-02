export interface VrfResponse {
  public_key: string;
  seed: bigint;
  proof_gamma_x: bigint;
  proof_gamma_y: bigint;
  proof_c: bigint;
  proof_s: bigint;
  proof_verify_hint: bigint;
  beta: bigint;
}

export const fetchVrfData = async (): Promise<VrfResponse> => {
  try {
    const response = await fetch(import.meta.env.VITE_VRF_URL as string);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data: VrfResponse = await response.json().then((data) => {
      return {
        public_key: data.public_key,
        seed: BigInt(data.seed),
        proof_gamma_x: BigInt(data.proof_gamma_x),
        proof_gamma_y: BigInt(data.proof_gamma_y),
        proof_c: BigInt(data.proof_c),
        proof_s: BigInt(data.proof_s),
        proof_verify_hint: BigInt(data.proof_verify_hint),
        beta: BigInt(data.beta),
      };
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch VRF data:", error);
    throw error;
  }
};
