import { baseApi } from "./baseApi";

export interface AiResult {
  result: string;
  inputTokens: number;
  outputTokens: number;
  total: number;
  hint: string;
  tags?: string[];
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

export const aiApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    aiTitle: build.mutation<AiResult, { topic: string }>({
      query: (body) => ({ url: "/ai/title", method: "POST", body }),
      transformResponse: (res: Envelope<AiResult>) => res.data,
    }),
    aiOutline: build.mutation<AiResult, { topic: string }>({
      query: (body) => ({ url: "/ai/outline", method: "POST", body }),
      transformResponse: (res: Envelope<AiResult>) => res.data,
    }),
    aiArticle: build.mutation<AiResult, { topic: string; outline?: string }>({
      query: (body) => ({ url: "/ai/article", method: "POST", body }),
      transformResponse: (res: Envelope<AiResult>) => res.data,
    }),
    aiRewrite: build.mutation<AiResult, { content: string; instruction?: string }>({
      query: (body) => ({ url: "/ai/rewrite", method: "POST", body }),
      transformResponse: (res: Envelope<AiResult>) => res.data,
    }),
    aiGrammar: build.mutation<AiResult, { content: string }>({
      query: (body) => ({ url: "/ai/grammar", method: "POST", body }),
      transformResponse: (res: Envelope<AiResult>) => res.data,
    }),
    aiSummarize: build.mutation<AiResult, { content: string }>({
      query: (body) => ({ url: "/ai/summarize", method: "POST", body }),
      transformResponse: (res: Envelope<AiResult>) => res.data,
    }),
    aiSeoTitle: build.mutation<AiResult, { title: string }>({
      query: (body) => ({ url: "/ai/seo-title", method: "POST", body }),
      transformResponse: (res: Envelope<AiResult>) => res.data,
    }),
    aiSeoDesc: build.mutation<AiResult, { excerpt: string }>({
      query: (body) => ({ url: "/ai/seo-description", method: "POST", body }),
      transformResponse: (res: Envelope<AiResult>) => res.data,
    }),
    aiTags: build.mutation<AiResult, { content: string }>({
      query: (body) => ({ url: "/ai/tags", method: "POST", body }),
      transformResponse: (res: Envelope<AiResult>) => res.data,
    }),
    aiCategory: build.mutation<AiResult, { content: string }>({
      query: (body) => ({ url: "/ai/category", method: "POST", body }),
      transformResponse: (res: Envelope<AiResult>) => res.data,
    }),
    aiExcerpt: build.mutation<AiResult, { content: string }>({
      query: (body) => ({ url: "/ai/excerpt", method: "POST", body }),
      transformResponse: (res: Envelope<AiResult>) => res.data,
    }),
  }),
});

export const {
  useAiTitleMutation,
  useAiOutlineMutation,
  useAiArticleMutation,
  useAiRewriteMutation,
  useAiGrammarMutation,
  useAiSummarizeMutation,
  useAiSeoTitleMutation,
  useAiSeoDescMutation,
  useAiTagsMutation,
  useAiCategoryMutation,
  useAiExcerptMutation,
} = aiApi;

/** Streaming helper for article generation (SSE) */
export async function streamAiArticle(
  topic: string,
  outline: string | undefined,
  onChunk: (text: string) => void,
  signal: AbortSignal,
): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/article?stream=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, outline }),
    signal,
    credentials: "include",
  });
  if (!res.ok || !res.body) throw new Error("Stream failed");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const j = JSON.parse(data);
        if (j.text) onChunk(j.text);
        if (j.error) throw new Error(j.error);
      } catch {}
    }
  }
}
