declare module 'gifenc' {
  export function GIFEncoder(opts?: any): {
    writeFrame: (
      index: Uint8Array | number[],
      width: number,
      height: number,
      opts?: {
        palette?: number[][];
        delay?: number;
        repeat?: number;
        transparent?: boolean;
        transparentIndex?: number;
        dispose?: number;
      }
    ) => void;
    finish: () => void;
    bytes: () => Uint8Array;
    bytesView: () => Uint8Array;
    stream: any;
  };

  export function quantize(
    rgba: Uint8ClampedArray | Uint8Array | number[],
    maxColors?: number,
    opts?: {
      format?: string;
      clearAlpha?: boolean;
      clearAlphaThreshold?: number;
      clearAlphaColor?: number;
    }
  ): number[][];

  export function applyPalette(
    rgba: Uint8ClampedArray | Uint8Array | number[],
    palette: number[][],
    format?: string
  ): Uint8Array;
}
