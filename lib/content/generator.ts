/**
 * AI Content Generation for Situation Pages
 * Generates unique, contextual introductions
 */

interface GenerateIntroductionParams {
  situation: string;
  verses: Array<{
    reference: string;
    text: string;
  }>;
  targetWordCount?: number;
}

interface GeneratedIntroduction {
  content: string;
  wordCount: number;
  uniquenessScore: number;
}

/**
 * Generate contextual introduction using AI
 * Uses structured prompt to ensure quality and uniqueness
 */
export async function generateIntroduction(
  params: GenerateIntroductionParams
): Promise<GeneratedIntroduction> {
  const { situation, verses, targetWordCount = 300 } = params;

  // Construct structured prompt
  const prompt = buildIntroductionPrompt(situation, verses, targetWordCount);

  // In production, call your LLM API here:
  // - OpenAI GPT-4
  // - Anthropic Claude
  // - Local LLM
  //
  // For now, return a template that demonstrates the structure
  const content = await callLLMAPI(prompt);

  // Calculate metrics
  const words = content.match(/\b\w+\b/g) || [];
  const wordCount = words.length;
  const uniquenessScore = calculateUniqueness(content);

  return {
    content,
    wordCount,
    uniquenessScore,
  };
}

/**
 * Build structured prompt for LLM
 */
function buildIntroductionPrompt(
  situation: string,
  verses: Array<{ reference: string; text: string }>,
  targetWordCount: number
): string {
  return `You are a biblical scholar and SEO content writer. Write a comprehensive, empathetic introduction for a webpage about Bible verses for "${situation}".

CONTEXT:
- Target audience: People seeking biblical guidance for ${situation}
- Purpose: Help readers understand how Scripture addresses this situation
- Tone: Compassionate, authoritative, accessible

KEY VERSES TO REFERENCE:
${verses.map((v, i) => `${i + 1}. ${v.reference}: "${v.text.substring(0, 100)}..."`).join('\n')}

REQUIREMENTS:
1. Length: ${targetWordCount} words (±20 words)
2. Structure:
   - Opening: Acknowledge the emotional/spiritual context of ${situation}
   - Body: Explain how biblical wisdom addresses this situation
   - Connection: Naturally reference the key verses above
   - Closing: Offer hope and direction
3. Style:
   - Use active voice and varied sentence structure
   - Include specific biblical themes and concepts
   - Avoid generic phrases like "the Bible says" or "Scripture teaches"
   - Make it personal and relatable
4. SEO:
   - Naturally incorporate keywords: "${situation}", "Bible verses", "Scripture", "faith"
   - Use semantic variations
5. Uniqueness:
   - NO boilerplate or template language
   - Every sentence must add value
   - Use specific examples from the verses

Write ONLY the introduction paragraph, no titles or headings.`;
}

/**
 * Call LLM API (placeholder for actual implementation)
 */
async function callLLMAPI(prompt: string): Promise<string> {
  // Check if LLM API key is configured
  const hasAPIKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (hasAPIKey) {
    // PRODUCTION: Call actual LLM API
    // Uncomment and configure when API key is available
    //
    // Example with OpenAI:
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    //   },
    //   body: JSON.stringify({
    //     model: 'gpt-4',
    //     messages: [{ role: 'user', content: prompt }],
    //     temperature: 0.7,
    //     max_tokens: 500,
    //   }),
    // });
    //
    // const data = await response.json();
    // return data.choices[0].message.content;
  }

  // Generate contextual fallback content from the prompt
  return generateFallbackContent(prompt);
}

/**
 * Generate contextual fallback content when no LLM API is available
 */
function generateFallbackContent(prompt: string): string {
  // Extract situation and verses from the prompt
  const situationMatch = prompt.match(/Bible verses for "([^"]+)"/);
  const situation = situationMatch ? situationMatch[1] : 'this situation';

  // Extract verse references from the prompt
  const verseMatches = prompt.match(/\d+\.\s+([^:]+:\d+:\d+)/g);
  const firstVerse = verseMatches?.[0]?.replace(/^\d+\.\s+/, '') || '';

  return `When facing ${situation.toLowerCase()}, many turn to Scripture for comfort, guidance, and strength. The Bible offers timeless wisdom that speaks directly to this experience, providing both practical counsel and spiritual encouragement. ${firstVerse ? `The verse ${firstVerse} stands as a powerful reminder of God's presence and promises during these times. ` : ''}Through prayerful meditation on these sacred texts, believers throughout history have found peace, hope, and the courage to persevere. These biblical passages offer more than just words of comfort—they reveal God's character, His faithfulness, and His deep love for those who seek Him. Whether you're experiencing ${situation.toLowerCase()} yourself or supporting someone who is, these verses illuminate God's perspective and provide anchor points for faith. As you reflect on this Scripture, consider how these ancient truths apply to your current circumstances and invite the Holy Spirit to bring understanding and peace to your heart.`;
}

/**
 * Calculate content uniqueness score
 */
function calculateUniqueness(content: string): number {
  // Simple uniqueness calculation
  // In production, compare against database of existing content
  const words = content.toLowerCase().match(/\b\w+\b/g) || [];
  const uniqueWords = new Set(words);

  return Math.round((uniqueWords.size / words.length) * 100);
}

/**
 * Generate FAQ items for a situation
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export async function generateFAQs(
  situation: string,
  verses: Array<{ reference: string; text: string }>
): Promise<FAQItem[]> {
  const prompt = `Generate 5 frequently asked questions and concise answers about Bible verses for "${situation}".

KEY VERSES AVAILABLE:
${verses.map(v => `- ${v.reference}`).join('\n')}

REQUIREMENTS:
1. Questions should be natural, conversational queries people actually search for
2. Each answer should be 2-3 sentences
3. Reference specific verses naturally
4. Vary question structure (What, How, Why, When, Which)
5. Questions must be unique and specific to ${situation}

FORMAT AS JSON:
[
  {
    "question": "What is the best Bible verse for ${situation}?",
    "answer": "The answer referencing specific verses..."
  }
]

Return ONLY valid JSON, no markdown or extra text.`;

  // In production, call LLM API
  const response = await callLLMAPI(prompt);

  try {
    return JSON.parse(response);
  } catch {
    // Fallback FAQs
    return generateFallbackFAQs(situation, verses);
  }
}

/**
 * Generate fallback FAQs (template-based)
 */
function generateFallbackFAQs(
  situation: string,
  verses: Array<{ reference: string; text: string }>
): FAQItem[] {
  const primaryVerse = verses[0];

  return [
    {
      question: `What is the best Bible verse for ${situation}?`,
      answer: `${primaryVerse.reference} is often considered the most relevant verse, which states: "${primaryVerse.text.substring(0, 100)}..." This verse directly addresses the spiritual needs related to ${situation}.`,
    },
    {
      question: `How many Bible verses address ${situation}?`,
      answer: `While the Bible doesn't use modern terminology like "${situation}," Scripture contains numerous passages that speak to this experience. We've identified ${verses.length} key verses that directly relate to this situation.`,
    },
    {
      question: `Which translation is best for understanding verses about ${situation}?`,
      answer: `Different translations offer unique insights. The KJV provides traditional language, while the WEB and ASV offer more accessible modern English. We recommend comparing multiple translations to gain a fuller understanding.`,
    },
    {
      question: `What does the original Hebrew/Greek say about ${situation}?`,
      answer: `The original biblical languages provide deeper meaning through specific word choices. Key terms in these verses reveal nuances that help us better understand God's perspective on ${situation}.`,
    },
    {
      question: `How can I apply these verses about ${situation} to my life?`,
      answer: `Start by reading the verses in context, meditating on their meaning, and praying for wisdom. Consider how the biblical principles apply to your specific circumstances related to ${situation}.`,
    },
  ];
}

/**
 * Validate content quality
 */
export interface ContentQualityReport {
  wordCount: number;
  uniquenessScore: number;
  hasMultipleTranslations: boolean;
  hasStrongsNumbers: boolean;
  hasFAQs: boolean;
  meetsMinimumStandards: boolean;
  issues: string[];
}

export function validateContentQuality(params: {
  introduction: string;
  translationCount: number;
  strongsCount: number;
  faqCount: number;
}): ContentQualityReport {
  const { introduction, translationCount, strongsCount, faqCount } = params;

  const words = introduction.match(/\b\w+\b/g) || [];
  const wordCount = words.length;
  const uniquenessScore = calculateUniqueness(introduction);

  const issues: string[] = [];

  // Check word count (minimum 250 for >60% uniqueness)
  if (wordCount < 250) {
    issues.push(`Introduction too short: ${wordCount} words (minimum 250)`);
  }

  // Check uniqueness
  if (uniquenessScore < 60) {
    issues.push(`Content uniqueness too low: ${uniquenessScore}% (minimum 60%)`);
  }

  // Check translations
  if (translationCount < 2) {
    issues.push('At least 2 translations required for linguistic depth');
  }

  // Check Strong's numbers
  if (strongsCount < 1) {
    issues.push('At least 1 Strong\'s number required for original language insight');
  }

  // Check FAQs
  if (faqCount < 3) {
    issues.push('At least 3 FAQ items required');
  }

  return {
    wordCount,
    uniquenessScore,
    hasMultipleTranslations: translationCount >= 2,
    hasStrongsNumbers: strongsCount >= 1,
    hasFAQs: faqCount >= 3,
    meetsMinimumStandards: issues.length === 0,
    issues,
  };
}
