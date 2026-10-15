import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconLoader2, IconSparkles } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { ButtonGroup } from "../ui/button-group";
import { Input } from "../ui/input";
import type {
  NextWordPredictionRequest,
  NextWordPredictionResponse,
  NextWordPredictionResult,
} from "./next-word-prediction.types";
import { Progress, ProgressLabel, ProgressValue } from "../ui/progress";

const DEFAULT_TEXT = "Die Katze sitzt auf dem";

type FileProgress = { loaded: number; total: number };

export default function NextWordPrediction() {
  const worker = useRef<Worker | null>(null);
  const [input, setInput] = useState(DEFAULT_TEXT);
  const [results, setResults] = useState<NextWordPredictionResult[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<Record<string, FileProgress>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    worker.current ??= new Worker(
      new URL("./next-word-prediction.worker.ts", import.meta.url),
      { type: "module" }
    );

    function onMessage(event: MessageEvent<NextWordPredictionResponse>) {
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
        case "complete":
          setResults(message.results);
          setBusy(false);
          break;
        case "error":
          setError(message.error);
          setBusy(false);
          break;
      }
    }

    worker.current.addEventListener("message", onMessage);
    return () => {
      worker.current?.removeEventListener("message", onMessage);
      worker.current?.terminate();
      worker.current = null;
    };
  }, []);

  function predict(text = input) {
    if (!worker.current || !text.trim()) return;
    setError(null);
    setResults([]);
    setFiles({});
    setBusy(true);
    worker.current.postMessage({
      text: text.trim(),
    } satisfies NextWordPredictionRequest);
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    predict();
  }

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
    <Card>
      <CardHeader>
        <CardTitle>Nächste-Wort-Vorhersage</CardTitle>
        <CardDescription>
          Schreibe den Anfang eines Satzes und teste, welche Wörter das Modell
          als nächstes generiert.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit}>
          <ButtonGroup className="w-full">
            <Input value={input} onChange={(e) => setInput(e.target.value)} />
            <Button
              variant="outline"
              aria-label="Generieren"
              disabled={busy || !input.trim()}
              type="submit"
            >
              {busy ? (
                <IconLoader2 className="animate-spin" />
              ) : (
                <IconSparkles />
              )}
              Generieren
            </Button>
          </ButtonGroup>
        </form>

        {busy && !ready && totalBytes > 0 ? (
          <Progress
            value={overallProgress}
            className="mx-auto mt-8 mb-4 w-full max-w-xs"
          >
            <ProgressLabel>Modell wird geladen…</ProgressLabel>
            <ProgressValue />
          </Progress>
        ) : (
          busy && (
            <p className="mt-8 mb-4 shimmer text-center text-sm text-muted-foreground">
              Generiere das nächste Wort&hellip;
            </p>
          )
        )}

        {error && (
          <p className="text-sm text-destructive">
            Fehler bei der Vorhersage: {error}
          </p>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result) => (
              <Progress key={result.id} value={result.probability * 100}>
                <ProgressLabel>{result.display}</ProgressLabel>
                <ProgressValue />
              </Progress>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
