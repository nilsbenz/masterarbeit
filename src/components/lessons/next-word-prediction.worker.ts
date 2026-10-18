import { detectDevice } from "@/lib/device";
import {
  AutoModelForCausalLM,
  AutoTokenizer,
  env,
  softmax,
  type ProgressInfo,
} from "@huggingface/transformers";
import type {
  NextWordPredictionRequest,
  NextWordPredictionResponse,
} from "./next-word-prediction.types";

env.allowLocalModels = false;

const MODEL_ID = "onnx-community/Qwen2.5-0.5B-Instruct";
const TOP_K = 5;
const CANDIDATE_K = 10;
const MAX_WORD_TOKENS = 8;

type Tokenizer = Awaited<ReturnType<typeof AutoTokenizer.from_pretrained>>;
type Model = Awaited<ReturnType<typeof AutoModelForCausalLM.from_pretrained>>;

let tokenizerPromise: Promise<Tokenizer> | null = null;
let modelPromise: Promise<Model> | null = null;

function post(message: NextWordPredictionResponse) {
  self.postMessage(message);
}

function load(
  onProgress: (info: ProgressInfo) => void
): Promise<[Tokenizer, Model]> {
  tokenizerPromise ??= AutoTokenizer.from_pretrained(MODEL_ID, {
    progress_callback: onProgress,
  });
  modelPromise ??= detectDevice().then((selection) =>
    AutoModelForCausalLM.from_pretrained(MODEL_ID, {
      dtype: "q4",
      device: selection.device,
      progress_callback: onProgress,
    })
  );
  return Promise.all([tokenizerPromise, modelPromise]);
}

function isSpecialToken(piece: string) {
  return piece.length === 0 || /^<\|.*\|>$/.test(piece);
}

function isWordStart(piece: string) {
  return /^\s/.test(piece);
}

function isPunctuation(piece: string) {
  return /^\s*[^\p{L}\p{N}\s]/u.test(piece);
}

function trailingPartial(text: string) {
  const match = /(\S*)$/.exec(text);
  return match ? match[1] : "";
}

async function nextTokenProbabilities(
  tokenizer: Tokenizer,
  model: Model,
  text: string
) {
  const inputs = tokenizer(text);
  const { logits } = await model(inputs);

  const [, sequenceLength, vocabSize] = logits.dims;
  const data = logits.data as Float32Array;
  const offset = (sequenceLength - 1) * vocabSize;

  return softmax(data.slice(offset, offset + vocabSize));
}

// Greedily extends a single token into a complete word by repeatedly running
// the model and appending the most likely continuation token. Stops as soon as
// the best next token starts a new word, is punctuation, or a length guard is
// hit. Returns the appended text (relative to baseText) and the cumulative
// probability of the whole word.
async function completeToken(
  tokenizer: Tokenizer,
  model: Model,
  baseText: string,
  firstPiece: string,
  firstProbability: number
): Promise<{ appended: string; probability: number }> {
  if (isPunctuation(firstPiece)) {
    return { appended: firstPiece.trimStart(), probability: firstProbability };
  }

  let text = baseText + firstPiece;
  let probability = firstProbability;

  for (let step = 1; step < MAX_WORD_TOKENS; step += 1) {
    const probabilities = await nextTokenProbabilities(tokenizer, model, text);

    let bestId = 0;
    for (let id = 1; id < probabilities.length; id += 1) {
      if (probabilities[id] > probabilities[bestId]) bestId = id;
    }

    const piece = tokenizer.decode([bestId]);
    if (isWordStart(piece) || isPunctuation(piece) || isSpecialToken(piece)) {
      break;
    }

    text += piece;
    probability *= probabilities[bestId];
  }

  return { appended: text.slice(baseText.length), probability };
}

self.onmessage = async (event: MessageEvent<NextWordPredictionRequest>) => {
  try {
    const [tokenizer, model] = await load((info) =>
      post({ status: "progress", info })
    );
    post({ status: "ready" });

    const text = event.data.text;
    // Characters after the last whitespace: an already-typed, possibly
    // incomplete word fragment (e.g. "Kat") that should be carried over.
    const partial = trailingPartial(text);

    const probabilities = await nextTokenProbabilities(tokenizer, model, text);

    const ranked = Array.from({ length: probabilities.length }, (_, id) => id)
      .filter((id) => {
        const piece = tokenizer.decode([id]);
        return !isSpecialToken(piece);
      })
      .sort((a, b) => probabilities[b] - probabilities[a])
      .slice(0, CANDIDATE_K);

    const completed = await Promise.all(
      ranked.map((id) =>
        completeToken(
          tokenizer,
          model,
          text,
          tokenizer.decode([id]),
          probabilities[id]
        )
      )
    );

    const words = new Map<
      string,
      { id: number; token: string; display: string; probability: number }
    >();
    completed.forEach((result, index) => {
      // A leading space means this candidate starts a fresh word, otherwise it
      // completes the already-typed fragment. Punctuation is shown standalone.
      const display = isPunctuation(result.appended)
        ? result.appended
        : isWordStart(result.appended)
          ? result.appended.trimStart()
          : (partial + result.appended).trimStart();
      if (!display) return;
      const existing = words.get(display);
      if (!existing || result.probability > existing.probability) {
        words.set(display, {
          id: ranked[index],
          token: result.appended,
          display,
          probability: result.probability,
        });
      }
    });

    const results = [...words.values()]
      .sort((a, b) => b.probability - a.probability)
      .slice(0, TOP_K);

    post({ status: "complete", results });
  } catch (error) {
    post({
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
