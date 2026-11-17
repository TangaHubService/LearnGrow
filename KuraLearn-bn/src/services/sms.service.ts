import { env } from "../config/env.js";

export type SmsResult =
  | { status: "sent"; provider: string; to: string; messageId?: string; cost?: string }
  | { status: "logged"; provider: "console"; to: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; provider: string; to: string; error: string };

/**
 * Normalise a Rwandan mobile number to E.164 (+2507XXXXXXXX).
 * Accepts 07XXXXXXXX, 7XXXXXXXX, 2507XXXXXXXX and +2507XXXXXXXX, with spaces or dashes.
 * Returns null for anything that is not a Rwandan mobile number.
 */
export function normalizeRwandaPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, "").replace(/^\+/, "");
  let local: string;
  if (digits.startsWith("250")) local = digits.slice(3);
  else if (digits.startsWith("0")) local = digits.slice(1);
  else local = digits;
  return /^7[2389]\d{7}$/.test(local) ? `+250${local}` : null;
}

function provider() {
  if (env.SMS_PROVIDER === "africastalking" && env.AFRICASTALKING_API_KEY && env.AFRICASTALKING_USERNAME) {
    return "africastalking" as const;
  }
  return "console" as const;
}

/** Whether texts actually leave the server (false means they are only logged). */
export function smsDeliveryEnabled() {
  return provider() !== "console";
}

async function sendViaAfricasTalking(to: string, message: string): Promise<SmsResult> {
  const sandbox = env.AFRICASTALKING_USERNAME === "sandbox";
  const url = sandbox
    ? "https://api.sandbox.africastalking.com/version1/messaging"
    : "https://api.africastalking.com/version1/messaging";
  const body = new URLSearchParams({ username: env.AFRICASTALKING_USERNAME!, to, message });
  if (env.AFRICASTALKING_SENDER_ID) body.set("from", env.AFRICASTALKING_SENDER_ID);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        apiKey: env.AFRICASTALKING_API_KEY!,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: controller.signal,
    });
    const json = (await response.json().catch(() => null)) as
      | { SMSMessageData?: { Recipients?: Array<{ status: string; messageId?: string; cost?: string }> } }
      | null;
    const recipient = json?.SMSMessageData?.Recipients?.[0];
    if (!response.ok || !recipient || !["Success", "Sent"].includes(recipient.status)) {
      return {
        status: "failed",
        provider: "africastalking",
        to,
        error: recipient?.status ?? `HTTP ${response.status}`,
      };
    }
    return { status: "sent", provider: "africastalking", to, messageId: recipient.messageId, cost: recipient.cost };
  } catch (error) {
    return {
      status: "failed",
      provider: "africastalking",
      to,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Send one text message. Never throws: the caller gets a result to log. */
export async function sendSms(rawPhone: string | null | undefined, message: string): Promise<SmsResult> {
  const to = normalizeRwandaPhone(rawPhone);
  if (!to) return { status: "skipped", reason: "No valid Rwandan mobile number" };
  const text = message.length > 320 ? `${message.slice(0, 317)}...` : message;

  if (provider() === "africastalking") return sendViaAfricasTalking(to, text);

  // No provider configured: log instead, so development and demos work without credentials.
  console.log(`[SMS:console] to ${to.slice(0, 7)}***** — ${text}`);
  return { status: "logged", provider: "console", to };
}
