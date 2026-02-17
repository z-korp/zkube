export class Packer {
  static unpack(num: bigint, size: bigint): number[] {
    const result: number[] = [];
    const mask = (1n << size) - 1n;
    while (num > 0n) {
      result.push(Number(num & mask));
      num >>= size;
    }
    return result;
  }
  public static sized_unpack(
    packed: bigint,
    size: bigint,
    len: number,
  ): number[] {
    const result = [];
    const mask = (1n << size) - 1n;
    for (let i = 0; i < len; i++) {
      result.push(Number(packed & mask));
      packed >>= size;
    }
    return result;
  }

  public static pack(unpacked: number[], size: bigint) {
    let packed = 0n;
    for (let i = unpacked.length - 1; i >= 0; i--) {
      packed <<= size;
      packed += BigInt(unpacked[i]);
    }
    return packed;
  }
}
