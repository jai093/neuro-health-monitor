import { useServerFn } from "@tanstack/react-start";
import { Brain, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inferMri } from "@/lib/inference.functions";

export type MriResult = { className: string; confidence: number; rationale?: string };

/** Brain MRI slice upload scored by the server-side Alzheimer's classifier. */
export function MriUpload({ onResult }: { onResult: (r: MriResult | null) => void }) {
  const classify = useServerFn(inferMri);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<MriResult | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (dataUrl: string) => {
    setBusy(true);
    try {
      const scored = await classify({ data: { imageDataUrl: dataUrl } });
      setResult(scored);
      onResult(scored);
      toast.success("MRI analysed", {
        description: `${scored.className} · ${Math.round(scored.confidence * 100)}% confidence`,
      });
    } catch (error) {
      onResult(null);
      toast.error("MRI analysis failed", {
        description: error instanceof Error ? error.message : "Please try another image.",
        action: { label: "Retry", onClick: () => void run(dataUrl) },
      });
    } finally {
      setBusy(false);
    }
  };

  const onFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (PNG or JPEG MRI slice).");
      return;
    }
    if (file.size > 6_000_000) {
      toast.error("That image is too large. Please use one under 6 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setPreview(dataUrl);
      void run(dataUrl);
    };
    reader.onerror = () => toast.error("Couldn't read that file.");
    reader.readAsDataURL(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="size-4 text-primary" aria-hidden /> Optional — brain MRI slice
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Upload an axial brain MRI slice to add an imaging indicator to this session. Research and education only — it
          is not a radiology report.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
        />
        <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : <Upload className="mr-2 size-4" aria-hidden />}
          {busy ? "Analysing…" : "Choose MRI image"}
        </Button>
        {preview ? (
          <img
            src={preview}
            alt="Uploaded brain MRI slice preview"
            className="h-40 w-40 rounded-xl border border-border object-cover"
          />
        ) : null}
        {result ? (
          <div className="rounded-xl border border-border p-3 text-sm">
            <p className="font-semibold">{result.className}</p>
            <p className="text-muted-foreground">Confidence {Math.round(result.confidence * 100)}%</p>
            {result.rationale ? <p className="mt-1 text-muted-foreground">{result.rationale}</p> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
