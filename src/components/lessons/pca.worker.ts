import { detectDevice } from "@/lib/device";
import {
  env,
  pipeline,
  type FeatureExtractionPipeline,
  type ProgressInfo,
} from "@huggingface/transformers";
import { PCA } from "ml-pca";
import type { PcaPoint, PcaRequest, PcaResponse } from "./pca.types";

env.allowLocalModels = false;

const MODEL_ID = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

// Embeddings never change for a given word, so keep them around between
// requests and only run the model for words we haven't seen before.
const cache = new Map<string, number[]>();

function post(message: PcaResponse) {
  self.postMessage(message);
}

function load(onProgress: (info: ProgressInfo) => void) {
  extractorPromise ??= detectDevice().then((selection) =>
    pipeline("feature-extraction", MODEL_ID, {
      dtype: "q8",
      device: selection.device,
      progress_callback: onProgress,
    })
  );
  return extractorPromise;
}

async function embed(
  extractor: FeatureExtractionPipeline,
  word: string
): Promise<number[]> {
  const key = word.toLocaleLowerCase("de");
  const cached = cache.get(key);
  if (cached) return cached;

  const output = await extractor(word, { pooling: "mean", normalize: true });
  const vector = Array.from(output.data as Float32Array);
  cache.set(key, vector);
  return vector;
}

// Projects the high-dimensional embeddings onto their first two principal
// components. PCA needs at least two samples; anything smaller is placed at
// the origin since there is no meaningful direction to show.
function project(vectors: number[][]) {
  if (vectors.length < 2) {
    return {
      points: vectors.map(() => [0, 0] as [number, number]),
      explained: [] as number[],
    };
  }

  try {
    const pca = new PCA(vectors);
    const projected = pca.predict(vectors, { nComponents: 2 }).to2DArray();
    const explained = pca
      .getExplainedVariance()
      .slice(0, 2)
      .map((value) => value ?? 0);

    return {
      points: projected.map(([x, y]) => [x ?? 0, y ?? 0] as [number, number]),
      explained,
    };
  } catch {
    return {
      points: vectors.map(() => [0, 0] as [number, number]),
      explained: [] as number[],
    };
  }
}

self.onmessage = async (event: MessageEvent<PcaRequest>) => {
  try {
    const extractor = await load((info) => post({ status: "progress", info }));
    post({ status: "ready" });

    const { words } = event.data;
    const vectors = await Promise.all(
      words.map((word) => embed(extractor, word))
    );

    const { points, explained } = project(vectors);

    const result: PcaPoint[] = words.map((word, index) => ({
      word,
      x: points[index][0],
      y: points[index][1],
    }));

    post({ status: "result", points: result, explained });
  } catch (error) {
    post({
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
