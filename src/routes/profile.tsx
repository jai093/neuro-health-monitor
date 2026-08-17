import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { emptyProfile, useNeuro, type Profile } from "@/lib/neuro-store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — NeuroShield AI" },
      {
        name: "description",
        content:
          "Manage your NeuroShield AI profile: personal details, medical history, emergency contact, consent and stored data.",
      },
      { property: "og:title", content: "Your Profile — NeuroShield AI" },
      {
        property: "og:description",
        content: "Personal details, consent settings and local data controls.",
      },
    ],
  }),
  component: ProfilePage,
});

const fields: { key: keyof Profile; label: string; type?: string }[] = [
  { key: "fullName", label: "Full name" },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "dob", label: "Date of birth", type: "date" },
  { key: "emergencyContact", label: "Emergency contact" },
];

function ProfilePage() {
  const { state, hydrated, saveProfile, clearAll } = useNeuro();
  const [form, setForm] = useState<Profile>(emptyProfile);

  useEffect(() => {
    if (hydrated) setForm(state.profile);
  }, [hydrated, state.profile]);

  const set = (key: keyof Profile, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }) as Profile);

  const submit = () => {
    if (!form.disclaimerAccepted) {
      toast.error("Please accept the medical disclaimer to continue.");
      return;
    }
    saveProfile({ ...form, registered: true });
    toast.success("Profile saved on this device.");
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Account"
        title="Your Profile"
        description="Stored only in this browser. Clearing your data removes every assessment permanently."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Personal & medical details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input
                  id={f.key}
                  type={f.type ?? "text"}
                  value={String(form[f.key] ?? "")}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              </div>
            ))}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="conditions">Existing conditions</Label>
              <Textarea id="conditions" value={form.conditions} onChange={(e) => set("conditions", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="medications">Current medications</Label>
              <Textarea id="medications" value={form.medications} onChange={(e) => set("medications", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes for yourself</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={submit}>Save profile</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Consent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
                <Label htmlFor="disc" className="text-sm font-normal leading-relaxed">
                  I understand NeuroShield AI provides preliminary screening only and is not a medical diagnosis.
                </Label>
                <Switch
                  id="disc"
                  checked={form.disclaimerAccepted}
                  onCheckedChange={(v) => set("disclaimerAccepted", v)}
                />
              </div>
              <div className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
                <Label htmlFor="media" className="text-sm font-normal leading-relaxed">
                  Allow camera and microphone use for motor and voice tasks (processed on this device).
                </Label>
                <Switch id="media" checked={form.consentMedia} onCheckedChange={(v) => set("consentMedia", v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stored data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {state.assessments.length} assessment{state.assessments.length === 1 ? "" : "s"} saved locally.
              </p>
              <Button
                variant="destructive"
                onClick={() => {
                  clearAll();
                  setForm(emptyProfile);
                  toast.success("All local data cleared.");
                }}
              >
                Clear all data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
