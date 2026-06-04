import { count } from 'drizzle-orm';
import { db } from './index';
import { categories, categorizationRules } from './schema';

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

export interface SeedCategory {
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  isSystem: boolean;
}

export const defaultCategories: SeedCategory[] = [
  // ── Expenses ───────────────────────────────────────────────────────────────
  { name: 'Food & Dining', icon: 'restaurant', color: '#FF7675', type: 'expense', isSystem: true },
  { name: 'Groceries', icon: 'cart', color: '#FDCB6E', type: 'expense', isSystem: true },
  { name: 'Transportation', icon: 'car', color: '#74B9FF', type: 'expense', isSystem: true },
  { name: 'Fuel', icon: 'flame', color: '#E17055', type: 'expense', isSystem: true },
  { name: 'Housing', icon: 'home', color: '#A29BFE', type: 'expense', isSystem: true },
  { name: 'Utilities', icon: 'flash', color: '#FFEAA7', type: 'expense', isSystem: true },
  { name: 'Entertainment', icon: 'film', color: '#FF85A2', type: 'expense', isSystem: true },
  { name: 'Shopping', icon: 'shirt', color: '#FDA7DF', type: 'expense', isSystem: true },
  { name: 'Healthcare', icon: 'medkit', color: '#55EFC4', type: 'expense', isSystem: true },
  { name: 'Insurance', icon: 'shield', color: '#00CEC9', type: 'expense', isSystem: true },
  { name: 'Education', icon: 'book', color: '#81ECEC', type: 'expense', isSystem: true },
  { name: 'Travel', icon: 'airplane', color: '#74B9FF', type: 'expense', isSystem: true },
  { name: 'Personal Care', icon: 'person', color: '#FDA7DF', type: 'expense', isSystem: true },
  { name: 'Gifts', icon: 'gift', color: '#FF7675', type: 'expense', isSystem: true },
  { name: 'Subscriptions', icon: 'card', color: '#6C5CE7', type: 'expense', isSystem: true },
  { name: 'Pets', icon: 'paw', color: '#E056FD', type: 'expense', isSystem: true },
  { name: 'Fitness', icon: 'barbell', color: '#00B894', type: 'expense', isSystem: true },
  { name: 'Other', icon: 'help-circle', color: '#B2BEC3', type: 'expense', isSystem: true },

  // ── Income ─────────────────────────────────────────────────────────────────
  { name: 'Salary', icon: 'cash', color: '#55EFC4', type: 'income', isSystem: true },
  { name: 'Freelance', icon: 'briefcase', color: '#81ECEC', type: 'income', isSystem: true },
  { name: 'Investments', icon: 'trending-up', color: '#00B894', type: 'income', isSystem: true },
  { name: 'Gifts Received', icon: 'gift', color: '#FDA7DF', type: 'income', isSystem: true },
  { name: 'Refunds', icon: 'receipt', color: '#FFEAA7', type: 'income', isSystem: true },
  { name: 'Transfer', icon: 'swap-horizontal', color: '#74B9FF', type: 'income', isSystem: true },
  { name: 'Other Income', icon: 'help-circle', color: '#B2BEC3', type: 'income', isSystem: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIZATION RULES
//
// Each entry maps a KEYWORD (matched via .includes() in autoCategorize)
// to a category name and a priority.
//
// Priority guidelines:
//   100 = income/transfer signals   (must not be misclassified)
//    90 = very specific merchants   (e.g. "ESSO CIRCLE K")
//    80 = specific brand keywords   (e.g. "UBER EATS")
//    70 = broader category keywords (e.g. "GROCERY")
//    60 = generic fallback keywords (e.g. "MARKET")
//
// Rules are checked in descending priority order by autoCategorize().
// Higher priority wins when multiple rules match the same description.
// ─────────────────────────────────────────────────────────────────────────────

interface SeedRule {
  keyword: string;
  categoryName: string;
  priority: number;
}

export const defaultRules: SeedRule[] = [

  // ── Income & Transfers (priority 100 — check these first) ─────────────────
  { keyword: 'PAYMENT RECEIVED', categoryName: 'Transfer', priority: 100 },
  { keyword: 'PAYMENT - THANK YOU', categoryName: 'Transfer', priority: 100 },
  { keyword: 'E-TRANSFER', categoryName: 'Transfer', priority: 100 },
  { keyword: 'ETRANSFER', categoryName: 'Transfer', priority: 100 },
  { keyword: 'INTERAC', categoryName: 'Transfer', priority: 100 },
  { keyword: 'DIRECT DEPOSIT', categoryName: 'Salary', priority: 100 },
  { keyword: 'PAYROLL', categoryName: 'Salary', priority: 100 },
  { keyword: 'SALARY', categoryName: 'Salary', priority: 100 },
  { keyword: 'DIVIDEND', categoryName: 'Investments', priority: 100 },
  { keyword: 'REWARD CASHED', categoryName: 'Refunds', priority: 100 },
  { keyword: 'SCENE+ TRAVEL', categoryName: 'Travel', priority: 100 },
  { keyword: 'CASHBACK', categoryName: 'Refunds', priority: 100 },

  // ── Fuel — specific chains (priority 90) ──────────────────────────────────
  { keyword: 'ESSO CIRCLE K', categoryName: 'Fuel', priority: 90 },
  { keyword: 'CIRCLE K', categoryName: 'Fuel', priority: 90 },
  { keyword: 'PETRO-CANADA', categoryName: 'Fuel', priority: 90 },
  { keyword: 'PETROCANADA', categoryName: 'Fuel', priority: 90 },
  { keyword: 'SHELL C0', categoryName: 'Fuel', priority: 90 },
  { keyword: 'HUSKY', categoryName: 'Fuel', priority: 90 },
  { keyword: 'SUNOCO', categoryName: 'Fuel', priority: 90 },
  { keyword: 'PIONEER ENERGY', categoryName: 'Fuel', priority: 90 },
  { keyword: 'ULTRAMAR', categoryName: 'Fuel', priority: 90 },
  { keyword: 'IRVING OIL', categoryName: 'Fuel', priority: 90 },

  // ── Groceries — specific chains (priority 90) ─────────────────────────────
  { keyword: 'V-DESI SUPERSTORE', categoryName: 'Groceries', priority: 90 },
  { keyword: 'VDESISUPERSTORE', categoryName: 'Groceries', priority: 90 },
  { keyword: 'SK GROCERS', categoryName: 'Groceries', priority: 90 },
  { keyword: 'FRESHCO', categoryName: 'Groceries', priority: 90 },
  { keyword: 'NO FRILLS', categoryName: 'Groceries', priority: 90 },
  { keyword: 'NOFRILLS', categoryName: 'Groceries', priority: 90 },
  { keyword: 'FOOD BASICS', categoryName: 'Groceries', priority: 90 },
  { keyword: 'REAL CDN SUPERSTORE', categoryName: 'Groceries', priority: 90 },
  { keyword: 'LOBLAWS', categoryName: 'Groceries', priority: 90 },
  { keyword: 'SOBEYS', categoryName: 'Groceries', priority: 90 },
  { keyword: 'METRO', categoryName: 'Groceries', priority: 90 },
  { keyword: 'ZEHRS', categoryName: 'Groceries', priority: 90 },
  { keyword: 'FARM BOY', categoryName: 'Groceries', priority: 90 },
  { keyword: 'FARM BOY', categoryName: 'Groceries', priority: 90 },
  { keyword: 'IGA', categoryName: 'Groceries', priority: 90 },
  { keyword: 'MAXI', categoryName: 'Groceries', priority: 90 },
  { keyword: 'SUPER C', categoryName: 'Groceries', priority: 90 },
  { keyword: 'PRICE CHOPPER', categoryName: 'Groceries', priority: 90 },
  { keyword: 'COSTCO', categoryName: 'Groceries', priority: 90 },
  { keyword: 'WALMART', categoryName: 'Groceries', priority: 80 },

  // ── Food & Dining — delivery apps (priority 90) ───────────────────────────
  { keyword: 'UBER EATS', categoryName: 'Food & Dining', priority: 90 },
  { keyword: 'UBEREATS', categoryName: 'Food & Dining', priority: 90 },
  { keyword: 'DOORDASH', categoryName: 'Food & Dining', priority: 90 },
  { keyword: 'SKIP THE DISHES', categoryName: 'Food & Dining', priority: 90 },
  { keyword: 'SKIPTHEDISHES', categoryName: 'Food & Dining', priority: 90 },
  { keyword: 'CHILLY BLISS', categoryName: 'Food & Dining', priority: 90 },
  { keyword: 'CHILLYBLISS', categoryName: 'Food & Dining', priority: 90 },
  { keyword: 'DOORDASHCHILLY', categoryName: 'Food & Dining', priority: 90 },

  // ── Food & Dining — chains (priority 85) ──────────────────────────────────
  { keyword: 'TIM HORTONS', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'STARBUCKS', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'MCDONALDS', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'MCDONALD', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'SUBWAY', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'KFC', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'PIZZA HUT', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'DOMINOS', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'HARVEYS', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'WENDYS', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'BURGER KING', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'POPEYES', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'DAIRY QUEEN', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'BOSTON PIZZA', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'MONTANAS', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'EAST SIDE MARIOS', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'A&W', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'ROYAL PAAN', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'SHELBY', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'BARCELONA BAR', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'GETEZZI', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'PUNJAABI', categoryName: 'Food & Dining', priority: 85 },
  { keyword: 'CAMPBELL VARIETY', categoryName: 'Food & Dining', priority: 85 },

  // ── Transportation — specific (priority 85) ───────────────────────────────
  { keyword: 'PRESTO FARE', categoryName: 'Transportation', priority: 85 },
  { keyword: 'ONROUTE', categoryName: 'Transportation', priority: 85 },
  { keyword: 'VIA RAIL', categoryName: 'Transportation', priority: 85 },
  { keyword: 'IMPARK', categoryName: 'Transportation', priority: 85 },
  { keyword: 'GREEN P', categoryName: 'Transportation', priority: 85 },
  { keyword: 'PARKWHIZ', categoryName: 'Transportation', priority: 85 },
  { keyword: 'LYFT', categoryName: 'Transportation', priority: 85 },

  // ── Transportation — Uber (priority 80, lower than Uber Eats rule) ────────
  { keyword: 'UBER', categoryName: 'Transportation', priority: 80 },

  // ── Shopping — specific (priority 85) ─────────────────────────────────────
  { keyword: 'AMZN MKTP', categoryName: 'Shopping', priority: 85 },
  { keyword: 'AMAZON.CA', categoryName: 'Shopping', priority: 85 },
  { keyword: 'DOLLARAMA', categoryName: 'Shopping', priority: 85 },
  { keyword: 'TEMU', categoryName: 'Shopping', priority: 85 },
  { keyword: 'OLD NAVY', categoryName: 'Shopping', priority: 85 },
  { keyword: 'FOREVER 21', categoryName: 'Shopping', priority: 85 },
  { keyword: 'FOREVER21', categoryName: 'Shopping', priority: 85 },
  { keyword: 'CLEARLY ECOMM', categoryName: 'Shopping', priority: 85 },
  { keyword: 'SNAPLII', categoryName: 'Shopping', priority: 85 },
  { keyword: 'EBAY', categoryName: 'Shopping', priority: 85 },
  { keyword: 'SHEIN', categoryName: 'Shopping', priority: 85 },
  { keyword: 'BEST BUY', categoryName: 'Shopping', priority: 85 },
  { keyword: 'CANADIAN TIRE', categoryName: 'Shopping', priority: 85 },
  { keyword: 'SPORT CHEK', categoryName: 'Shopping', priority: 85 },
  { keyword: 'WINNERS', categoryName: 'Shopping', priority: 85 },
  { keyword: 'HOMESENSE', categoryName: 'Shopping', priority: 85 },
  { keyword: 'MARSHALLS', categoryName: 'Shopping', priority: 85 },
  { keyword: 'IKEA', categoryName: 'Shopping', priority: 85 },
  { keyword: 'LULULEMON', categoryName: 'Shopping', priority: 85 },
  { keyword: 'ARITZIA', categoryName: 'Shopping', priority: 85 },
  { keyword: 'ROOTS', categoryName: 'Shopping', priority: 85 },
  { keyword: 'H&M', categoryName: 'Shopping', priority: 85 },
  { keyword: 'ZARA', categoryName: 'Shopping', priority: 85 },
  { keyword: 'UNIQLO', categoryName: 'Shopping', priority: 85 },
  { keyword: 'GAP', categoryName: 'Shopping', priority: 85 },
  { keyword: 'ADIDAS', categoryName: 'Shopping', priority: 85 },
  { keyword: 'PAYPAL', categoryName: 'Shopping', priority: 70 },  // lower: PayPal used for many things
  { keyword: 'AMAZON', categoryName: 'Shopping', priority: 70 },  // lower: catch-all after AMAZON.CA

  // ── Subscriptions — specific (priority 85) ────────────────────────────────
  { keyword: 'NETFLIX', categoryName: 'Subscriptions', priority: 85 },
  { keyword: 'SPOTIFY', categoryName: 'Subscriptions', priority: 85 },
  { keyword: 'APPLE.COM', categoryName: 'Subscriptions', priority: 85 },
  { keyword: 'GOOGLE PLAY', categoryName: 'Subscriptions', priority: 85 },
  { keyword: 'GOOGLE *CLOUD', categoryName: 'Subscriptions', priority: 85 },
  { keyword: 'GOOGLE *INVESTING', categoryName: 'Subscriptions', priority: 85 },
  { keyword: 'INVESTING.COM', categoryName: 'Subscriptions', priority: 85 },
  { keyword: 'ANTHROPIC', categoryName: 'Subscriptions', priority: 85 },
  { keyword: 'PRIME MEMBER', categoryName: 'Subscriptions', priority: 85 },
  { keyword: 'AMAZON.CA PRIME', categoryName: 'Subscriptions', priority: 90 },  // above generic AMAZON
  { keyword: 'YOUTUBE PREMIUM', categoryName: 'Subscriptions', priority: 85 },
  { keyword: 'MICROSOFT', categoryName: 'Subscriptions', priority: 85 },
  { keyword: 'ADOBE', categoryName: 'Subscriptions', priority: 85 },
  { keyword: 'DROPBOX', categoryName: 'Subscriptions', priority: 85 },
  { keyword: 'DISNEY PLUS', categoryName: 'Subscriptions', priority: 85 },
  { keyword: 'DISNEY+', categoryName: 'Subscriptions', priority: 85 },
  { keyword: 'CRAVE', categoryName: 'Subscriptions', priority: 85 },
  { keyword: 'CHATGPT', categoryName: 'Subscriptions', priority: 85 },
  { keyword: 'GITHUB', categoryName: 'Subscriptions', priority: 85 },
  { keyword: 'NOTION', categoryName: 'Subscriptions', priority: 85 },

  // ── Utilities — specific (priority 85) ────────────────────────────────────
  { keyword: 'FIDO MACC', categoryName: 'Utilities', priority: 85 },
  { keyword: 'FIDO', categoryName: 'Utilities', priority: 80 },
  { keyword: 'ROGERS', categoryName: 'Utilities', priority: 85 },
  { keyword: 'BELL CANADA', categoryName: 'Utilities', priority: 85 },
  { keyword: 'TELUS', categoryName: 'Utilities', priority: 85 },
  { keyword: 'FREEDOM MOBILE', categoryName: 'Utilities', priority: 85 },
  { keyword: 'VIDEOTRON', categoryName: 'Utilities', priority: 85 },
  { keyword: 'COGECO', categoryName: 'Utilities', priority: 85 },
  { keyword: 'EASTLINK', categoryName: 'Utilities', priority: 85 },
  { keyword: 'ENBRIDGE', categoryName: 'Utilities', priority: 85 },
  { keyword: 'UNION GAS', categoryName: 'Utilities', priority: 85 },
  { keyword: 'HYDRO ONE', categoryName: 'Utilities', priority: 85 },
  { keyword: 'TORONTO HYDRO', categoryName: 'Utilities', priority: 85 },
  { keyword: 'HYDRO QUEBEC', categoryName: 'Utilities', priority: 85 },

  // ── Insurance (priority 85) ───────────────────────────────────────────────
  { keyword: 'AVIVA GENERAL', categoryName: 'Insurance', priority: 85 },
  { keyword: 'INTACT INSURANCE', categoryName: 'Insurance', priority: 85 },
  { keyword: 'COOPERATORS', categoryName: 'Insurance', priority: 85 },
  { keyword: 'BELAIR', categoryName: 'Insurance', priority: 85 },
  { keyword: 'TD INSURANCE', categoryName: 'Insurance', priority: 85 },
  { keyword: 'DESJARDINS', categoryName: 'Insurance', priority: 85 },
  { keyword: 'WAWANESA', categoryName: 'Insurance', priority: 85 },
  { keyword: 'ECONOMICAL', categoryName: 'Insurance', priority: 85 },

  // ── Healthcare (priority 85) ──────────────────────────────────────────────
  { keyword: 'BLUE CROSS', categoryName: 'Healthcare', priority: 85 },
  { keyword: 'SHOPPERS DRUG', categoryName: 'Healthcare', priority: 85 },
  { keyword: 'REXALL', categoryName: 'Healthcare', priority: 85 },
  { keyword: 'PHARMASAVE', categoryName: 'Healthcare', priority: 85 },
  { keyword: 'WELL.CA', categoryName: 'Healthcare', priority: 85 },
  { keyword: 'SUN LIFE', categoryName: 'Healthcare', priority: 85 },
  { keyword: 'MANULIFE', categoryName: 'Healthcare', priority: 85 },

  // ── Entertainment (priority 85) ───────────────────────────────────────────
  { keyword: 'CINEPLEX', categoryName: 'Entertainment', priority: 85 },
  { keyword: 'LANDMARK CINEMA', categoryName: 'Entertainment', priority: 85 },
  { keyword: 'STEAM', categoryName: 'Entertainment', priority: 85 },
  { keyword: 'PLAYSTATION', categoryName: 'Entertainment', priority: 85 },
  { keyword: 'XBOX', categoryName: 'Entertainment', priority: 85 },
  { keyword: 'NINTENDO', categoryName: 'Entertainment', priority: 85 },
  { keyword: 'TICKETMASTER', categoryName: 'Entertainment', priority: 85 },
  { keyword: 'STUBHUB', categoryName: 'Entertainment', priority: 85 },
  { keyword: 'EVENTBRITE', categoryName: 'Entertainment', priority: 85 },

  // ── Travel (priority 85) ──────────────────────────────────────────────────
  { keyword: 'AIR CANADA', categoryName: 'Travel', priority: 85 },
  { keyword: 'WESTJET', categoryName: 'Travel', priority: 85 },
  { keyword: 'EXPEDIA', categoryName: 'Travel', priority: 85 },
  { keyword: 'AIRBNB', categoryName: 'Travel', priority: 85 },
  { keyword: 'BOOKING.COM', categoryName: 'Travel', priority: 85 },
  { keyword: 'MARRIOTT', categoryName: 'Travel', priority: 85 },
  { keyword: 'HILTON', categoryName: 'Travel', priority: 85 },

  // ── Broad keyword fallbacks (priority 70 — checked last) ─────────────────
  { keyword: 'INSURANCE', categoryName: 'Insurance', priority: 70 },
  { keyword: 'GROCERY', categoryName: 'Groceries', priority: 70 },
  { keyword: 'GROCERS', categoryName: 'Groceries', priority: 70 },
  { keyword: 'SUPERSTORE', categoryName: 'Groceries', priority: 70 },
  { keyword: 'RESTAURANT', categoryName: 'Food & Dining', priority: 70 },
  { keyword: 'PIZZA', categoryName: 'Food & Dining', priority: 70 },
  { keyword: 'SUSHI', categoryName: 'Food & Dining', priority: 70 },
  { keyword: 'CAFE', categoryName: 'Food & Dining', priority: 70 },
  { keyword: 'GRILL', categoryName: 'Food & Dining', priority: 70 },
  { keyword: 'GAS BAR', categoryName: 'Fuel', priority: 70 },
  { keyword: 'GAS STATION', categoryName: 'Fuel', priority: 70 },
  { keyword: 'ESSO', categoryName: 'Fuel', priority: 70 },
  { keyword: 'SHELL', categoryName: 'Fuel', priority: 70 },
  { keyword: 'TRANSIT', categoryName: 'Transportation', priority: 70 },
  { keyword: 'PARKING', categoryName: 'Transportation', priority: 70 },
  { keyword: 'PHARMACY', categoryName: 'Healthcare', priority: 70 },
  { keyword: 'MEDICAL', categoryName: 'Healthcare', priority: 70 },
  { keyword: 'DENTAL', categoryName: 'Healthcare', priority: 70 },
  { keyword: 'CLINIC', categoryName: 'Healthcare', priority: 70 },
  { keyword: 'HOTEL', categoryName: 'Travel', priority: 70 },
  { keyword: 'RESORT', categoryName: 'Travel', priority: 70 },
  { keyword: 'HYDRO', categoryName: 'Utilities', priority: 60 },  // lowest — "hydro" can appear in other contexts
  { keyword: 'WIRELESS', categoryName: 'Utilities', priority: 60 },
  { keyword: 'INTERNET', categoryName: 'Utilities', priority: 60 },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEEDER
// ─────────────────────────────────────────────────────────────────────────────

export async function seedDatabase() {
  try {
    // Guard: skip if already seeded
    const categoryCountResult = await db.select({ value: count() }).from(categories);
    const categoryCount = categoryCountResult[0]?.value ?? 0;

    if (categoryCount > 0) {
      console.log('Database already seeded. Skipping.');
      return;
    }

    // ── 1. Insert categories, build name → id map ───────────────────────────
    console.log('Seeding categories...');
    const categoryIdMap: Record<string, string> = {};

    for (const cat of defaultCategories) {
      const result = await db
        .insert(categories)
        .values({
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: cat.type,
          isSystem: cat.isSystem,
        })
        .returning({ id: categories.id });

      if (result[0]?.id) {
        categoryIdMap[cat.name] = result[0].id;
      }
    }

    // ── 2. Insert categorization rules ─────────────────────────────────────
    console.log(`Seeding ${defaultRules.length} categorization rules...`);

    for (const rule of defaultRules) {
      const categoryId = categoryIdMap[rule.categoryName];
      if (!categoryId) {
        console.warn(`Skipping rule "${rule.keyword}" — category "${rule.categoryName}" not found`);
        continue;
      }
      await db.insert(categorizationRules).values({
        keyword: rule.keyword,
        categoryId,
        isUserDefined: false,
        priority: rule.priority,
      });
    }

    console.log('Database seeded successfully!');
    console.log(`  ${defaultCategories.length} categories`);
    console.log(`  ${defaultRules.length} categorization rules`);

  } catch (error) {
    console.error('Error seeding database:', error);
  }
}