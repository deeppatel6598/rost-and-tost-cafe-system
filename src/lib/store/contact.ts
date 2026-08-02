import { generateId } from "@/lib/format";
import { db } from "@/lib/store/db";
import type { ContactMessage } from "@/lib/types";

export function listContactMessages(): ContactMessage[] {
  return [...db.contactMessages].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function createContactMessage(input: { name: string; email: string; message: string }): ContactMessage {
  const msg: ContactMessage = {
    id: generateId("msg"),
    ...input,
    createdAt: new Date().toISOString(),
    read: false,
  };
  db.contactMessages.push(msg);
  return msg;
}

export function markContactMessageRead(id: string): ContactMessage | undefined {
  const msg = db.contactMessages.find((m) => m.id === id);
  if (!msg) return undefined;
  msg.read = true;
  return msg;
}
