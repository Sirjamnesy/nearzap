export type AttemptStatus =
  | "PENDING_DEPOSIT" | "KNOWN_DEPOSIT_TX" | "PROCESSING" | "SUCCESS"
  | "INCOMPLETE_DEPOSIT" | "REFUNDED" | "FAILED" | "EXPIRED";

export const TERMINAL: AttemptStatus[] = ["SUCCESS", "REFUNDED", "FAILED", "EXPIRED"];

export interface LineItem { description: string; qty: number; unitCents: number }

export interface PaymentAttempt {
  id: string;
  createdAt: string;
  originAsset: string;
  originSymbol: string;
  originChain: string;
  depositAddress: string;
  amountIn: string;        // smallest unit of origin asset, as returned by 1Click
  amountInFormatted: string;
  deadline: string;
  refundTo: string;
  status: AttemptStatus;
  txHashes: { kind: "origin" | "destination"; hash: string; url?: string }[];
  updatedAt: string;
  demo: boolean;
  demoDepositAt?: string;   // demo mode only: when the simulated deposit was made
}

export interface Invoice {
  id: string;
  createdAt: string;
  freelancerName: string;
  freelancerNear: string;   // NEAR account that receives the USDC
  clientName: string;
  clientEmail?: string;
  currency: "USDC";
  payout: "intents-balance" | "near-wallet";
  items: LineItem[];
  totalCents: number;
  dueDate: string;          // YYYY-MM-DD
  memo?: string;
  attempts: PaymentAttempt[];
}

export type InvoiceState = "open" | "pending" | "paid" | "refunded" | "overdue";

export interface TokenInfo {
  assetId: string; decimals: number; blockchain: string; symbol: string; price?: number;
}
