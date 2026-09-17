import { describe, expect, it } from "vitest";
import { API_BASE_URL, kindFromStatus } from "../client";
import { extractToken, extractUser } from "../auth";
import { PAYMENT_INITIATION_SUPPORTED, paymentStateCopy, readPaymentState } from "../payments";
import { isTerminalPaymentState, NON_TERMINAL_PAYMENT_STATES } from "../types";
import { CONTRACT, LEGACY_BACKEND } from "../../contract";

describe("backend target", () => {
  it("points at the authoritative backend, never the legacy host", () => {
    expect(API_BASE_URL).toBe("https://foodypop-backend.onrender.com");
    expect(API_BASE_URL).not.toContain("foodypop-api.onrender.com");
    expect(LEGACY_BACKEND).toBe("https://foodypop-api.onrender.com");
  });

  it("only registers endpoints that were probed as verified", () => {
    expect(CONTRACT.length).toBeGreaterThan(0);
    for (const entry of CONTRACT) {
      expect(entry.status).toBe("VERIFIED");
      expect(entry.evidence.length).toBeGreaterThan(0);
    }
  });
});

describe("error normalization", () => {
  it("maps HTTP status to a stable kind", () => {
    expect(kindFromStatus(401)).toBe("unauthorized");
    expect(kindFromStatus(403)).toBe("forbidden");
    expect(kindFromStatus(404)).toBe("not_found");
    expect(kindFromStatus(429)).toBe("rate_limited");
    expect(kindFromStatus(422)).toBe("validation");
    expect(kindFromStatus(503)).toBe("server");
    expect(kindFromStatus(418)).toBe("unknown");
  });
});

describe("auth payload reading", () => {
  it("reads tokens from several documented-unknown shapes", () => {
    expect(extractToken({ accessToken: "a" })).toBe("a");
    expect(extractToken({ data: { token: "b" } })).toBe("b");
    expect(extractToken({ nothing: true })).toBeNull();
    expect(extractUser({ user: { id: "u1" } })?.id).toBe("u1");
    expect(extractUser(null)).toBeNull();
  });
});

describe("payment safety", () => {
  it("never claims payment initiation support", () => {
    expect(PAYMENT_INITIATION_SUPPORTED).toBe(false);
  });

  it("keeps TIMEOUT and UNKNOWN non-terminal", () => {
    expect(NON_TERMINAL_PAYMENT_STATES).toContain("TIMEOUT");
    expect(NON_TERMINAL_PAYMENT_STATES).toContain("UNKNOWN");
    expect(isTerminalPaymentState("TIMEOUT")).toBe(false);
    expect(isTerminalPaymentState("UNKNOWN")).toBe(false);
    expect(isTerminalPaymentState("SUCCESS")).toBe(true);
    expect(paymentStateCopy("TIMEOUT").terminal).toBe(false);
    expect(paymentStateCopy("UNKNOWN").terminal).toBe(false);
  });

  it("ignores unrecognised payment values instead of guessing", () => {
    expect(readPaymentState("PAID")).toBeNull();
    expect(readPaymentState(undefined)).toBeNull();
    expect(readPaymentState("success")).toBe("SUCCESS");
  });
});
