import { NextResponse } from 'next/server';

interface RateLimitError extends Error {
  status?: number;
  headers?: Record<string, string>;
}

const getRateLimitMessages = (headers: Record<string, string>) => {
  const retryAfter = headers['retry-after'];
  const resetTokens = headers['x-ratelimit-reset-tokens'];

  let timeToWait = '';
  if (retryAfter) {
    timeToWait = `${retryAfter} seconds`;
  } else if (resetTokens) {
    timeToWait = `${resetTokens}`;
  }

  return {
    en: `Too many requests. Please try again in ${timeToWait}.`,
    vi: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${timeToWait}.`,
    ja: `リクエストが多すぎます。${timeToWait}後にもう一度お試しください。`,
  };
};

export const handleRateLimitError = (error: RateLimitError) => {
  if (error.status === 429) {
    const messages = getRateLimitMessages(error.headers || {});
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        messages,
        headers: error.headers,
      },
      { status: 429, headers: error.headers }
    );
  }

  console.error('Groq API route error:', error);
  return NextResponse.json(
    {
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    },
    { status: 500 }
  );
};
