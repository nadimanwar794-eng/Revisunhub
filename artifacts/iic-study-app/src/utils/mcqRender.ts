/**
 * mcqRender.ts
 * Shared utilities for rendering MCQ questions with:
 *  - Inline markdown  (**bold**, *italic*, `code`)
 *  - Math/formula rendering (via renderMathInHtml)
 *  - Auto-extraction of numbered statements from question text
 *    when q.statements[] is not populated in the database
 */

import { MCQItem } from '../types';
import { renderMathInHtml } from './mathUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Inline Markdown → HTML
// Protects math expressions from being mangled.
// Handles: ***bold+italic***, **bold**, *italic*, `code`
// ─────────────────────────────────────────────────────────────────────────────
export const inlineMd = (s: string): string => {
  if (!s) return '';
  const saved: string[] = [];
  // Protect math blocks first
  let r = s.replace(
    /\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$/g,
    m => { saved.push(m); return `\x00M${saved.length - 1}\x00`; }
  );
  r = r
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<![*])\*(?![*\s])([^*\n]+?)(?<!\s)\*(?![*])/g, '<em>$1</em>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>');
  // Restore math
  return r.replace(/\x00M(\d+)\x00/g, (_, i) => saved[+i]);
};

// ─────────────────────────────────────────────────────────────────────────────
// Statement detection helpers
// ─────────────────────────────────────────────────────────────────────────────

/** A line is a numbered statement: "1. text", "2) text", "Statement 1: text", "कथन I", "कथन 1", "I. text" */
const STMT_LINE_RE = /^(?:\d+[.)]\s+|(?:Statement|कथन|Assertion|Reason)\s*(?:[0-9IVXivx]+)?\s*[:.\-)]\s*|[IVX]+[.)]\s+).+/i;

// ─────────────────────────────────────────────────────────────────────────────
// Parsed MCQ result
// ─────────────────────────────────────────────────────────────────────────────
export interface ParsedMcq {
  /** Rendered HTML for the question stem (before statements) */
  questionHtml: string;
  /** Rendered HTML strings for each statement */
  statements: string[];
  /** Rendered HTML for closing line after statements ("Which of above…") */
  suffixHtml: string;
}

const renderLine = (text: string) => renderMathInHtml(inlineMd(text));

/**
 * Parse an MCQItem into display-ready HTML parts.
 *
 * Priority:
 *  1. If `q.statements` is already populated → use it (just apply markdown + math)
 *  2. Otherwise scan `q.question` line-by-line and auto-extract numbered items
 */
// Words that signal the closing "which of the above…?" line
const SUFFIX_TRIGGER_RE = /(?:which\s+of\s+the|उपर्युक्त|उपरोक्त|choose\s+the|select\s+the|find\s+the|निम्नलिखित\s+में\s+से|कूट)/i;

export const parseMcqQuestion = (q: MCQItem): ParsedMcq => {
  // ── Case 1: statements already in data ──────────────────────────────────
  // q.question may hold:
  //   (a) "intro text"
  //   (b) "intro text\n\nउपर्युक्त में से…?"
  //   (c) "उपर्युक्त में से…?"  (no intro — happens when question starts with statements)
  // We split it so the closing question lands in suffixHtml (shown AFTER statement boxes),
  // not in questionHtml (shown BEFORE them).
  if (q.statements && q.statements.length > 0) {
    const rawQ  = q.question.replace(/<br\s*\/?>/gi, '\n');
    const qLines = rawQ.split('\n').map(l => l.trim()).filter(Boolean);

    const introLines: string[] = [];
    const suffLines:  string[] = [];
    let inSuffix = false;

    for (const line of qLines) {
      if (!inSuffix && SUFFIX_TRIGGER_RE.test(line)) inSuffix = true;
      (inSuffix ? suffLines : introLines).push(line);
    }

    return {
      questionHtml: introLines.length ? renderLine(introLines.join('<br/>')) : '',
      statements:   q.statements.map(renderLine),
      suffixHtml:   suffLines.length  ? renderLine(suffLines.join('<br/>'))  : '',
    };
  }

  // ── Case 2: auto-extract from question text ──────────────────────────────
  // Normalise: convert <br/> HTML breaks to \n, then split
  const rawText = q.question.replace(/<br\s*\/?>/gi, '\n');
  const lines   = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const preLines:    string[] = [];
  const stmtLines:   string[] = [];
  const suffixLines: string[] = [];

  // Walk lines in 3 phases: pre-statement → statement block → suffix
  let phase: 'pre' | 'stmts' | 'suffix' = 'pre';

  for (const line of lines) {
    if (phase === 'pre') {
      if (STMT_LINE_RE.test(line)) {
        phase = 'stmts';
        stmtLines.push(line);
      } else {
        preLines.push(line);
      }
    } else if (phase === 'stmts') {
      if (STMT_LINE_RE.test(line)) {
        // Next numbered item
        stmtLines.push(line);
      } else {
        // Non-numbered line after statements = closing question or extra context
        phase = 'suffix';
        suffixLines.push(line);
      }
    } else {
      suffixLines.push(line);
    }
  }

  // If nothing was extracted as statements, treat whole text as question
  if (stmtLines.length === 0) {
    return {
      questionHtml: renderLine(rawText.replace(/\n/g, '<br/>')),
      statements:   [],
      suffixHtml:   '',
    };
  }

  const joinRender = (ls: string[]) => renderLine(ls.join('<br/>'));

  return {
    questionHtml: joinRender(preLines),
    statements:   stmtLines.map(renderLine),
    suffixHtml:   joinRender(suffixLines),
  };
};
