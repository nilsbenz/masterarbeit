import type { ProgressInfo } from "@huggingface/transformers";

export type PcaRequest = {
  words: string[];
};

export type PcaPoint = {
  word: string;
  x: number;
  y: number;
};

export type PcaResponse =
  | { status: "progress"; info: ProgressInfo }
  | { status: "ready" }
  | { status: "result"; points: PcaPoint[]; explained: number[] }
  | { status: "error"; error: string };
