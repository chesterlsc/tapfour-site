// Render-cost knobs (input props), for benchmarking and final quality. Defaults are the final settings.
import { getInputProps } from 'remotion';
const p = getInputProps() as Record<string, unknown>;
export const Q = {
  msaa: (p.msaa as number) ?? 4,
  refl: (p.refl as number) ?? 1024,
  dof: (p.dof as boolean) ?? true,
  shadow: (p.shadow as number) ?? 2048
};
