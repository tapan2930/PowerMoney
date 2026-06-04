import { db } from '@/db';
import { categorizationRules, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Automatically categorizes a transaction based on description/merchant.
 * Uses rules from SQLite. If no rules match, returns a fallback category ID.
 */
export async function autoCategorize(
  description: string,
  merchant?: string | null,
  type: 'income' | 'expense' = 'expense'
): Promise<string | null> {
  const queryText = (merchant || description || '').toUpperCase();
  if (!queryText) return null;

  try {
    // 1. Fetch all rules ordered by priority
    const rules = await db.select().from(categorizationRules);
    
    // Sort descending by priority manually to ensure higher priority is checked first
    const matchingRule = rules
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      .find((r) => queryText.includes(r.keyword.toUpperCase()));

    if (matchingRule?.categoryId) {
      return matchingRule.categoryId;
    }

    // 2. Fallback: Search default categories by name
    const cats = await db.select().from(categories).where(eq(categories.type, type));
    
    const lowerQuery = queryText.toLowerCase();
    
    // Find category that matches any keywords
    const matchedCat = cats.find(c => {
      const catName = c.name.toLowerCase();
      // If categories has multiple words, split them to check
      const nameParts = catName.split('&').map(s => s.trim().replace(' ', ''));
      return nameParts.some(part => lowerQuery.includes(part)) || lowerQuery.includes(catName);
    });

    if (matchedCat) {
      return matchedCat.id;
    }

    // 3. Ultimate Fallback: "Other" or "Other Income"
    const fallbackName = type === 'income' ? 'Other Income' : 'Other';
    const fallbackCat = cats.find(c => c.name === fallbackName);
    return fallbackCat?.id || cats[0]?.id || null;
  } catch (e) {
    console.error('Error in autoCategorize:', e);
    return null;
  }
}

/**
 * Creates or updates a rule when a user manually recategorizes a transaction.
 */
export async function learnCategorizationRule(merchant: string, categoryId: string) {
  if (!merchant || !categoryId) return;
  const keyword = merchant.toUpperCase().trim();
  
  try {
    const existingRules = await db
      .select()
      .from(categorizationRules)
      .where(eq(categorizationRules.keyword, keyword));

    if (existingRules.length > 0) {
      // Update existing rule and increment priority
      await db
        .update(categorizationRules)
        .set({ categoryId, isUserDefined: true, priority: (existingRules[0].priority ?? 0) + 1 })
        .where(eq(categorizationRules.id, existingRules[0].id));
    } else {
      // Insert new rule
      await db.insert(categorizationRules).values({
        keyword,
        categoryId,
        isUserDefined: true,
        priority: 1,
      });
    }
  } catch (e) {
    console.error('Error learning categorization rule:', e);
  }
}
