import type { ProgressInfo } from "@huggingface/transformers";

export type NextWordPredictionRequest = {
  text: string;
};

export type NextWordPredictionResult = {
  id: number;
  // Text to append to the input when the option is chosen.
  token: string;
  // Complete word shown in the list (leading/fragment parts included).
  display: string;
  probability: number;
};

export type NextWordPredictionResponse =
  | { status: "progress"; info: ProgressInfo }
  | { status: "ready" }
  | { status: "complete"; results: NextWordPredictionResult[] }
  | { status: "error"; error: string };
