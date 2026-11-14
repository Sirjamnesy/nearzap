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
  partIndex?: number;       // which part (deposit / milestone) of the invoice this attempt pays; undefined = part 0
}

export interface ReceiveAsset { assetId: string; symbol: string; blockchain: string; decimals: number; price?: number }
export interface Split { account: string; percent: number }   // share of each payment sent to another NEAR account
export interface Part { label: string; cents: number }        // a deposit or milestone

export interface Invoice {
  id: string;
  createdAt: string;
  freelancerName: string;
  freelancerNear: string;   // NEAR account that receives the USDC
  clientName: string;
  clientEmail?: string;
  currency: "USDC";
  /** intents-balance: delivered to the payee's NEAR Intents balance (gasless). wallet / near-wallet: sent to an address on the chosen chain. */
  payout: "intents-balance" | "wallet" | "near-wallet";
  receive?: ReceiveAsset;   // what the payee receives; USDC on NEAR when absent
  splits?: Split[];
  parts?: Part[];           // deposit + balance or milestones; totalCents is their sum
  handle?: string;          // set when created from a Pay me page
  items: LineItem[];
  totalCents: number;
  dueDate: string;          // YYYY-MM-DD, or "" for no due date
  memo?: string;
  attempts: PaymentAttempt[];
}

export type InvoiceState = "open" | "pending" | "partial" | "paid" | "refunded" | "overdue";

export interface TokenInfo {
  assetId: string; decimals: number; blockchain: string; symbol: string; price?: number;
}
