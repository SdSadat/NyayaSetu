// =============================================================================
// HTML Extractor — Converts HTML pages to plain text
// =============================================================================
// Uses cheerio for parsing. Supports site-specific CSS selectors for
// Indian legal websites to extract only the relevant content.
// =============================================================================

import type { Extractor, AcquiredContent, ExtractedText } from '../types.js';
import { ExtractionError } from '../types.js';

/**
 * Site-specific CSS selectors for known Indian legal websites.
 * Each entry maps a hostname pattern to the CSS selector for the
 * main content area.
 */
interface SiteSelector {
  hostPattern: RegExp;
  selector: string;
  /** Elements to remove before extraction (e.g., ads, nav). */
  removeSelectors?: string[];
}

const SITE_SELECTORS: SiteSelector[] = [
  {
    hostPattern: /indiankanoon\.org/i,
    selector: '.judgments, .akoma-ntoso',
    removeSelectors: ['.docsource_main', '.ad_doc', '.result_title'],
  },
  {
    hostPattern: /indiacode\.nic\.in/i,
    selector: '#viewActPDF, .actContent, .act-content',
    removeSelectors: ['#header', '#footer', '.sidebar'],
  },
  {
    hostPattern: /legislative\.gov\.in/i,
    selector: '.field-item, .view-content, .actContent',
    removeSelectors: ['#header', '#footer', '#sidebar'],
  },
  {
    hostPattern: /livelaw\.in/i,
    selector: '.entry-content, .post-content',
    removeSelectors: ['.social-share', '.related-posts', '.ad-container'],
  },
];

/**
 * Extracts text from HTML content. Uses site-specific selectors for
 * known Indian legal websites, falls back to `<body>` for unknown sites.
 */
export class HtmlExtractor implements Extractor {
  readonly name = 'html-extractor';

  async extract(content: AcquiredContent): Promise<ExtractedText> {
    if (content.contentType !== 'text/html') {
      throw new ExtractionError(
        `HtmlExtractor expects text/html but got "${content.contentType}"`,
      );
    }

    let cheerio: typeof import('cheerio');
    try {
      cheerio = await import('cheerio');
    } catch {
      throw new ExtractionError(
        'cheerio is not installed. Run: pnpm add cheerio',
      );
    }

    const html =
      content.rawContent instanceof Buffer
        ? content.rawContent.toString('utf-8')
        : content.rawContent;

    const $ = cheerio.load(html);

    // Remove script, style, and noscript tags globally
    $('script, style, noscript').remove();

    // Find site-specific selector
    const url = content.resolvedUrl ?? content.sourceLocation;
    const siteConfig = SITE_SELECTORS.find((s) => s.hostPattern.test(url));

    let text: string;

    if (siteConfig) {
      // Remove unwanted elements
      if (siteConfig.removeSelectors) {
        for (const sel of siteConfig.removeSelectors) {
          $(sel).remove();
        }
      }

      const selected = $(siteConfig.selector);
      text = selected.length > 0 ? selected.text() : $('body').text();
    } else {
      // Generic: use body content
      text = $('body').text();
    }

    // Collapse whitespace
    text = text
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (text.length === 0) {
      throw new ExtractionError(
        `No text content found in HTML from "${content.sourceLocation}".`,
      );
    }

    return {
      text,
      sourceLocation: content.sourceLocation,
      resolvedUrl: content.resolvedUrl,
    };
  }
}
