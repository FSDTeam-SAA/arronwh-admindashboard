type QuoteQuizAnswerLike = {
  question?: string;
  answer?: string;
  price?: number | null;
};

export type QuotePriceAdjustmentItem = {
  question: string;
  answer: string;
  label: string;
  price: number;
};

const cleanText = (value: string) => value.replace(/\s+/g, " ").trim();

const buildAdjustmentLabel = (question: string, answer: string) => {
  const normalizedQuestion = question.toLowerCase();

  if (normalizedQuestion.includes("where do you want your new boiler")) {
    return `Moving boiler within ${answer.toLowerCase()}`;
  }

  return `${question}: ${answer}`;
};

export const getQuotePriceAdjustmentItems = (
  quizAnswers: QuoteQuizAnswerLike[] | undefined
): QuotePriceAdjustmentItem[] => {
  if (!quizAnswers?.length) {
    return [];
  }

  return quizAnswers.reduce<QuotePriceAdjustmentItem[]>((items, quizAnswer) => {
    if (
      typeof quizAnswer.price !== "number" ||
      !Number.isFinite(quizAnswer.price) ||
      quizAnswer.price <= 0
    ) {
      return items;
    }

    const question = cleanText(quizAnswer.question ?? "");
    const answer = cleanText(quizAnswer.answer ?? "");
    if (!question || !answer) {
      return items;
    }

    items.push({
      question,
      answer,
      label: buildAdjustmentLabel(question, answer),
      price: quizAnswer.price,
    });

    return items;
  }, []);
};

export const getQuotePriceAdjustmentTotal = (
  quizAnswers: QuoteQuizAnswerLike[] | undefined
) =>
  getQuotePriceAdjustmentItems(quizAnswers).reduce(
    (total, item) => total + item.price,
    0
  );

export const getPrimaryQuotePriceAdjustmentItem = (
  quizAnswers: QuoteQuizAnswerLike[] | undefined
) => {
  const items = getQuotePriceAdjustmentItems(quizAnswers);
  if (!items.length) {
    return null;
  }

  if (items.length === 1) {
    return items[0];
  }

  return {
    question: "Quote adjustments",
    answer: `${items.length} items`,
    label: "Additional quote adjustments",
    price: items.reduce((total, item) => total + item.price, 0),
  };
};
