import { describe, it, expect } from "vitest";
import { centsToUsdcUnits, formatUnits, formatUsd, invoiceState, partState, totalCents, validAddress, validateInput, validNearAccount } from "../lib/invoice";
import { invoicesToCsv, CSV_HEADER } from "../lib/csv";
import { appFeesFor, buildQuoteRequest, centsToAssetUnits, extractTxHashes, normaliseStatus, findPayoutAsset, payableTokens } from "../lib/oneclick";
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
  it("returns errors for an empty invoice", () => expect(validateInput({}).length).toBeGreaterThanOrEqual(3));
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

describe("payable token list", () => {
  const T = (symbol: string, blockchain: string, price: number | undefined = 1): TokenInfo => ({ assetId: `${symbol}-${blockchain}`, decimals: 6, blockchain, symbol, price });
  it("keeps common priced assets, drops deprecated, unpriced and long-tail tokens, stablecoins first", () => {
    const out = payableTokens([T("ETH", "eth", 1800), T("PEPE", "eth", 0.1), T("USDC(DEPRECATED)", "bsc"), T("USDC", "base"), T("ABG", "near", 0), T("USDT", "eth"), T("SOL", "sol", 0)]);
    expect(out.map(t => t.symbol)).toEqual(["USDC", "USDT", "ETH"]);
  });
});

describe("deposit and milestone parts", () => {
  const parts = [{ label: "Deposit", cents: 5000 }, { label: "Balance", cents: 5000 }];
  const base = () => inv({ totalCents: 10000, parts, attempts: [] });
  it("is partial after one part is paid and paid after both", () => {
    const one = base(); one.attempts = [attempt({ status: "SUCCESS", partIndex: 0 })];
    expect(partState(one, 0)).toBe("paid"); expect(partState(one, 1)).toBe("open"); expect(invoiceState(one)).toBe("partial");
    const both = base(); both.attempts = [attempt({ status: "SUCCESS", partIndex: 0 }), attempt({ id: "a2", status: "SUCCESS", partIndex: 1 })];
    expect(invoiceState(both)).toBe("paid");
  });
  it("quotes only the selected part", () => {
    const dest = { assetId: "d", symbol: "USDC", blockchain: "near", decimals: 6 };
    const origin = { assetId: "o", symbol: "ETH", blockchain: "eth", decimals: 18 };
    const q = buildQuoteRequest({ invoice: base(), origin, refundTo: "0xme", dry: true, partIndex: 1 }, dest);
    expect(q.amount).toBe("50000000");
  });
  it("rejects parts that do not add up", () => {
    const e = validateInput({ freelancerName: "Ada", freelancerNear: "ada.near", items: [{ description: "x", qty: 1, unitCents: 10000 }], parts: [{ label: "a", cents: 1000 }, { label: "b", cents: 1000 }] });
    expect(e.join(" ")).toMatch(/add up/);
  });
});

describe("receive asset and addresses", () => {
  it("converts cents exactly for stablecoins and by price for others", () => {
    expect(centsToAssetUnits(1234, { assetId: "u", symbol: "USDC", blockchain: "base", decimals: 6 })).toBe("12340000");
    expect(centsToAssetUnits(3000, { assetId: "e", symbol: "ETH", blockchain: "eth", decimals: 18, price: 3000 })).toBe("10000000000000000");
    expect(() => centsToAssetUnits(100, { assetId: "x", symbol: "XYZ", blockchain: "eth", decimals: 18 })).toThrow();
  });
  it("checks addresses by chain", () => {
    expect(validAddress("base", "0x" + "a".repeat(40))).toBe(true);
    expect(validAddress("base", "alice.near")).toBe(false);
    expect(validAddress("sol", "4Nd1mYQq1g1nQjL3m6kqZ8mB5uJ8v9x7r3tYq2WcQp5D")).toBe(true);
    expect(validAddress("near", "alice.near")).toBe(true);
  });
  it("requires an address for the chosen chain when delivering to a wallet", () => {
    const e = validateInput({ freelancerName: "Ada", freelancerNear: "ada.near", payout: "wallet", receive: { assetId: "u", symbol: "USDC", blockchain: "base", decimals: 6 }, items: [{ description: "x", qty: 1, unitCents: 100 }] });
    expect(e.join(" ")).toMatch(/base address/);
  });
});

describe("referral shares", () => {
  it("grosses up the fee so the payer pays about the invoice amount", () => {
    const { fees, payeeShare } = appFeesFor(inv({ splits: [{ account: "ref.near", percent: 4 }] }));
    expect(payeeShare).toBeCloseTo(0.96); expect(fees).toEqual([{ recipient: "ref.near", fee: 417 }]);
    expect(fees[0].fee).toBeLessThanOrEqual(500);
  });
  it("rejects shares above the 1Click fee cap", () => {
    const e = validateInput({ freelancerName: "Ada", freelancerNear: "ada.near", items: [{ description: "x", qty: 1, unitCents: 100 }], splits: [{ account: "ref.near", percent: 20 }] });
    expect(e.join(" ")).toMatch(/between 1% and 4%/);
  });
  it("adds no app fees by default", () => { expect(appFeesFor(inv()).fees).toEqual([]); });
});
