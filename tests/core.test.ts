import { describe, it, expect } from "vitest";
import { centsToUsdcUnits, formatUnits, formatUsd, invoiceState, totalCents, validateInput, validNearAccount } from "../lib/invoice";
import { invoicesToCsv, CSV_HEADER } from "../lib/csv";
import { buildQuoteRequest, extractTxHashes, normaliseStatus, findPayoutAsset } from "../lib/oneclick";
import type { Invoice, PaymentAttempt, TokenInfo } from "../lib/types";

const attempt = (over: Partial<PaymentAttempt> = {}): PaymentAttempt => ({
  id: "a1", createdAt: "2026-11-01T00:00:00Z", originAsset: "nep141:eth.omft.near", originSymbol: "ETH", originChain: "eth",
  depositAddress: "0xdep", amountIn: "1000000000000000", amountInFormatted: "0.001", deadline: new Date(Date.now() + 600_000).toISOString(),
  refundTo: "0xme", status: "PENDING_DEPOSIT", txHashes: [], updatedAt: "2026-11-02T00:00:00Z", demo: false, ...over,
});
const inv = (over: Partial<Invoice> = {}): Invoice => ({
  id: "inv_1", createdAt: "2026-11-01T00:00:00Z", freelancerName: "Ada", freelancerNear: "ada.near", clientName: "Acme, Inc.", currency: "USDC",
  payout: "intents-balance", items: [{ description: "Design", qty: 2, unitCents: 15000 }], totalCents: 30000, dueDate: "2026-12-01", attempts: [], ...over,
});

describe("money", () => {
  it("sums line items in integer cents", () => expect(totalCents([{ description: "a", qty: 1.5, unitCents: 3333 }, { description: "b", qty: 1, unitCents: 1 }])).toBe(5001));
  it("converts cents to 6-decimal USDC units exactly", () => { expect(centsToUsdcUnits(30000)).toBe("300000000"); expect(centsToUsdcUnits(1)).toBe("10000"); });
  it("rejects bad cents", () => { expect(() => centsToUsdcUnits(1.5)).toThrow(); expect(() => centsToUsdcUnits(-1)).toThrow(); });
  it("formats", () => { expect(formatUsd(123456)).toBe("$1,234.56"); expect(formatUnits("1500000", 6)).toBe("1.5"); expect(formatUnits("1", 18, 8)).toBe("0"); });
});

describe("validation", () => {
  it("accepts a good NEAR account and rejects junk", () => { expect(validNearAccount("alice.near")).toBe(true); expect(validNearAccount("Alice.near")).toBe(false); expect(validNearAccount("a")).toBe(false); expect(validNearAccount("bad..near")).toBe(false); });
  it("returns errors for an empty invoice", () => expect(validateInput({}).length).toBeGreaterThan(3));
  it("accepts a valid invoice", () => expect(validateInput({ freelancerName: "Ada", freelancerNear: "ada.near", clientName: "Acme", dueDate: "2026-12-01", items: [{ description: "x", qty: 1, unitCents: 100 }] })).toEqual([]));
});

describe("invoice state", () => {
  const now = new Date("2026-11-14T00:00:00Z");
  it("open before due, overdue after", () => { expect(invoiceState(inv(), now)).toBe("open"); expect(invoiceState(inv({ dueDate: "2026-11-01" }), now)).toBe("overdue"); });
  it("paid wins", () => expect(invoiceState(inv({ attempts: [attempt({ status: "SUCCESS" })] }), now)).toBe("paid"));
  it("pending while a live deposit is awaited", () => expect(invoiceState(inv({ attempts: [attempt()] }), now)).toBe("pending"));
  it("refunded when last attempt refunded", () => expect(invoiceState(inv({ attempts: [attempt({ status: "REFUNDED" })] }), now)).toBe("refunded"));
  it("expired quote returns to open", () => expect(invoiceState(inv({ attempts: [attempt({ status: "EXPIRED" })] }), now)).toBe("open"));
});

describe("csv", () => {
  it("has a header and one row per line item with escaping", () => {
    const csv = invoicesToCsv([inv({ items: [{ description: 'Logo, "v2"', qty: 1, unitCents: 10000 }, { description: "=HYPERLINK(1)", qty: 1, unitCents: 5000 }], totalCents: 15000 })], new Date("2026-11-14T00:00:00Z"));
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe(CSV_HEADER.join(","));
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('"1 x Logo, ""v2"""');
    expect(lines[2]).toContain("1 x =HYPERLINK(1)"); // cell starts with a digit, so it is not a formula
  });
  it("neutralises cells that start with a formula character", () => {
    const csv = invoicesToCsv([inv({ clientName: "=cmd|' /C calc'!A0" })]);
    expect(csv).toContain("'=cmd");
  });
  it("includes payment details for paid invoices", () => {
    const csv = invoicesToCsv([inv({ attempts: [attempt({ status: "SUCCESS", txHashes: [{ kind: "origin", hash: "0xabc" }] })] })]);
    expect(csv).toContain("paid"); expect(csv).toContain("ETH on eth"); expect(csv).toContain("0xabc");
  });
});

describe("1click mapping", () => {
  const usdc: TokenInfo = { assetId: "nep141:usdc.near", decimals: 6, blockchain: "near", symbol: "USDC" };
  const eth: TokenInfo = { assetId: "nep141:eth.omft.near", decimals: 18, blockchain: "eth", symbol: "ETH" };
  it("builds an EXACT_OUTPUT quote that pays the freelancer exactly the invoice total", () => {
    const q = buildQuoteRequest({ invoice: inv(), origin: eth, refundTo: "0xme", dry: false }, usdc);
    expect(q).toMatchObject({ swapType: "EXACT_OUTPUT", amount: "300000000", destinationAsset: "nep141:usdc.near", recipient: "ada.near", recipientType: "INTENTS", depositType: "ORIGIN_CHAIN", refundTo: "0xme", dry: false });
  });
  it("pays to the wallet when asked", () => expect(buildQuoteRequest({ invoice: inv({ payout: "near-wallet" }), origin: eth, refundTo: "0xme", dry: true }, usdc).recipientType).toBe("DESTINATION_CHAIN"));
  it("finds USDC on NEAR and fails loudly when absent", () => { expect(findPayoutAsset([eth, usdc])).toBe(usdc); expect(() => findPayoutAsset([eth])).toThrow(/USDC on NEAR/); });
  it("normalises statuses", () => { expect(normaliseStatus("success")).toBe("SUCCESS"); expect(normaliseStatus("REFUNDED")).toBe("REFUNDED"); expect(normaliseStatus("???")).toBe("PENDING_DEPOSIT"); });
  it("extracts tx hashes defensively", () => {
    expect(extractTxHashes({})).toEqual([]);
    expect(extractTxHashes({ swapDetails: { originChainTxHashes: [{ hash: "0x1", explorerUrl: "https://e/0x1" }], destinationChainTxHashes: [{ hash: "N1" }] } }))
      .toEqual([{ kind: "origin", hash: "0x1", url: "https://e/0x1" }, { kind: "destination", hash: "N1", url: undefined }]);
  });
});
