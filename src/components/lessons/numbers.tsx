import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Slider } from "../ui/slider";

export default function Numbers() {
  const [textInput, setTextInput] = useState("Hallo!");
  const [rgbInput, setRgbInput] = useState({ r: 67, g: 128, b: 189 });

  return (
    <Card className="not-typeset my-8">
      <CardHeader>
        <CardTitle>Überall Zahlen</CardTitle>
        <CardDescription>
          Damit ein Computer Wörter, Farben und Bilder verstehen und verarbeiten
          kann, werden sie in Zahlen umgewandelt.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs>
          <TabsList variant="line">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="colors">Farben</TabsTrigger>
            <TabsTrigger value="images">Bilder</TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="mt-4 space-y-3">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {textInput.split("").map((char, index) => (
                <div
                  key={index}
                  className="flex h-full w-10 shrink-0 flex-col rounded-md border bg-muted pt-1 pb-2"
                >
                  <p className="text-center text-lg font-medium">
                    {char.trim() || "\u2423"}
                  </p>
                  <p className="text-center font-mono text-sm text-primary">
                    {char.charCodeAt(0)}
                  </p>
                </div>
              ))}
            </div>
            <CardDescription>
              ASCII-Repräsentation:{" "}
              {`[${textInput
                .split("")
                .map((char) => char.charCodeAt(0))
                .join(", ")}]`}
            </CardDescription>
          </TabsContent>
          <TabsContent value="colors" className="mt-4 space-y-3">
            <div className="flex gap-4">
              <div
                className="w-12 shrink-0 self-stretch rounded shadow-sm"
                style={{
                  backgroundColor: `rgb(${rgbInput.r}, ${rgbInput.g}, ${rgbInput.b})`,
                }}
              />
              <div className="w-full space-y-3">
                <p className="font-mono text-lg font-medium">
                  rgb(
                  <span className="text-red-500">{rgbInput.r}</span>,{" "}
                  <span className="text-green-500">{rgbInput.g}</span>,{" "}
                  <span className="text-blue-500">{rgbInput.b}</span>)
                </p>
                <div className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">
                    Rot
                  </p>
                  <Slider
                    value={rgbInput.r}
                    onValueChange={(value) =>
                      typeof value === "number" &&
                      setRgbInput({ ...rgbInput, r: value })
                    }
                    min={0}
                    max={255}
                    className="**:data-[slot=slider-range]:bg-red-500"
                  />
                  <p className="text-sm font-medium text-muted-foreground">
                    Grün
                  </p>
                  <Slider
                    value={rgbInput.g}
                    onValueChange={(value) =>
                      typeof value === "number" &&
                      setRgbInput({ ...rgbInput, g: value })
                    }
                    min={0}
                    max={255}
                    className="**:data-[slot=slider-range]:bg-green-500"
                  />
                  <p className="text-sm font-medium text-muted-foreground">
                    Blau
                  </p>
                  <Slider
                    value={rgbInput.b}
                    onValueChange={(value) =>
                      typeof value === "number" &&
                      setRgbInput({ ...rgbInput, b: value })
                    }
                    min={0}
                    max={255}
                    className="**:data-[slot=slider-range]:bg-blue-500"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="images" className="mt-4 space-y-3">
            <p>todo</p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
