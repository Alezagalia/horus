/**
 * ReflectionSection - Preguntas de reflexión con CRUD inline (F-03)
 */

import { useState } from 'react';
import type { ReviewQuestion, WeeklyReviewAnswer } from '@horus/shared';
import { useCreateQuestion, useDeleteQuestion } from '@/hooks/useWeeklyReview';

interface ReflectionSectionProps {
  questions: ReviewQuestion[];
  answers: WeeklyReviewAnswer[];
  onAnswerChange: (questionId: string, answer: string) => void;
}

export function ReflectionSection({ questions, answers, onAnswerChange }: ReflectionSectionProps) {
  const [newQuestionText, setNewQuestionText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const createQuestion = useCreateQuestion();
  const deleteQuestion = useDeleteQuestion();

  const getAnswer = (questionId: string) =>
    answers.find((a) => a.questionId === questionId)?.answer ?? '';

  const handleAddQuestion = async () => {
    const text = newQuestionText.trim();
    if (!text) return;
    await createQuestion.mutateAsync({ text, order: questions.length });
    setNewQuestionText('');
    setShowAddForm(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <span className="text-lg">💭</span>
        Reflexión
      </h3>

      {questions.length === 0 && (
        <p className="text-sm text-gray-400 mb-4">
          Aún no tienes preguntas. Agrega una para comenzar.
        </p>
      )}

      <div className="space-y-5">
        {questions.map((q) => (
          <div key={q.id} className="group">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <label className="text-sm font-medium text-gray-700 flex-1">{q.text}</label>
              <button
                onClick={() => deleteQuestion.mutate(q.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-300 hover:text-red-400 rounded"
                title="Eliminar pregunta"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <textarea
              className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all placeholder:text-gray-300"
              rows={3}
              placeholder="Tu respuesta..."
              value={getAnswer(q.id)}
              onChange={(e) => onAnswerChange(q.id, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Add question form */}
      {showAddForm ? (
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
            placeholder="¿Qué salió bien esta semana?"
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddQuestion();
              if (e.key === 'Escape') setShowAddForm(false);
            }}
            autoFocus
          />
          <button
            onClick={handleAddQuestion}
            disabled={!newQuestionText.trim() || createQuestion.isPending}
            className="px-3 py-2 bg-violet-500 text-white text-sm rounded-xl disabled:opacity-50 hover:bg-violet-600 transition-colors"
          >
            {createQuestion.isPending ? '...' : 'Agregar'}
          </button>
          <button
            onClick={() => setShowAddForm(false)}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-xl transition-colors"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-4 flex items-center gap-1.5 text-sm text-violet-500 hover:text-violet-700 transition-colors"
        >
          <span className="text-lg leading-none">＋</span>
          <span>Agregar pregunta</span>
        </button>
      )}
    </div>
  );
}
