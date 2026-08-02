"use client";

import { useEffect, useState } from "react";
import type { CafeSettings, ContactMessage } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatDayLabel } from "@/lib/format";

export default function SettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<CafeSettings | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings));
    fetch("/api/contact")
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((d) => setMessages(d.messages ?? []));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      showToast("Saved café details", "success");
    } catch {
      showToast("Could not save changes.", "danger");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return null;

  function field<K extends keyof CafeSettings>(key: K, label: string, type: "text" | "number" = "text") {
    return (
      <label className="grid gap-1.5">
        <span className="t-overline text-text-faint">{label}</span>
        <input
          type={type}
          value={settings![key] as string | number}
          onChange={(e) => setSettings({ ...settings!, [key]: type === "number" ? Number(e.target.value) : e.target.value })}
          className="h-11 rounded-md border border-border bg-surface px-3"
        />
      </label>
    );
  }

  return (
    <div className="grid max-w-3xl gap-8 px-[var(--gutter-admin)] py-5">
      <div>
        <span className="t-display-sm mb-5 block">Café details</span>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          {field("name", "Name")}
          {field("tagline", "Tagline")}
          {field("addressLine1", "Address line 1")}
          {field("addressLine2", "Address line 2")}
          {field("phone", "Phone")}
          {field("hours", "Hours")}
          {field("rating", "Google rating", "number")}
          {field("reviewCount", "Review count", "number")}
          <div className="sm:col-span-2">{field("mapsUrl", "Google Maps link")}</div>
          <div className="sm:col-span-2">
            <Button type="submit" size="admin" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>

      <div>
        <span className="t-display-sm mb-5 block">Contact messages</span>
        {messages.length === 0 ? (
          <p className="t-body-sm text-text-muted">No messages from the website's contact form yet.</p>
        ) : (
          <div className="grid gap-3">
            {messages.map((m) => (
              <div key={m.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="t-title-sm">{m.name}</span>
                  <span className="t-body-sm text-text-muted">{m.email}</span>
                  <span className="t-caption ml-auto text-text-faint">{formatDayLabel(m.createdAt)}</span>
                </div>
                <p className="t-body-sm mt-2 text-text-body">{m.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
