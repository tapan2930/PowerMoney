
export interface BankConfig {
    // Identity
    id: string;
    name: string;

    // Detection: how to recognize this bank's statement
    detect: (rawText: string) => boolean;

    // Transaction block: where transactions start/end
    transactionBlock: {
        start: RegExp;   // line that signals start of transactions
        end: RegExp;     // line that signals end
    };

    // Line structure
    linePattern: {
        regex: RegExp;
        groups: {
            transDate: number;   // capture group index for transaction date
            description: number; // capture group index for description
            amount: number;      // capture group index for amount
        };
    };

    // Amount interpretation
    amount: {
        // How to tell if a transaction is a credit/income
        creditWhen: 'negative' | 'trailing_minus' | 'never' | 'keyword';
        creditKeywords?: RegExp;  // used when creditWhen = 'keyword'
        stripChars: RegExp;       // chars to remove before parseFloat
    };

    // Date interpretation
    date: {
        format: 'MMM DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
        yearSource: 'statement_header' | 'current_year';
    };

    // Lines to skip even if they match linePattern
    skipLine?: RegExp;
}

export const BANK_REGISTRY: BankConfig[] = [

    // ─── Scotiabank ───────────────────────────────────────────
    {
        id: 'scotiabank',
        name: 'Scotiabank',
        detect: (raw) => /scotiabank/i.test(raw),

        transactionBlock: {
            start: /transactions since your last statement/i,
            end: /sub-total|interest charges posted/i,
        },

        linePattern: {
            // "001 Apr 4 Apr 6 V-DESI SUPERSTORE WINDSOR ON 9.23"
            regex: /^(?:\d{3}\s+)?((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2})\s+(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2})\s+(.+?)\s+(\d[\d,]*\.\d{2}-?)$/i,
            groups: { transDate: 1, description: 2, amount: 3 },
        },

        amount: {
            creditWhen: 'trailing_minus',
            stripChars: /[$,\s]/g,
        },

        date: {
            format: 'MMM DD',
            yearSource: 'statement_header',
        },
    },

    // ─── Neo Financial ────────────────────────────────────────
    {
        id: 'neo',
        name: 'Neo Financial',
        detect: (raw) => /neo financial/i.test(raw),

        transactionBlock: {
            start: /^transactions$/im,
            end: /important information|page \d+ of \d+/i,
        },

        linePattern: {
            // "May 11 May 12 AVIVA GENERAL INSURANC MARKHAM CAN -334.08"
            regex: /^((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2})\s+(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2})\s+(.+?)\s+(-?\d[\d,]*\.\d{2})$/i,
            groups: { transDate: 1, description: 2, amount: 3 },
        },

        amount: {
            creditWhen: 'negative',  // Neo uses negative for expenses
            stripChars: /[$,\s]/g,
        },

        date: {
            format: 'MMM DD',
            yearSource: 'statement_header',
        },

        skipLine: /reward cashed out|payment received/i,
    },

    // ─── Wealthsimple ─────────────────────────────────────────
    {
        id: 'wealthsimple',
        name: 'Wealthsimple',
        detect: (raw) => /wealthsimple/i.test(raw),

        transactionBlock: {
            start: /^activity$/im,
            end: /information about your wealthsimple/i,
        },

        linePattern: {
            // "May 2 May 3 Purchase CAMPBELL VARIETY $6.98"
            regex: /^((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2})\s+(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2})\s+(?:Purchase|Debit|Credit|Payment|Refund)\s+(.+?)\s+\$(\d[\d,]*\.\d{2})$/i,
            groups: { transDate: 1, description: 2, amount: 3 },
        },

        amount: {
            creditWhen: 'keyword',
            creditKeywords: /^(refund|payment|credit)/i,
            stripChars: /[$,\s]/g,
        },

        date: {
            format: 'MMM DD',
            yearSource: 'statement_header',
        },
    },

    // ─── TD Bank ──────────────────────────────────────────────
    {
        id: 'td',
        name: 'TD Bank',
        detect: (raw) => /td\s+bank|toronto.dominion/i.test(raw),

        transactionBlock: {
            start: /account activity|transactions/i,
            end: /total debit|total credit|end of statement/i,
        },

        linePattern: {
            // "Jan 15, 2026  TIM HORTONS #1234  4.75"
            regex: /^(\w{3}\s+\d{1,2},?\s+\d{4})\s+(.+?)\s+(\d[\d,]*\.\d{2})\s*(CR)?$/i,
            groups: { transDate: 1, description: 2, amount: 3 },
        },

        amount: {
            creditWhen: 'keyword',
            creditKeywords: /CR$/i,
            stripChars: /[$,\s]/g,
        },

        date: {
            format: 'MMM DD',
            yearSource: 'current_year',
        },
    },

    // ─── RBC ──────────────────────────────────────────────────
    {
        id: 'rbc',
        name: 'RBC Royal Bank',
        detect: (raw) => /rbc|royal bank of canada/i.test(raw),

        transactionBlock: {
            start: /transactions|account activity/i,
            end: /total for period|end of transactions/i,
        },

        linePattern: {
            // "04/15/2026  IGA GROCERY  -23.45"
            regex: /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-?\$?\d[\d,]*\.\d{2})$/i,
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

];