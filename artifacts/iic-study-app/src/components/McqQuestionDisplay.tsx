/**
 * McqQuestionDisplay
 * Renders an MCQ question with:
 *  - Inline markdown (** bold **, * italic *)
 *  - Math/formula rendering (KaTeX)
 *  - Auto-extracted numbered statements in a distinct visual block
 *  - Optional closing suffix ("Which of the above…")
 *
 * Use this component everywhere an MCQ question is shown:
 * LessonView (QA, batch, results), FlashcardMcqView (card + projector).
 */

import React from 'react';
import { MCQItem } from '../types';
import { parseMcqQuestion } from '../utils/mcqRender';

interface Props {
  q: MCQItem;
  /** Extra class applied to the question stem and suffix divs */
  questionClassName?: string;
  /** Extra class applied to each statement row (overrides default styling) */
  stmtClassName?: string;
  /** Visual variant: 'default' (light) | 'dark' (projector) */
  variant?: 'default' | 'dark';
}

const McqQuestionDisplay: React.FC<Props> = ({
  q,
  questionClassName = '',
  stmtClassName,
  variant = 'default',
}) => {
  const { questionHtml, statements, suffixHtml } = parseMcqQuestion(q);

  const defaultStmtCls =
    variant === 'dark'
      ? 'bg-slate-800 border-l-4 border-indigo-400 p-3 rounded-lg text-slate-200 text-[15px] font-medium leading-snug'
      : 'bg-indigo-50/70 border-l-4 border-indigo-300 p-2.5 rounded-lg text-slate-700 text-sm font-medium leading-snug';

  const stmtCls = stmtClassName ?? defaultStmtCls;

  return (
    <>
      {/* Question stem */}
      <div
        className={questionClassName}
        dangerouslySetInnerHTML={{ __html: questionHtml }}
      />

      {/* Numbered statements block */}
      {statements.length > 0 && (
        <div className="mt-2 mb-2 flex flex-col gap-1.5">
          {statements.map((stmt, i) => (
            <div
              key={i}
              className={stmtCls}
              dangerouslySetInnerHTML={{ __html: stmt }}
            />
          ))}
        </div>
      )}

      {/* Closing question line ("Which of the above…") */}
      {suffixHtml && (
        <div
          className={questionClassName}
          dangerouslySetInnerHTML={{ __html: suffixHtml }}
        />
      )}
    </>
  );
};

export default McqQuestionDisplay;
