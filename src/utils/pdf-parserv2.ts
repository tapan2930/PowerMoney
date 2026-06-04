// import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { extractText } from 'expo-pdf-text-extract';
import { initLlama } from 'llama.rn';
import { autoCategorize } from './categorizer';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedTransaction {
    date: string;           // YYYY-MM-DD
    merchant: string;       // cleaned merchant name
    description: string;    // original ledger text
    amount: number;         // always positive
    type: 'expense' | 'income';
    categoryId?: string | null;
    importHash: string;     // dedup key
}

interface RawTransactionRow {
    date: string;           // raw date string as found in statement
    description: string;    // raw merchant/description text
    amount: number;         // always positive
    isCredit: boolean;      // true = income
}

// ─────────────────────────────────────────────────────────────────────────────
// BANK CONFIG SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

interface BankConfig {
    id: string;
    name: string;

    // How to recognize this bank's statement
    detect: (rawText: string) => boolean;

    // Where the transaction table starts and ends
    transactionBlock: {
        start: RegExp;
        end: RegExp;
    };

    // Regex to parse a single transaction line
    linePattern: {
        regex: RegExp;
        groups: {
            transDate: number;
            description: number;
            amount: number;
        };
    };

    // How to interpret the parsed amount
    amount: {
        // 'negative'      → negative number = expense (Neo style)
        // 'trailing_minus'→ "92.82-" = credit (Scotiabank style)
        // 'keyword'       → match description against creditKeywords
        // 'never'         → all lines are expenses (Wealthsimple purchases)
        creditWhen: 'negative' | 'trailing_minus' | 'keyword' | 'never';
        creditKeywords?: RegExp;
        stripChars: RegExp;
    };

    date: {
        format: 'MMM DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
        yearSource: 'statement_header' | 'current_year';
    };

    // Lines to skip even if they match linePattern
    skipLine?: RegExp;
}

// ─────────────────────────────────────────────────────────────────────────────
// BANK REGISTRY (Array — ordered, first match wins)
// ─────────────────────────────────────────────────────────────────────────────

const MONTH_NAMES = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec';
const MMM_DD = `(?:${MONTH_NAMES})\\s+\\d{1,2}`;

const BANK_REGISTRY: BankConfig[] = [

    // ── Scotiabank ─────────────────────────────────────────────────────────────
    // Line: "001 Apr 4 Apr 6 V-DESI SUPERSTORE WINDSOR ON 9.23"
    // Line: "010 Apr 14 Apr 15 SCENE+ TRAVEL CREDIT 92.82-"
    {
        id: 'scotiabank',
        name: 'Scotiabank',

        detect: (raw) => /scotiabank/i.test(raw),

        transactionBlock: {
            start: /transactions since your last statement/i,
            end: /sub-total|interest charges posted/i,
        },

        linePattern: {
            regex: new RegExp(
                `^(?:\\d{3}\\s+)?` +  // optional ref# (001, 002 …)
                `(${MMM_DD})\\s+` +  // [1] trans date
                `(?:${MMM_DD})\\s+` +  // post date (skip)
                `(.+?)\\s+` +  // [2] description
                `(\\d[\\d,]*\\.\\d{2}-?)\\s*$`, // [3] amount (trailing - = credit)
                'i'
            ),
            groups: { transDate: 1, description: 2, amount: 3 },
        },

        amount: {
            creditWhen: 'trailing_minus',
            stripChars: /[$,\s]/g,
        },

        date: {
            format: 'MMM DD',
            yearSource: 'statement_header',
        }
    },

    // ── Neo Financial ──────────────────────────────────────────────────────────
    // Line: "May 11 May 12 AVIVA GENERAL INSURANC MARKHAM CAN -334.08"
    // Line: "May 7  May 7  Payment Received, Thank you  620.00"
    {
        id: 'neo',
        name: 'Neo Financial',

        detect: (raw) => /neo financial/i.test(raw),

        transactionBlock: {
            start: /^transactions$/im,
            end: /important information about your card/i,
        },

        linePattern: {
            regex: new RegExp(
                `^(${MMM_DD})\\s+` +  // [1] trans date
                `(?:${MMM_DD})\\s+` +  // post date (skip)
                `(.+?)\\s+` +  // [2] description
                `(-?\\d[\\d,]*\\.\\d{2})\\s*$`,// [3] amount (negative = expense in Neo)
                'i'
            ),
            groups: { transDate: 1, description: 2, amount: 3 },
        },

        amount: {
            // Neo: expenses are NEGATIVE, income (payments) are POSITIVE
            // So creditWhen = 'negative' means: if parsed number > 0 → income
            creditWhen: 'negative',
            stripChars: /[$,\s]/g,
        },

        date: {
            format: 'MMM DD',
            yearSource: 'statement_header',
        },

        skipLine: /reward cashed out/i,
    },

    // ── Wealthsimple ───────────────────────────────────────────────────────────
    // Line: "May 2 May 3 Purchase CAMPBELL VARIETY $6.98"
    {
        id: 'wealthsimple',
        name: 'Wealthsimple',

        detect: (raw) => /wealthsimple/i.test(raw),

        transactionBlock: {
            start: /^activity$/im,
            end: /information about your wealthsimple/i,
        },

        linePattern: {
            regex: new RegExp(
                `^(${MMM_DD})\\s+` +  // [1] trans date
                `(?:${MMM_DD})\\s+` +  // post date (skip)
                `(?:Purchase|Debit|Credit|Payment|Refund)\\s+` +  // type column
                `(.+?)\\s+` +  // [2] description
                `\\$(\\d[\\d,]*\\.\\d{2})\\s*$`,                   // [3] amount
                'i'
            ),
            groups: { transDate: 1, description: 2, amount: 3 },
        },

        amount: {
            creditWhen: 'keyword',
            creditKeywords: /^(?:refund|payment|credit)/i,
            stripChars: /[$,\s]/g,
        },

        date: {
            format: 'MMM DD',
            yearSource: 'statement_header',
        },
    },

    // ── TD Bank ────────────────────────────────────────────────────────────────
    // Line: "Jan 15, 2026  TIM HORTONS #1234  4.75"
    // Line: "Jan 20, 2026  PAYROLL DEPOSIT    1200.00 CR"
    {
        id: 'td',
        name: 'TD Bank',

        detect: (raw) => /td\s+bank|toronto.?dominion/i.test(raw),

        transactionBlock: {
            start: /account activity|transaction details/i,
            end: /total debit|total credit|end of statement/i,
        },

        linePattern: {
            regex: new RegExp(
                `^(${MMM_DD},?\\s+\\d{4})\\s+` +  // [1] trans date (with year)
                `(.+?)\\s+` +  // [2] description
                `(\\d[\\d,]*\\.\\d{2})` +  // [3] amount
                `(?:\\s+(CR))?\\s*$`,              // optional CR suffix
                'i'
            ),
            groups: { transDate: 1, description: 2, amount: 3 },
        },

        amount: {
            creditWhen: 'keyword',
            creditKeywords: /\bCR\b/i,
            stripChars: /[$,\s]/g,
        },

        date: {
            format: 'MMM DD',
            yearSource: 'current_year',
        },
    },

    // ── RBC ────────────────────────────────────────────────────────────────────
    // Line: "04/15/2026  IGA GROCERY  23.45"  (expenses positive)
    // Line: "04/20/2026  PAYROLL      -1200.00" (income negative)
    {
        id: 'rbc',
        name: 'RBC Royal Bank',

        detect: (raw) => /\brbc\b|royal bank of canada/i.test(raw),

        transactionBlock: {
            start: /account activity|transactions/i,
            end: /total for period|end of transactions/i,
        },

        linePattern: {
            regex: /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-?\$?\d[\d,]*\.\d{2})\s*$/i,
            groups: { transDate: 1, description: 2, amount: 3 },
        },

        amount: {
            creditWhen: 'negative',
            stripChars: /[$,\s]/g,
        },

        date: {
            format: 'MM/DD/YYYY',
            yearSource: 'current_year',
        },
    },

    // ── CIBC ───────────────────────────────────────────────────────────────────
    // Line: "2026-04-15  TIM HORTONS  4.75"
    {
        id: 'cibc',
        name: 'CIBC',

        detect: (raw) => /\bcibc\b|canadian imperial/i.test(raw),

        transactionBlock: {
            start: /transactions|account activity/i,
            end: /total|end of statement/i,
        },

        linePattern: {
            regex: /^(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(-?\$?\d[\d,]*\.\d{2})\s*$/i,
            groups: { transDate: 1, description: 2, amount: 3 },
        },

        amount: {
            creditWhen: 'negative',
            stripChars: /[$,\s]/g,
        },

        date: {
            format: 'YYYY-MM-DD',
            yearSource: 'current_year',
        },
    },

    // ── BMO ────────────────────────────────────────────────────────────────────
    // Line: "Apr. 15  STARBUCKS  6.75"
    {
        id: 'bmo',
        name: 'BMO Bank of Montreal',

        detect: (raw) => /\bbmo\b|bank of montreal/i.test(raw),

        transactionBlock: {
            start: /transactions|account activity/i,
            end: /total purchases|end of statement/i,
        },

        linePattern: {
            regex: new RegExp(
                `^(${MMM_DD}\\.?)\\s+` +  // [1] trans date (may have period: "Apr.")
                `(.+?)\\s+` +  // [2] description
                `(-?\\$?\\d[\\d,]*\\.\\d{2})\\s*$`,
                'i'
            ),
            groups: { transDate: 1, description: 2, amount: 3 },
        },

        amount: {
            creditWhen: 'negative',
            stripChars: /[$,\s]/g,
        },

        date: {
            format: 'MMM DD',
            yearSource: 'statement_header',
        },
    },

    // ── Tangerine ──────────────────────────────────────────────────────────────
    // Line: "15/04/2026  NETFLIX.COM  16.99"
    {
        id: 'tangerine',
        name: 'Tangerine',

        detect: (raw) => /tangerine/i.test(raw),

        transactionBlock: {
            start: /transactions|account activity/i,
            end: /total|end of statement/i,
        },

        linePattern: {
            regex: /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-?\$?\d[\d,]*\.\d{2})\s*$/i,
            groups: { transDate: 1, description: 2, amount: 3 },
        },

        amount: {
            creditWhen: 'negative',
            stripChars: /[$,\s]/g,
        },

        date: {
            format: 'DD/MM/YYYY',
            yearSource: 'current_year',
        },
    },

    // ── Simplii Financial ──────────────────────────────────────────────────────
    {
        id: 'simplii',
        name: 'Simplii Financial',

        detect: (raw) => /simplii/i.test(raw),

        transactionBlock: {
            start: /transactions|account activity/i,
            end: /total|end of statement/i,
        },

        linePattern: {
            regex: /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-?\$?\d[\d,]*\.\d{2})\s*$/i,
            groups: { transDate: 1, description: 2, amount: 3 },
        },

        amount: {
            creditWhen: 'negative',
            stripChars: /[$,\s]/g,
        },

        date: {
            format: 'DD/MM/YYYY',
            yearSource: 'current_year',
        },
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC BANK REGISTRATION (LLM-discovered unknown banks)
// ─────────────────────────────────────────────────────────────────────────────

const REGISTRY_CACHE_KEY = 'dynamic_bank_registry';

async function loadDynamicBanks(): Promise<void> {
    try {
        // const raw = await AsyncStorage.getItem(REGISTRY_CACHE_KEY);
        if (true) return;
        // const configs: BankConfig[] = JSON.parse(raw);
        // for (const config of configs) {
        //   // Restore regex from serialized strings
        //   config.detect = (text: string) =>
        //     new RegExp(config.id, 'i').test(text);
        //   config.transactionBlock.start = new RegExp(
        //     (config.transactionBlock.start as any).source, 'i'
        //   );
        //   config.transactionBlock.end = new RegExp(
        //     (config.transactionBlock.end as any).source, 'i'
        //   );
        //   config.linePattern.regex = new RegExp(
        //     (config.linePattern.regex as any).source, 'i'
        //   );
        //   config.amount.stripChars = /[$,\s]/g;
        //   if (!BANK_REGISTRY.find(b => b.id === config.id)) {
        //     BANK_REGISTRY.push(config);
        //   }
        // }
    } catch (e) {
        console.warn('Could not load dynamic bank registry:', e);
    }
}

const AsyncStorage = {
    getItem: async (key: string): Promise<string | null> => null,
    setItem: async (key: string, value: string): Promise<void> => {},
};

async function saveDynamicBank(config: BankConfig): Promise<void> {
    try {
        const raw = await AsyncStorage.getItem(REGISTRY_CACHE_KEY);
        const existing: any[] = raw ? JSON.parse(raw) : [];
        const idx = existing.findIndex(b => b.id === config.id);
        // Serialize regex as source strings for storage
        const serializable = {
            ...config,
            detect: undefined,
            transactionBlock: {
                start: { source: config.transactionBlock.start.source },
                end: { source: config.transactionBlock.end.source },
            },
            linePattern: {
                ...config.linePattern,
                regex: { source: config.linePattern.regex.source },
            },
            amount: {
                ...config.amount,
                stripChars: { source: config.amount.stripChars.source },
            },
        };
        if (idx !== -1) existing[idx] = serializable;
        else existing.push(serializable);
        await AsyncStorage.setItem(REGISTRY_CACHE_KEY, JSON.stringify(existing));
    } catch (e) {
        console.warn('Could not save dynamic bank config:', e);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — DETECT BANK
// ─────────────────────────────────────────────────────────────────────────────

function detectBank(rawText: string): BankConfig | null {
    return BANK_REGISTRY.find(b => b.detect(rawText)) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — EXTRACT STATEMENT YEAR
// ─────────────────────────────────────────────────────────────────────────────

function extractStatementYear(rawText: string): number {
    const currentYear = new Date().getFullYear();

    const patterns = [
        // "Statement Period Apr 6, 2026 - May 5, 2026"
        /statement\s+period.+?(\d{4})/i,
        // "Statement Date May 5, 2026"
        /statement\s+date.+?(\d{4})/i,
        // "Payment Due Date Jun 15, 2026"
        /(?:payment\s+)?due\s+date.+?(\d{4})/i,
        // "May 2026", "Apr 2026"
        /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,
        // Last resort: any standalone plausible 4-digit year
        /\b(20\d{2})\b/,
    ];

    for (const pattern of patterns) {
        const match = rawText.match(pattern);
        if (match) {
            const year = parseInt(match[1]);
            if (year >= 2000 && year <= currentYear + 1) {
                return year;
            }
        }
    }

    console.warn('Could not extract statement year, defaulting to current year.');
    return currentYear;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — ISOLATE TRANSACTION BLOCK
// ─────────────────────────────────────────────────────────────────────────────

function extractTransactionBlock(rawText: string, config: BankConfig): string {
    const startMatch = rawText.search(config.transactionBlock.start);
    if (startMatch === -1) {
        console.warn(`Could not find transaction block start for: ${config.name}`);
        return rawText; // fall back to full text
    }

    const endMatch = rawText.search(config.transactionBlock.end);
    const endIdx = endMatch !== -1 && endMatch > startMatch
        ? endMatch
        : rawText.length;

    return rawText.substring(startMatch, endIdx).trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — PARSE SINGLE LINE
// ─────────────────────────────────────────────────────────────────────────────

function parseLineByConfig(
    line: string,
    config: BankConfig,
    statementYear: number
): RawTransactionRow | null {

    // Skip lines explicitly excluded for this bank
    if (config.skipLine?.test(line)) return null;

    const match = line.match(config.linePattern.regex);
    if (!match) return null;

    const { transDate, description, amount: amountGroup } = config.linePattern.groups;

    const rawDate = match[transDate]?.trim();
    const rawDesc = match[description]?.trim();
    const rawAmount = match[amountGroup]?.trim();

    if (!rawDate || !rawDesc || !rawAmount) return null;

    // Clean and parse amount
    const cleanAmount = rawAmount.replace(config.amount.stripChars, '');
    const amount = parseFloat(cleanAmount);
    if (isNaN(amount) || amount === 0) return null;

    // Determine if this is a credit/income
    const isCredit = resolveCredit(amount, rawAmount, rawDesc, config.amount);

    // Normalize date to ISO
    const date = parseToISODate(rawDate, config.date.format, statementYear);

    return {
        date,
        description: rawDesc,
        amount: Math.abs(amount),
        isCredit,
    };
}

function resolveCredit(
    amount: number,
    rawAmount: string,
    description: string,
    amountConfig: BankConfig['amount']
): boolean {
    switch (amountConfig.creditWhen) {
        case 'negative':
            // e.g. Neo: expenses stored as negative, income as positive
            return amount > 0;
        case 'trailing_minus':
            // e.g. Scotiabank: "92.82-" = credit
            return rawAmount.trim().endsWith('-');
        case 'keyword':
            // e.g. Wealthsimple: "Refund", "Payment" in description
            return amountConfig.creditKeywords?.test(description) ?? false;
        case 'never':
            return false;
        default:
            return false;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 — EXTRACT ALL ROWS FROM BLOCK
// ─────────────────────────────────────────────────────────────────────────────

function extractRawRows(
    block: string,
    config: BankConfig,
    statementYear: number
): RawTransactionRow[] {
    const lines = block
        .split(/[\r\n]+/)
        .map(l => l.trim())
        .filter(Boolean);

    const rows: RawTransactionRow[] = [];

    for (const line of lines) {
        const row = parseLineByConfig(line, config, statementYear);
        if (row) rows.push(row);
    }

    return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6 — DATE NORMALIZATION
// ─────────────────────────────────────────────────────────────────────────────

function parseToISODate(
    dateStr: string,
    format: BankConfig['date']['format'],
    year: number
): string {
    const months: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };

    const pad = (n: string) => n.padStart(2, '0');

    try {
        switch (format) {

            case 'MMM DD': {
                // "Apr 6", "Apr 6, 2026", "Apr. 6"
                const m = dateStr.match(
                    /^([A-Za-z]{3})\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?/
                );
                if (m) {
                    const month = months[m[1].toLowerCase()];
                    const day = pad(m[2]);
                    const yr = m[3] ? m[3] : String(year);
                    if (month) return `${yr}-${month}-${day}`;
                }
                break;
            }

            case 'DD/MM/YYYY': {
                // "15/04/2026"
                const m = dateStr.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
                if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
                break;
            }

            case 'MM/DD/YYYY': {
                // "04/15/2026"
                const m = dateStr.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
                if (m) return `${m[3]}-${pad(m[1])}-${pad(m[2])}`;
                break;
            }

            case 'YYYY-MM-DD': {
                // "2026-04-15" — already ISO
                const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                if (m) return dateStr;
                break;
            }
        }
    } catch {
        // fall through to default
    }

    // Fallback: return today
    console.warn(`Could not parse date: "${dateStr}" with format: ${format}`);
    return new Date().toISOString().split('T')[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7 — MERCHANT NAME CLEANING (regex-only fallback)
// ─────────────────────────────────────────────────────────────────────────────

function cleanMerchantFallback(description: string): string {
    return description
        // Remove payment prefixes
        .replace(/^paypal\s*\*/i, '')
        .replace(/^amzn\s+mktp\s+ca\*/i, 'Amazon ')
        .replace(/^amazon\.ca\*/i, 'Amazon ')
        .replace(/^google\s*\*/i, 'Google ')
        // Remove transaction IDs (8+ alphanumeric chars)
        .replace(/\b[A-Z0-9]{8,}\b/g, '')
        // Remove location suffixes
        .replace(/\b(CAN|ON|CA|QC|BC|AB|MB|SK|NB|NS|NL|PE|NT|YT|NU)\b/g, '')
        // Remove phone numbers
        .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '')
        // Remove standalone long numbers
        .replace(/\b\d{5,}\b/g, '')
        // Remove Google Pay suffix
        .replace(/\(GOOGLE PAY\)/gi, '')
        // Clean up punctuation and extra whitespace
        .replace(/[#*]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 8 — SERIALIZE ROWS FOR LLM
// ─────────────────────────────────────────────────────────────────────────────

// How many rows to send per LLM call.
// Small models (Qwen 0.5b, SmolLM) cap out around 10-12 rows before truncating.
// Pro models (Phi-4) can handle 25+.
const LLM_BATCH_SIZE: Record<'lite' | 'standard' | 'pro', number> = {
    lite: 8,
    standard: 12,
    pro: 25,
};

function serializeRowsForLLM(rows: RawTransactionRow[]): string {
    // Include index so we can align LLM output back to the original rows
    return rows
        .map((r, i) =>
            `${i} | ${r.date} | ${r.description} | ${r.isCredit ? 'CREDIT' : 'DEBIT'} | ${r.amount.toFixed(2)}`
        )
        .join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 9 — LLM ENRICHMENT
// ─────────────────────────────────────────────────────────────────────────────

async function enrichWithLLM(
    rows: RawTransactionRow[],
    modelTier: 'lite' | 'standard' | 'pro'
): Promise<ParsedTransaction[]> {
    const modelFileName =
        modelTier === 'pro' ? 'phi-4.gguf' :
            modelTier === 'standard' ? 'qwen-0.5b.gguf' :
                'smollm-135m.gguf';

    const modelPath = `${FileSystem.documentDirectory}models/${modelFileName}`;
    const batchSize = LLM_BATCH_SIZE[modelTier];

    // Init context ONCE, reuse across all batches
    const context = await initLlama({
        model: modelPath,
        use_mlock: true,
        n_ctx: 2048,
        n_gpu_layers: 1,
    });

    const results: ParsedTransaction[] = [];

    try {
        // Split rows into batches so the model never gets truncated
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const serialized = serializeRowsForLLM(batch);

            console.log(`LLM enrichment: batch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(rows.length / batchSize)}`);

            const prompt =
                `You are a transaction classifier. Each input line is:
INDEX | YYYY-MM-DD | RAW_DESCRIPTION | DEBIT/CREDIT | AMOUNT

Rules:
- Output a JSON array with one object per input line, in the same order
- Each object must have exactly: "index"(number), "merchant"(short clean name)
- Do NOT output date, amount, description, or type — those come from the input
- Return ONLY the JSON array, no markdown, no explanation

Input:
${serialized}

JSON:`;

            const response = await context.completion({
                prompt,
                // Each object is ~30 tokens: {"index":0,"merchant":"Dollarama"}
                // batchSize * 35 tokens + 20 buffer
                n_predict: batchSize * 35 + 20,
                temperature: 0.1,
                stop: ['</s>', '<|end|>', '<|eot_id|>'],
            });

            const raw = response.text.trim();
            console.log(`Batch ${Math.floor(i / batchSize) + 1} LLM response:`, raw);

            // Parse and merge LLM merchant names back onto the original rows
            const enriched = parseLLMBatchResponse(raw, batch, i);
            results.push(...enriched);
        }
    } finally {
        // Always release — even if a batch throws
        await context.release();
    }

    return results;
}

/**
 * Parse the LLM batch response and merge merchant names back onto raw rows.
 * Falls back to cleanMerchantFallback() for any row the LLM missed or garbled.
 */
function parseLLMBatchResponse(
    raw: string,
    batch: RawTransactionRow[],
    batchOffset: number
): ParsedTransaction[] {

    // Build a merchant map from LLM output: { localIndex → merchantName }
    const merchantMap = new Map<number, string>();

    try {
        const start = raw.indexOf('[');
        const end = raw.lastIndexOf(']');

        if (start !== -1 && end > start) {
            let jsonStr = raw.substring(start, end + 1);

            // Recover truncated JSON — remove last incomplete object
            if (!jsonStr.endsWith(']')) {
                const lastBrace = jsonStr.lastIndexOf('}');
                jsonStr = lastBrace !== -1
                    ? jsonStr.substring(0, lastBrace + 1) + ']'
                    : '[]';
            }

            const list = JSON.parse(jsonStr);

            if (Array.isArray(list)) {
                for (const item of list) {
                    // LLM returns index relative to the full rows array
                    const globalIdx: number = typeof item.index === 'number'
                        ? item.index
                        : batchOffset + list.indexOf(item);
                    const localIdx = globalIdx - batchOffset;

                    if (
                        localIdx >= 0 &&
                        localIdx < batch.length &&
                        typeof item.merchant === 'string' &&
                        item.merchant.trim().length > 0
                    ) {
                        merchantMap.set(localIdx, item.merchant.trim());
                    }
                }
            }
        }
    } catch (e) {
        console.warn('Could not parse LLM batch response, using fallback for batch:', e);
    }

    // Merge: use LLM merchant if available, else regex fallback
    return batch.map((row, localIdx) => {
        const merchant = merchantMap.get(localIdx) ?? cleanMerchantFallback(row.description);

        return {
            date: row.date,
            merchant,
            description: row.description,   // always from regex — reliable
            amount: row.amount,         // always from regex — reliable
            type: row.isCredit ? 'income' : 'expense',
            importHash: simpleHash(`${row.date}_${row.amount}_${row.description}`),
            categoryId: null,
        };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 10 — LLM FORMAT DISCOVERY (unknown banks)
// ─────────────────────────────────────────────────────────────────────────────

interface DiscoveredFormat {
    bankName: string;
    dateFormat: 'MMM DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    hasRefNumber: boolean;
    hasPostDate: boolean;
    hasTypeColumn: boolean;
    amountSign: 'negative_expense' | 'positive_expense';
    amountHasDollarSign: boolean;
    transactionBlockStart: string;
    transactionBlockEnd: string;
}

async function discoverBankFormat(
    rawText: string,
    modelTier: 'lite' | 'standard' | 'pro'
): Promise<DiscoveredFormat | null> {
    const modelFileName =
        modelTier === 'pro' ? 'phi-4.gguf' :
            modelTier === 'standard' ? 'qwen-0.5b.gguf' :
                'smollm-135m.gguf';

    const modelPath = `${FileSystem.documentDirectory}models/${modelFileName}`;

    // Send only first 800 chars — enough to see header + a few sample rows
    const sample = rawText.substring(0, 800);

    const prompt =
        `Analyze this bank statement and identify its structure.
Return ONLY a JSON object with these exact keys:
- "bankName": the bank name (string)
- "dateFormat": one of "MMM DD", "DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"
- "hasRefNumber": true if lines start with a ref number like 001, 002
- "hasPostDate": true if each line has two dates (transaction + post)
- "hasTypeColumn": true if there is a "Purchase" / "Debit" / "Credit" column
- "amountSign": "negative_expense" if charges are negative, "positive_expense" if charges are positive
- "amountHasDollarSign": true if amounts have $ prefix
- "transactionBlockStart": exact phrase that marks start of transactions
- "transactionBlockEnd": exact phrase that marks end of transactions

Sample:
${sample}

JSON:`;

    const context = await initLlama({
        model: modelPath,
        use_mlock: true,
        n_ctx: 1024,
        n_gpu_layers: 1,
    });

    const response = await context.completion({
        prompt,
        n_predict: 400,
        temperature: 0.1,
        stop: ['</s>', '<|end|>', '<|eot_id|>'],
    });

    await context.release();

    try {
        const raw = response.text.trim();
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start === -1 || end === -1) return null;
        return JSON.parse(raw.substring(start, end + 1)) as DiscoveredFormat;
    } catch (e) {
        console.error('Failed to parse LLM format discovery response:', e);
        return null;
    }
}

function buildConfigFromDiscovery(discovered: DiscoveredFormat): BankConfig {
    const monthNames = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec';
    const MMM = `(?:${monthNames})\\s+\\d{1,2}`;

    let datePattern: string;
    switch (discovered.dateFormat) {
        case 'MMM DD': datePattern = MMM; break;
        case 'DD/MM/YYYY': datePattern = '\\d{1,2}/\\d{1,2}/\\d{4}'; break;
        case 'MM/DD/YYYY': datePattern = '\\d{1,2}/\\d{1,2}/\\d{4}'; break;
        case 'YYYY-MM-DD': datePattern = '\\d{4}-\\d{2}-\\d{2}'; break;
        default: datePattern = `${MMM}|\\d{1,2}/\\d{1,2}/\\d{4}`;
    }

    let pattern = '^';
    if (discovered.hasRefNumber) pattern += `(?:\\d{3}\\s+)?`;
    pattern += `(${datePattern})\\s+`;
    if (discovered.hasPostDate) pattern += `(?:${datePattern})\\s+`;
    if (discovered.hasTypeColumn) pattern += `(?:Purchase|Debit|Credit|Payment)\\s+`;
    pattern += `(.+?)\\s+`;

    const dollar = discovered.amountHasDollarSign ? '\\$?' : '';
    pattern += `(${dollar}-?[\\d,]+\\.\\d{2}-?)\\s*$`;

    return {
        id: discovered.bankName.toLowerCase().replace(/\s+/g, '_'),
        name: discovered.bankName,
        detect: (raw) => new RegExp(discovered.bankName, 'i').test(raw),

        transactionBlock: {
            start: new RegExp(discovered.transactionBlockStart, 'i'),
            end: new RegExp(discovered.transactionBlockEnd, 'i'),
        },

        linePattern: {
            regex: new RegExp(pattern, 'i'),
            groups: { transDate: 1, description: 2, amount: 3 },
        },

        amount: {
            creditWhen: discovered.amountSign === 'negative_expense' ? 'negative' : 'trailing_minus',
            stripChars: /[$,\s]/g,
        },

        date: {
            format: discovered.dateFormat,
            yearSource: 'statement_header',
        },
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 11 — GENERIC FALLBACK (unknown bank, no LLM)
// ─────────────────────────────────────────────────────────────────────────────

function extractRowsGenericFallback(rawText: string, statementYear: number): RawTransactionRow[] {
    const rows: RawTransactionRow[] = [];
    const lines = rawText.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);

    const MONTH_PATTERN = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec';

    const looseRegex = new RegExp(
        `((?:${MONTH_PATTERN})\\s+\\d{1,2}|\\d{1,2}[/\\-.]\\d{1,2}[/\\-.]\\d{2,4})` +
        `.+?` +
        `(-?\\$?[\\d,]+\\.\\d{2}-?)\\s*$`,
        'i'
    );

    const skipPatterns = /payment due|minimum payment|credit limit|available credit|account summary|new balance|previous balance|sub-total|interest rate|page \d+/i;

    for (const line of lines) {
        if (skipPatterns.test(line)) continue;

        const match = line.match(looseRegex);
        if (!match) continue;

        const [, dateStr, amountStr] = match;
        const cleanAmount = amountStr.replace(/[$,\s]/g, '');
        const amount = parseFloat(cleanAmount);
        if (isNaN(amount) || amount === 0) continue;

        const dateEnd = line.indexOf(dateStr) + dateStr.length;
        const amountStart = line.lastIndexOf(amountStr);
        const description = line.substring(dateEnd, amountStart).trim();
        if (!description || description.length < 2) continue;

        const isCredit =
            amount < 0 ||
            amountStr.trim().endsWith('-') ||
            /payment|credit|refund|deposit/i.test(description);

        rows.push({
            date: parseToISODate(dateStr, 'MMM DD', statementYear),
            description,
            amount: Math.abs(amount),
            isCredit,
        });
    }

    return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(16);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

export async function parseBankStatement(
    fileUri: string,
    modelTier: 'lite' | 'standard' | 'pro' | null,
    isModelReady: boolean
): Promise<ParsedTransaction[]> {
    try {
        // ── 1. Load any previously discovered bank configs from cache
        await loadDynamicBanks();

        // ── 2. Extract raw text from PDF
        console.log('Extracting text from PDF:', fileUri);
        const rawText = await extractText(fileUri);
        if (!rawText) {
            console.warn('PDF extraction returned no text.');
            return [];
        }

        // ── 3. Extract statement year from header
        const statementYear = extractStatementYear(rawText);
        console.log('Detected statement year:', statementYear);

        // ── 4. Detect bank
        let config = detectBank(rawText);
        console.log('Detected bank:', config?.name ?? 'Unknown');

        let rawRows: RawTransactionRow[] = [];

        if (config) {
            // ── 5a. Known bank — extract transaction block + parse rows
            const block = extractTransactionBlock(rawText, config);
            rawRows = extractRawRows(block, config, statementYear);

        } else if (isModelReady && modelTier) {
            // ── 5b. Unknown bank — use LLM to discover format, then build config
            console.log('Unknown bank. Using LLM to discover format...');
            const discovered = await discoverBankFormat(rawText, modelTier);

            if (discovered) {
                config = buildConfigFromDiscovery(discovered);
                BANK_REGISTRY.push(config);          // register for this session
                // await saveDynamicBank(config);       // persist for future sessions

                const block = extractTransactionBlock(rawText, config);
                rawRows = extractRawRows(block, config, statementYear);
            } else {
                console.warn('LLM format discovery failed. Using generic fallback.');
                rawRows = extractRowsGenericFallback(rawText, statementYear);
            }

        } else {
            // ── 5c. Unknown bank, no LLM — best-effort generic regex
            console.warn('Unknown bank and no LLM available. Using generic fallback.');
            rawRows = extractRowsGenericFallback(rawText, statementYear);
        }

        if (rawRows.length === 0) {
            console.warn('No transactions extracted.');
            return [];
        }

        console.log(`Extracted ${rawRows.length} raw rows.`);

        // ── 6. Enrich with LLM or map directly
        let transactions: ParsedTransaction[];

        if (isModelReady && modelTier) {
            try {
                transactions = await enrichWithLLM(rawRows, modelTier);
            } catch (e) {
                console.error('LLM enrichment failed, falling back to direct mapping:', e);
                transactions = mapRowsDirectly(rawRows);
            }
        } else {
            transactions = mapRowsDirectly(rawRows);
        }

        // ── 7. Auto-categorize
        console.log(`Auto-categorizing ${transactions.length} transactions...`);
        for (const tx of transactions) {
            tx.categoryId = await autoCategorize(tx.description, tx.merchant, tx.type);
        }

        return transactions;

    } catch (e) {
        console.error('Error parsing bank statement:', e);
        return [];
    }
}

// Direct row → ParsedTransaction without LLM enrichment
function mapRowsDirectly(rows: RawTransactionRow[]): ParsedTransaction[] {
    return rows.map(row => ({
        date: row.date,
        merchant: cleanMerchantFallback(row.description),
        description: row.description,
        amount: row.amount,
        type: row.isCredit ? 'income' : 'expense',
        importHash: simpleHash(`${row.date}_${row.amount}_${row.description}`),
        categoryId: null,
    }));
}