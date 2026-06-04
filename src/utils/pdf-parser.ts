import * as FileSystem from 'expo-file-system/legacy';
import { extractText } from 'expo-pdf-text-extract';
import { initLlama, loadLlamaModelInfo } from 'llama.rn';
import { autoCategorize } from './categorizer';

import { getModelFileName } from './modelDownloader';
import { BANK_REGISTRY, BankConfig } from './bankParser';

export interface ParsedTransaction {
  date: string;
  merchant: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  categoryId?: string | null;
  importHash: string;
}

interface RawTransactionRow {
  date: string;        // raw date string as found
  description: string; // raw merchant/description text
  amount: number;      // absolute value
  isCredit: boolean;   // sign determined here
}

/**
 * Extracts and parses transaction records from a PDF bank statement file.
 * Automatically tries LLM parsing if available/ready, otherwise falls back to Regex.
 */
export async function parseBankStatementV0(
  fileUri: string,
  modelTier: 'lite' | 'standard' | 'pro' | 'ultra' | null,
  isModelReady: boolean
): Promise<ParsedTransaction[]> {
  try {
    // 1. Extract text from PDF
    console.log('Extracting text from PDF:', fileUri);
    const rawText = await extractText(fileUri);

    if (!rawText) {
      console.warn('PDF extraction returned no text.');
      return [];
    }

    let transactions: ParsedTransaction[] = [];

    // 2. Parse transactions using LLM or Regex
    if (isModelReady && modelTier) {
      const modelFileName = getModelFileName(modelTier);
      const modelPath = `${FileSystem.documentDirectory}models/${modelFileName}`;

      try {
        console.log('Attempting offline LLM statement parsing with:', modelPath);
        console.log('Model Info:', await loadLlamaModelInfo(modelPath))
        transactions = await parseWithLLM(rawText, modelPath);
      } catch (e) {
        console.error('LLM parsing failed, falling back to Regex:', e);
        transactions = parseWithRegex(rawText);
      }
    } else {
      console.log('LLM model not downloaded/ready. Using Regex statement parsing fallback.');
      transactions = parseWithRegex(rawText);
    }

    // 3. Auto-categorize each parsed transaction
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

/*
export async function parseBankStatement(
  fileUri: string,
  modelTier: 'lite' | 'standard' | 'pro' | 'ultra' | null,
  isModelReady: boolean
): Promise<ParsedTransaction[]> {
  try {
    // 1. Extract text from PDF
    console.log('Extracting text from PDF:', fileUri);
    const rawText = await extractText(fileUri);

    if (!rawText) {
      console.warn('PDF extraction returned no text.');
      return [];
    }

    // 2. Detect Bank
    const bankFormat = detectBankFormat(rawText);

    // 3. Isolate transaction section
    // const block = extractTransactionBlock(rawText, bankFormat);


    let transactions: ParsedTransaction[] = [];

    // 2. Parse transactions using LLM or Regex
    if (isModelReady && modelTier) {
      const modelFileName = getModelFileName(modelTier);
      const modelPath = `${FileSystem.documentDirectory}models/${modelFileName}`;

      try {
        console.log('Attempting offline LLM statement parsing with:', modelPath);
        console.log('Model Info:', await loadLlamaModelInfo(modelPath))
        transactions = await parseWithLLM(rawText, modelPath);
      } catch (e) {
        console.error('LLM parsing failed, falling back to Regex:', e);
        transactions = parseWithRegex(rawText);
      }
    } else {
      console.log('LLM model not downloaded/ready. Using Regex statement parsing fallback.');
      transactions = parseWithRegex(rawText);
    }

    // 3. Auto-categorize each parsed transaction
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
*/

/**
 * Parses statement text using local llama.rn LLM inference.
 */
async function parseWithLLM(text: string, modelPath: string): Promise<ParsedTransaction[]> {
  // Truncate input text if it's too long for mobile context limits
  const truncatedText = text

  const context = await initLlama({
    model: modelPath,
    use_mlock: true,
    n_ctx: 2048,
    n_gpu_layers: 1, // Hardware acceleration
  });

  const prompt = `You are a strict bank statement parser. Extract only merchant purchase transactions from the bank statement below.

RULES:
- Include ONLY purchases/charges made at merchants or services
- EXCLUDE: payments to the bank, credits, refunds, interest charges, fees, balance transfers, minimum payments
- EXCLUDE: any line with "PAYMENT", "CREDIT", "REFUND", "INTEREST", "FEE", "TRANSFER" in the description
- Return ONLY a valid JSON array, no markdown, no explanation
- If no valid transactions found, return []

Each object must have exactly these keys:
- "date" (YYYY-MM-DD)
- "merchant" (short merchant name)
- "amount" (positive number)
- "type" ("expense" or "income")
- "description" (original text from statement)

Statement:
${truncatedText}

[`;

  const stopWords = ['</s>', '<|end|>', '<|eot_id|>'];
  const response = await context.completion({
    prompt,
    n_predict: -1,
    temperature: 0.1,
    stop: stopWords,
  });

  // Release memory context
  await context.release();

  const responseText = response.text.trim();
  console.log('LLM raw parser response:', response.text);

  // Extract JSON from response (handling potential markdown wrapper)
  let cleanJson = responseText;
  const jsonStart = responseText.indexOf('[');
  const jsonEnd = responseText.lastIndexOf(']');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleanJson = responseText.substring(jsonStart, jsonEnd + 1);
  }

  const list = JSON.parse(cleanJson);
  if (!Array.isArray(list)) {
    throw new Error('LLM response did not parse as a JSON array');
  }

  return list.map((item: any) => {
    const date = item.date || new Date().toISOString().split('T')[0];
    const merchant = item.merchant || 'Unknown Merchant';
    const description = item.description || merchant;
    const amount = Math.abs(parseFloat(item.amount) || 0);
    const type = item.type === 'income' ? 'income' : 'expense';
    const importHash = simpleHash(`${date}_${amount}_${description}`);

    return {
      date,
      merchant,
      description,
      amount,
      type,
      importHash,
    };
  });
}

/**
 * Strategy B: Robust Regex parser for text statement patterns.
 */
function parseWithRegex(text: string): ParsedTransaction[] {
  const lines = text.split(/[\r\n]+/);
  const transactions: ParsedTransaction[] = [];

  // Match dates in forms: 10/12/2023, 10-12-2023, 10.12.23, Oct 12, 12 Oct
  const dateRegex = /\b(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})|([a-zA-Z]{3}\s+\d{1,2})|(\d{1,2}\s+[a-zA-Z]{3})\b/;
  // Match standard amounts: $1,234.56, -12.30, 45.00
  const amountRegex = /[-+]?\s*\(?\s*\$?\s*\d{1,3}(?:,\d{3})*\.\d{2}\s*\)?/g;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const dateMatch = trimmedLine.match(dateRegex);
    if (!dateMatch) continue;

    const dateStr = dateMatch[0];

    const amountMatches = trimmedLine.match(amountRegex);
    if (!amountMatches || amountMatches.length === 0) continue;

    // Use the last amount matched, which represents debit/credit (avoiding running balances)
    const lastAmountStr = amountMatches[amountMatches.length - 1];

    // Clean amount value
    const cleanAmountStr = lastAmountStr.replace(/[$\s,()]/g, '');
    let amount = parseFloat(cleanAmountStr);
    if (isNaN(amount)) continue;

    const upperLine = trimmedLine.toUpperCase();
    const isCredit = upperLine.includes('CREDIT') ||
      upperLine.includes('DEPOSIT') ||
      upperLine.includes('REFUND') ||
      upperLine.includes('INTEREST PAID') ||
      upperLine.includes('PAYROLL') ||
      upperLine.includes('DIRECT DEPOSIT') ||
      lastAmountStr.includes('+');

    let type: 'income' | 'expense' = 'expense';
    if (isCredit || amount < 0) {
      type = 'income';
      amount = Math.abs(amount);
    } else {
      type = 'expense';
    }

    // Description is the text in between the date and the amount
    const dateIdx = trimmedLine.indexOf(dateStr);
    const amtIdx = trimmedLine.indexOf(lastAmountStr);

    let description = '';
    if (dateIdx !== -1 && amtIdx !== -1 && amtIdx > dateIdx) {
      description = trimmedLine.substring(dateIdx + dateStr.length, amtIdx).trim();
    } else {
      description = trimmedLine.replace(dateStr, '').replace(lastAmountStr, '').trim();
    }

    // Clean description noise
    description = description
      .replace(/[\*\#\-\_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!description || description.length < 2) {
      description = 'Unknown Transaction';
    }

    // Normalize merchant name
    let merchant = description;
    merchant = merchant
      .replace(/\b(?:POS|DEBIT|PURCHASE|CARD|\d{4,})\b/gi, '')
      .replace(/\b[A-Z]{2}\s+\d{5}\b/g, '') // Remove State + Zip
      .replace(/\s+/g, ' ')
      .trim();

    if (!merchant) {
      merchant = description;
    }

    const isoDate = parseToISODate(dateStr);
    const importHash = simpleHash(`${isoDate}_${amount}_${description}`);

    transactions.push({
      date: isoDate,
      merchant,
      description,
      amount,
      type,
      importHash,
    });
  }

  return transactions;
}

// Simple hash in pure JS
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

// Parse dates into YYYY-MM-DD
function parseToISODate(dateStr: string): string {
  const now = new Date();
  const currentYear = now.getFullYear();

  const m1 = dateStr.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (m1) {
    let [_, month, day, year] = m1;
    if (year.length === 2) {
      year = '20' + year;
    }
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const months: { [key: string]: string } = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  const m2 = dateStr.match(/^([a-zA-Z]{3})\s+(\d{1,2})$/);
  if (m2) {
    const [_, monthName, day] = m2;
    const month = months[monthName.toLowerCase()];
    if (month) {
      return `${currentYear}-${month}-${day.padStart(2, '0')}`;
    }
  }

  const m3 = dateStr.match(/^(\d{1,2})\s+([a-zA-Z]{3})$/);
  if (m3) {
    const [_, day, monthName] = m3;
    const month = months[monthName.toLowerCase()];
    if (month) {
      return `${currentYear}-${month}-${day.padStart(2, '0')}`;
    }
  }

  return now.toISOString().split('T')[0];
}


type BankFormat = 'scotiabank-cc' | 'neo-cc' | 'wealthsimple-cc' | 'unknown';
function detectBankFormat(raw: string): BankFormat {
  if (/scotiabank/i.test(raw)) return 'scotiabank-cc';
  if (/neo financial/i.test(raw)) return 'neo-cc';
  if (/wealthsimple/i.test(raw)) return 'wealthsimple-cc';
  return 'unknown';
}

function extractRawRows(block: string, format: BankFormat): RawTransactionRow[] {
  const rows: RawTransactionRow[] = [];
  // Split by newline and filter empty lines
  const lines = block.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
  const bankConfig = BANK_REGISTRY.find(bank => bank.id === format);

  if (!bankConfig) {
    return []
  }

  const statementYear = extractStatementYear(block);


  for (const line of lines) {
    const row = parseLineByFormat(line, bankConfig, statementYear);
    if (row) rows.push(row);
  }

  return rows;
}

export function parseLineByFormat(
  line: string,
  config: BankConfig,
  statementYear: number
): RawTransactionRow | null {

  // Skip explicitly excluded lines
  if (config.skipLine?.test(line)) return null;

  const match = line.match(config.linePattern.regex);
  if (!match) return null;

  const { transDate, description, amount: amountGroup } = config.linePattern.groups;

  const rawDate = match[transDate]?.trim();
  const rawDesc = match[description]?.trim();
  const rawAmount = match[amountGroup]?.trim();

  if (!rawDate || !rawDesc || !rawAmount) return null;

  // Parse amount
  const cleanAmount = rawAmount.replace(config.amount.stripChars, '');
  const amount = parseFloat(cleanAmount);
  if (isNaN(amount)) return null;

  // Determine credit/income
  const isCredit = resolveCredit(
    amount,
    rawAmount,
    rawDesc,
    config.amount
  );

  // Normalize date
  const date = parseToISODate(rawDate);

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
      return amount > 0; // Neo convention: positive = income
    case 'trailing_minus':
      return rawAmount.trim().endsWith('-');
    case 'keyword':
      return amountConfig.creditKeywords?.test(description) ?? false;
    case 'never':
      return false;
    default:
      return false;
  }
}

function extractStatementYear(rawText: string): number {
  const currentYear = new Date().getFullYear();

  // Patterns ordered by reliability — most explicit first
  const patterns = [
    // "Statement Period Apr 6, 2026 - May 5, 2026"
    // "May 2 — May 24, 2026"
    // "Apr 25, 2026 - May 22, 2026"
    /statement\s+period.+?(\d{4})/i,

    // "Statement Date May 5, 2026"
    /statement\s+date.+?(\d{4})/i,

    // "Payment Due Date Jun 15, 2026"
    /(?:payment\s+)?due\s+date.+?(\d{4})/i,

    // Any month + 4-digit year: "May 2026", "Apr 2026"
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,

    // Last resort: any standalone 4-digit year in plausible range
    /\b(20\d{2})\b/,
  ];

  for (const pattern of patterns) {
    const match = rawText.match(pattern);
    if (match) {
      const year = parseInt(match[1]);
      // Sanity check: reject implausible years
      if (year >= 2000 && year <= currentYear + 1) {
        return year;
      }
    }
  }

  // Safe fallback
  console.warn('Could not extract statement year, defaulting to current year.');
  return currentYear;
}
