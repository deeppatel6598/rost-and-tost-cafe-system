"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <span className="t-title-md block">Thanks — got it.</span>
        <span className="t-body-sm text-text-muted">We'll get back to you soon.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-border bg-surface p-6">
      <span className="t-title-md">Get in touch</span>
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="h-11 rounded-md border border-border bg-bg px-3"
      />
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="h-11 rounded-md border border-border bg-bg px-3"
      />
      <textarea
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message"
        rows={3}
        className="resize-none rounded-md border border-border bg-bg px-3 py-2"
      />
      {status === "error" && <p className="t-body-sm text-danger">Something went wrong — please try again.</p>}
      <Button type="submit" size="guest" disabled={status === "sending"} className="justify-self-start">
        {status === "sending" ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
