import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { IconLoader2, IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PcaPoint, PcaRequest, PcaResponse } from "./pca.types";

const DEFAULT_WORDS = ["König", "Königin", "Mann", "Frau"];

const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 520;
const PADDING = 48;
const COLOR_COUNT = 6;
const GRID_DIVISIONS = 5;

type FileProgress = { loaded: number; total: number };

function hashWord(word: string) {
  let hash = 0;
  for (let i = 0; i < word.length; i += 1) {
    hash = (hash * 31 + word.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export default function PrincipalComponentAnalysis() {
  const worker = useRef<Worker | null>(null);
  const wordsRef = useRef<string[]>(DEFAULT_WORDS);
  const [input, setInput] = useState("");
  const [points, setPoints] = useState<PcaPoint[]>([]);
  const [explained, setExplained] = useState<number[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(true);
  const [files, setFiles] = useState<Record<string, FileProgress>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    worker.current ??= new Worker(new URL("./pca.worker.ts", import.meta.url), {
      type: "module",
    });
    const active = worker.current;

    function onMessage(event: MessageEvent<PcaResponse>) {
      const message = event.data;
      switch (message.status) {
        case "progress": {
          const info = message.info;
          if (info.status === "progress_total") {
            setFiles(info.files);
          } else if (info.status === "progress") {
            setFiles((prev) => ({
              ...prev,
              [info.file]: { loaded: info.loaded, total: info.total },
            }));
          } else if (info.status === "initiate" || info.status === "download") {
            setFiles((prev) =>
              prev[info.file]
                ? prev
                : { ...prev, [info.file]: { loaded: 0, total: 0 } }
            );
          } else if (info.status === "done") {
            setFiles((prev) => {
              const current = prev[info.file];
              if (!current) return prev;
              return {
                ...prev,
                [info.file]: { loaded: current.total, total: current.total },
              };
            });
          }
          break;
        }
        case "ready":
          setReady(true);
          break;
        case "result":
          setPoints(message.points);
          setExplained(message.explained);
          setBusy(false);
          break;
        case "error":
          setError(message.error);
          setBusy(false);
          break;
      }
    }

    active.addEventListener("message", onMessage);
    active.postMessage({ words: DEFAULT_WORDS } satisfies PcaRequest);

    return () => {
      active.removeEventListener("message", onMessage);
      active.terminate();
      worker.current = null;
    };
  }, []);

  function addWords(raw: string) {
    if (!worker.current) return;

    const tokens = raw
      .split(/[\s,;]+/)
      .map((token) => token.trim())
      .filter(Boolean);

    const seen = new Set(
      wordsRef.current.map((current) => current.toLocaleLowerCase("de"))
    );
    const additions: string[] = [];
    for (const token of tokens) {
      const key = token.toLocaleLowerCase("de");
      if (seen.has(key)) continue;
      seen.add(key);
      additions.push(token);
    }

    setInput("");
    if (additions.length === 0) return;

    const next = [...wordsRef.current, ...additions];
    wordsRef.current = next;
    setError(null);
    setBusy(true);
    worker.current.postMessage({ words: next } satisfies PcaRequest);
  }

  function removeWord(word: string) {
    if (!worker.current) return;

    const next = wordsRef.current.filter(
      (current) =>
        current.toLocaleLowerCase("de") !== word.toLocaleLowerCase("de")
    );
    if (next.length === wordsRef.current.length) return;

    wordsRef.current = next;
    setError(null);
    setBusy(true);
    worker.current.postMessage({ words: next } satisfies PcaRequest);
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    addWords(input);
  }

  const layout = useMemo(() => {
    if (points.length === 0) return [];

    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;

    const availableWidth = VIEW_WIDTH - 2 * PADDING;
    const availableHeight = VIEW_HEIGHT - 2 * PADDING;

    let scale: number;
    if (rangeX === 0 && rangeY === 0) scale = 0;
    else if (rangeY === 0) scale = availableWidth / rangeX;
    else if (rangeX === 0) scale = availableHeight / rangeY;
    else scale = Math.min(availableWidth / rangeX, availableHeight / rangeY);

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    return points.map((point) => ({
      ...point,
      cx: VIEW_WIDTH / 2 + (point.x - midX) * scale,
      cy: VIEW_HEIGHT / 2 - (point.y - midY) * scale,
    }));
  }, [points]);

  const loadedBytes = Object.values(files).reduce(
    (sum, file) => sum + file.loaded,
    0
  );
  const totalBytes = Object.values(files).reduce(
    (sum, file) => sum + file.total,
    0
  );
  const overallProgress = totalBytes > 0 ? (loadedBytes / totalBytes) * 100 : 0;

  return (
    <Card className="not-typeset my-8">
      <CardHeader>
        <CardTitle>PCA</CardTitle>
        <CardDescription>
          Jedes Wort wird von einem kleinen Sprachmodell in einen Vektor
          umgewandelt. Die Principal Component Analysis (PCA) reduziert diese
          Vektoren auf zwei Dimensionen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit}>
          <ButtonGroup className="w-full">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Wörter hinzufügen …"
            />
            <Button
              variant="outline"
              type="submit"
              aria-label="Hinzufügen"
              disabled={busy || !input.trim()}
            >
              {busy ? <IconLoader2 className="animate-spin" /> : <IconPlus />}
              Hinzufügen
            </Button>
          </ButtonGroup>
        </form>

        <div className="rounded-2xl bg-muted/40 p-2 ring-1 ring-foreground/5">
          {busy && !ready && totalBytes > 0 ? (
            <Progress
              value={overallProgress}
              className="mx-auto my-4 w-full max-w-xs"
            >
              <ProgressLabel>Modell wird geladen…</ProgressLabel>
              <ProgressValue />
            </Progress>
          ) : (
            busy && (
              <p className="my-4 shimmer text-center text-sm text-muted-foreground">
                Berechne Embeddings&hellip;
              </p>
            )
          )}

          {error && (
            <p className="text-sm text-destructive">
              Fehler bei der Berechnung: {error}
            </p>
          )}

          {layout.length > 0 ? (
            <div className="relative">
              <svg
                viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
                className="w-full"
                role="group"
                aria-label="PCA-Diagramm der Wörter"
              >
                <g aria-hidden="true">
                  {Array.from({ length: GRID_DIVISIONS + 1 }, (_, index) => {
                    const ratio = index / GRID_DIVISIONS;
                    const x = PADDING + ratio * (VIEW_WIDTH - 2 * PADDING);
                    const y = PADDING + ratio * (VIEW_HEIGHT - 2 * PADDING);
                    return (
                      <g key={index}>
                        <line
                          x1={x}
                          y1={PADDING}
                          x2={x}
                          y2={VIEW_HEIGHT - PADDING}
                          stroke="var(--border)"
                          strokeWidth={1}
                          shapeRendering="crispEdges"
                        />
                        <line
                          x1={PADDING}
                          y1={y}
                          x2={VIEW_WIDTH - PADDING}
                          y2={y}
                          stroke="var(--border)"
                          strokeWidth={1}
                          shapeRendering="crispEdges"
                        />
                      </g>
                    );
                  })}
                </g>
              </svg>
              <div className="pointer-events-none absolute inset-0">
                <p className="absolute bottom-0 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
                  Dimension 1
                </p>
                <p className="absolute top-1/2 left-2 origin-left translate-y-full -rotate-90 text-sm text-muted-foreground">
                  Dimension 2
                </p>
                {layout.map((point) => {
                  const seed = hashWord(point.word);
                  const color = `var(--chart-${(seed % COLOR_COUNT) + 1})`;
                  return (
                    <div
                      key={point.word}
                      className="pca-node absolute"
                      style={{
                        left: `${(point.cx / VIEW_WIDTH) * 100}%`,
                        top: `${(point.cy / VIEW_HEIGHT) * 100}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div className="pca-blob-enter">
                        <div
                          className="pca-blob"
                          style={{
                            animationDuration: `${5 + (seed % 5)}s`,
                            animationDelay: `${-(seed % 7)}s`,
                          }}
                        >
                          <button
                            type="button"
                            className="group pointer-events-auto relative cursor-pointer overflow-clip rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            style={{
                              color,
                              backgroundColor: `color-mix(in oklab, ${color} 15%, var(--card))`,
                              borderColor: `color-mix(in oklab, ${color} 40%, var(--card))`,
                              boxShadow: `0 0 20px -8px ${color}`,
                            }}
                            onClick={() => removeWord(point.word)}
                            aria-label={`${point.word} entfernen`}
                          >
                            {point.word}
                            <span
                              className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                              style={{
                                backgroundColor: `color-mix(in oklab, ${color} 15%, var(--card))`,
                              }}
                            >
                              <IconTrash className="size-5" />
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            !busy && (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Noch keine Wörter vorhanden.
              </p>
            )
          )}
        </div>

        {explained.length > 0 && (
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between">
                <p className="text-sm font-medium">Erklärung der Varianz</p>
                <p className="text-muted-foreground">
                  {Math.round(
                    explained.reduce((sum, value) => sum + value, 0) * 100
                  )}{" "}
                  %
                </p>
              </div>
              <div className="relative flex h-5 w-full items-center overflow-x-hidden rounded-full bg-muted">
                {explained.map((value, index) => {
                  const width = value * 100;
                  return (
                    <div
                      key={index}
                      className="relative h-full overflow-clip bg-primary"
                      style={{
                        width: `${width}%`,
                        opacity: 0.6 + 0.4 * (index / explained.length),
                      }}
                    >
                      <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 truncate text-xs font-medium text-card">
                        Dimension {index + 1}: {Math.round(width)} %
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            <CardDescription>
              Diese Balken zeigen, wie viel der ursprünglichen Varianz der Daten
              durch die Hauptkomponenten erklärt wird. Je höher der Wert, desto
              besser wird die ursprüngliche Datenstruktur in der reduzierten
              Darstellung beibehalten.
            </CardDescription>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
