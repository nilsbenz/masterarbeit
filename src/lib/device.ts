type GpuAdapter = {
  features: { has(feature: string): boolean };
};

type Gpu = {
  requestAdapter(): Promise<GpuAdapter | null>;
};

type NavigatorWithGpu = Navigator & { gpu?: Gpu };

export type DeviceSelection = { device: "webgpu" | "wasm" };

let selection: Promise<DeviceSelection> | null = null;

// Picks the best available inference device for the current environment.
// WebGPU is preferred when an adapter is available, falling back to WASM
// otherwise. On WebGPU, fp16 is only used when the adapter supports the
// required `shader-f16` feature, otherwise fp32 is used.
export function detectDevice(): Promise<DeviceSelection> {
  return (selection ??= (async () => {
    const gpu = (globalThis.navigator as NavigatorWithGpu | undefined)?.gpu;
    if (!gpu) return { device: "wasm" } as const;

    try {
      const adapter = await gpu.requestAdapter();
      if (!adapter) return { device: "wasm" } as const;

      return { device: "webgpu" } as const;
    } catch {
      return { device: "wasm" } as const;
    }
  })());
}
