# Content Generation System

Complete guide for the anti-thin-content generation system for situation pages.

## Overview

This system ensures every `/bible-verses-for-[situation]` page contains rich, unique content that won't be flagged as thin content by search engines. Each page dynamically generates:

1. **300+ word AI-powered introduction** - Contextual, unique content
2. **Multi-translation comparison** - KJV, WEB, ASV, BBE, YLT side-by-side
3. **Strong's Lexicon integration** - Hebrew/Greek original language insights
4. **Programmatic FAQs** - With JSON-LD FAQSchema
5. **Content quality validation** - Ensures >60% uniqueness

## Architecture

### Content Flow

```
Situation Slug → Database Query → AI Generation → Quality Validation → Render
     ↓               ↓                  ↓               ↓                ↓
  "anxiety"    Top 10 verses    300-word intro    Quality check    Rich page
                + Strong's       + 5 FAQs         + metrics
```

### Key Components

#### 1. Database Queries ([lib/db/situation-queries.ts](lib/db/situation-queries.ts))

```typescript
getSituationWithVerses(slug, limit)
├── Fetches situation metadata
├── Gets top N verses by relevance score
├── Includes all 5 translations
└── Loads Strong's numbers for each verse

getTopStrongsFromVerse(verse, limit)
├── Extracts most significant Strong's numbers
└── Returns Hebrew/Greek word data

getRelatedSituations(slug, limit)
└── Finds similar situations by category
```

#### 2. AI Content Generator ([lib/content/generator.ts](lib/content/generator.ts))

**Introduction Generation:**
```typescript
generateIntroduction({
  situation: "Anxiety",
  verses: [{ reference: "Phil 4:6", text: "..." }],
  targetWordCount: 300
})
```

Returns:
- `content`: AI-generated paragraph
- `wordCount`: Actual word count
- `uniquenessScore`: % unique words

**Structured Prompt:**
- Acknowledges emotional context
- References specific verses naturally
- Avoids generic phrases
- Targets 300 ± 20 words
- Ensures >60% uniqueness

**FAQ Generation:**
```typescript
generateFAQs(situation, verses)
```

Returns 5 FAQs:
- Natural, conversational questions
- 2-3 sentence answers
- References specific verses
- Varied question types (What, How, Why, Which, When)

#### 3. Translation Comparison ([components/translation-comparison.tsx](components/translation-comparison.tsx))

**Two Layouts:**

1. **Tabs** (default for primary verse):
   - Toggle between translations
   - Focused reading experience
   - Shows linguistic note

2. **Grid** (for additional verses):
   - Side-by-side comparison
   - 2-3 column responsive layout
   - Comparative analysis

**Features:**
- Client component (minimal JS)
- Accessible with keyboard navigation
- Translation metadata displayed

#### 4. Strong's Display ([components/strongs-display.tsx](components/strongs-display.tsx))

Shows 3 key words from primary verse:
- Strong's ID (H1234 or G5678)
- Original word (Hebrew/Greek characters)
- Transliteration (pronunciation)
- Complete definition
- Language indicator

**Educational Value:**
- Explains why original languages matter
- Provides context for non-scholars
- Enhances page depth

#### 5. FAQ with JSON-LD ([components/faq-section.tsx](components/faq-section.tsx))

Generates dual output:
1. Visual FAQ display
2. JSON-LD FAQPage schema

**Schema Structure:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the best verse for anxiety?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Philippians 4:6-7 is often..."
      }
    }
  ]
}
```

Benefits:
- Rich snippet eligibility
- FAQ feature in search results
- Increased SERP real estate

## Content Quality Standards

### Minimum Requirements

| Metric | Threshold | Purpose |
|--------|-----------|---------|
| Word Count | 250+ words | Substantive content |
| Uniqueness | >60% | Not flagged as duplicate |
| Translations | 2+ | Linguistic depth |
| Strong's Numbers | 1+ | Original language insight |
| FAQs | 3+ | User value + schema |

### Quality Validation

```typescript
validateContentQuality({
  introduction: string,
  translationCount: number,
  strongsCount: number,
  faqCount: number,
})
```

Returns:
```typescript
{
  wordCount: 320,
  uniquenessScore: 75,
  hasMultipleTranslations: true,
  hasStrongsNumbers: true,
  hasFAQs: true,
  meetsMinimumStandards: true,
  issues: [] // Empty if valid
}
```

**Development Mode:**
Quality metrics displayed at top of page:
```
Quality: ✓ | Words: 320 | Uniqueness: 75%
```

Issues logged to console if standards not met.

## Page Structure

### Section Breakdown

```html
<article>
  <!-- 1. Header (100 words) -->
  <header>
    - Breadcrumbs
    - H1: "Bible Verses for [Situation]"
    - Meta description
    - Quality badge (dev only)
  </header>

  <!-- 2. AI Introduction (300+ words) -->
  <section class="introduction">
    - Contextual, empathetic content
    - Natural verse references
    - No boilerplate
    - Unique per situation
  </section>

  <!-- 3. Primary Verse Analysis (200 words) -->
  <section class="primary-verse">
    - Translation comparison (tabs)
    - KJV, WEB, ASV, BBE, YLT
    - Manual curator note (if exists)
  </section>

  <!-- 4. Original Language (150 words) -->
  <section class="strongs">
    - 3 key Hebrew/Greek words
    - Transliteration + definition
    - Educational context
  </section>

  <!-- 5. Additional Verses (300+ words) -->
  <section class="more-verses">
    - 4-9 additional verses
    - Relevance scores displayed
    - Translations for high-relevance verses
  </section>

  <!-- 6. FAQ Section (250+ words) -->
  <section class="faq">
    - 5 programmatic questions
    - JSON-LD FAQPage schema
    - Natural, conversational
  </section>

  <!-- 7. Related Topics (100 words) -->
  <section class="related">
    - 5 related situations
    - Category-based matching
    - Internal linking for SEO
  </section>

  <!-- 8. Call to Action (100 words) -->
  <section class="cta">
    - Application guidance
    - Bookmark/share buttons
  </section>
</article>
```

**Total Word Count:** 1,400-1,600 words per page

**Unique Content:** >60% (850-960 unique words)

## AI Integration

### LLM API Setup

The system supports any LLM provider. Configure in `.env`:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Or Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Or local LLM endpoint
LLM_API_ENDPOINT=http://localhost:11434
```

### OpenAI Integration Example

Edit [lib/content/generator.ts](lib/content/generator.ts:39):

```typescript
async function callLLMAPI(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Anthropic Claude Integration

```typescript
async function callLLMAPI(prompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: prompt
      }],
    }),
  });

  const data = await response.json();
  return data.content[0].text;
}
```

### Caching Strategy

**Cache Generated Content:**

```typescript
// Cache AI responses for 24 hours
const cacheKey = `intro:${situation}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const generated = await generateIntroduction({...});
await redis.setex(cacheKey, 86400, JSON.stringify(generated));
```

**Benefits:**
- Reduce API costs
- Faster page loads
- Consistent content
- API rate limit protection

**Invalidation:**
Regenerate when:
- Situation data changes
- Verse mappings updated
- Manual content review requested

## SEO Benefits

### Thin Content Prevention

✅ **300+ word introduction** - Substantive, unique content
✅ **Multiple translations** - Linguistic depth and value
✅ **Original language insights** - Expert-level content
✅ **Structured FAQs** - Natural question answering
✅ **1,400+ total words** - Well above thin content threshold

### Rich Snippets

**Enabled by:**
- Article schema with wordCount
- FAQPage schema for questions
- Proper heading hierarchy (H1, H2, H3)
- Semantic HTML (blockquote, cite, etc.)

**Potential SERP Features:**
- Featured snippets (FAQ answers)
- People Also Ask (FAQ questions)
- Knowledge panel (Article schema)
- Rich cards (OpenGraph)

### Internal Linking

**Related Topics Section:**
- 5 contextual links per page
- Category-based relevance
- Helps crawl budget
- Distributes PageRank

**Breadcrumbs:**
- Schema.org BreadcrumbList (future enhancement)
- Improves navigation
- Reduces bounce rate

## Performance Optimization

### Server-Side Only

Most components are server-rendered:
- ✅ TranslationComparison tabs (client component)
- ✅ StrongsDisplay (server)
- ✅ FAQSection (server)
- ✅ All text content (server)

**Benefits:**
- Faster LCP (< 2.0s)
- Minimal JavaScript
- Better SEO crawling

### Caching Layers

1. **React Cache** - Request deduplication
2. **Database Query Cache** - Prisma
3. **AI Response Cache** - Redis (optional)
4. **CDN Cache** - Static assets

### Lazy Loading

**Additional Verses:**
- First 2 verses: Full translations
- Next 3-7 verses: Single translation + expand option
- Reduces initial payload

## Testing

### Content Quality Audit

```bash
# Check page meets standards
npm run audit:content bible-verses-for-anxiety
```

Checks:
- Word count ≥ 250
- Uniqueness ≥ 60%
- Translations ≥ 2
- Strong's ≥ 1
- FAQs ≥ 3

### A/B Testing

Test variations:
1. **Introduction length**: 250 vs 300 vs 350 words
2. **Translation layout**: Tabs vs Grid
3. **Strong's count**: 2 vs 3 vs 5 words
4. **FAQ count**: 3 vs 5 vs 7 questions

Measure:
- Time on page
- Bounce rate
- Scroll depth
- SERP CTR

## Scaling

### Batch Content Generation

Generate introductions for all situations:

```typescript
const situations = await prisma.situation.findMany();

for (const situation of situations) {
  const data = await getSituationWithVerses(situation.slug, 10);
  const intro = await generateIntroduction({...});

  await prisma.situation.update({
    where: { id: situation.id },
    data: { content: intro.content }
  });

  // Rate limit: 1 request per second
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

### Cost Estimation

**OpenAI GPT-4:**
- ~400 tokens per intro generation
- $0.03 per 1K tokens (input)
- $0.06 per 1K tokens (output)
- **Cost per page**: ~$0.03

**For 10,000 pages:**
- Total cost: $300
- With caching: $300 (one-time)
- With regeneration (10%/month): $30/month

## Troubleshooting

### Low Uniqueness Score

**Symptoms:** Score < 60%

**Causes:**
1. Template phrases in prompt
2. Generic AI responses
3. Short introduction length

**Solutions:**
- Refine prompt to avoid common phrases
- Increase temperature (0.7 → 0.8)
- Require more specific examples
- Increase target word count

### Missing Translations

**Symptoms:** Only KJV available

**Cause:** Incomplete ingestion

**Solution:**
```bash
npm run ingest:bible
```

Ensure all 5 translations ingested.

### No Strong's Numbers

**Symptoms:** Empty Strong's section

**Causes:**
1. Not ingested for this verse
2. Verse not in top 1,000 popular

**Solutions:**
1. Run Strong's ingestion for more verses
2. Manually map key verses
3. Import complete Strong's dataset

## Future Enhancements

### 1. Video Content

Add short video explanations:
- 1-2 minute verse explanation
- Embedded YouTube/Vimeo
- VideoObject schema

### 2. Audio Bible

Integrate audio readings:
- Multiple voice options
- Download capability
- AudioObject schema

### 3. User Comments

Allow community engagement:
- Verse interpretations
- Personal testimonies
- Comment moderation

### 4. Personalization

Tailor content to user:
- Reading level adjustment
- Preferred translation
- Language localization

### 5. Dynamic Images

Generate verse images:
- Shareable graphics
- Social media optimized
- Branded templates

## Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org FAQPage](https://schema.org/FAQPage)
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated:** 2026-01-05
**System Version:** 1.0
