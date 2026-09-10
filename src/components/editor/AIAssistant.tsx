"use client";

import { useRef, useState } from "react";
import {
  FileText,
  ListTree,
  PenLine,
  Sparkles,
  Languages,
  AlignLeft,
  Search,
  Tag,
  Folder,
  Type,
  ScrollText,
  Copy,
  Check,
  LoaderCircle,
  StopCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Textarea } from "@/src/components/ui/Textarea";
import { Input } from "@/src/components/ui/Input";
import {
  useAiArticleMutation,
  useAiCategoryMutation,
  useAiExcerptMutation,
  useAiGrammarMutation,
  useAiOutlineMutation,
  useAiRewriteMutation,
  useAiSeoDescMutation,
  useAiSeoTitleMutation,
  useAiSummarizeMutation,
  useAiTagsMutation,
  useAiTitleMutation,
} from "@/src/store/api/aiApi";
import { getSession } from "next-auth/react";

type ActionKey =
  | "title"
  | "outline"
  | "article"
  | "rewrite"
  | "grammar"
  | "summarize"
  | "seoTitle"
  | "seoDesc"
  | "tags"
  | "category"
  | "excerpt";

interface AIAssistantProps {
  title: string;
  excerpt: string;
  content: string;
  onApply: (field: string, value: string | string[]) => void;
}

const ACTIONS: Array<{ key: ActionKey; label: string; icon: typeof Sparkles; desc: string; needsContent?: boolean }> = [
  { key: "title", label: "Title", icon: Type, desc: "Generate title from topic" },
  { key: "outline", label: "Outline", icon: ListTree, desc: "Generate outline" },
  { key: "article", label: "Article", icon: FileText, desc: "Deep agent draft (LangGraph + Ollama)" },
  { key: "rewrite", label: "Rewrite", icon: PenLine, desc: "Rewrite content", needsContent: true },
  { key: "grammar", label: "Grammar", icon: Languages, desc: "Improve grammar", needsContent: true },
  { key: "summarize", label: "Summarize", icon: AlignLeft, desc: "Summarize", needsContent: true },
  { key: "seoTitle", label: "SEO Title", icon: Search, desc: "SEO title 50-60 chars" },
  { key: "seoDesc", label: "SEO Desc", icon: Search, desc: "SEO 150-160 chars" },
  { key: "tags", label: "Tags", icon: Tag, desc: "Generate tags", needsContent: true },
  { key: "category", label: "Category", icon: Folder, desc: "Suggest category", needsContent: true },
  { key: "excerpt", label: "Excerpt", icon: ScrollText, desc: "Generate excerpt", needsContent: true },
];

export function AIAssistant({ title, excerpt, content, onApply }: AIAssistantProps) {
  const [active, setActive] = useState<ActionKey>("title");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [cost, setCost] = useState<{ total: number; hint: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const [doTitle, { isLoading: lTitle }] = useAiTitleMutation();
  const [doOutline, { isLoading: lOutline }] = useAiOutlineMutation();
  const [doArticle, { isLoading: lArticle }] = useAiArticleMutation();
  const [doRewrite, { isLoading: lRewrite }] = useAiRewriteMutation();
  const [doGrammar, { isLoading: lGrammar }] = useAiGrammarMutation();
  const [doSumm, { isLoading: lSumm }] = useAiSummarizeMutation();
  const [doSeoT, { isLoading: lSeoT }] = useAiSeoTitleMutation();
  const [doSeoD, { isLoading: lSeoD }] = useAiSeoDescMutation();
  const [doTags, { isLoading: lTags }] = useAiTagsMutation();
  const [doCat, { isLoading: lCat }] = useAiCategoryMutation();
  const [doExcerpt, { isLoading: lExcerpt }] = useAiExcerptMutation();

  const loading =
    lTitle || lOutline || lArticle || lRewrite || lGrammar || lSumm || lSeoT || lSeoD || lTags || lCat || lExcerpt || streaming;

  const handleGenerate = async () => {
    setError(null);
    setOutput("");
    setCost(null);
    const ctrl = new AbortController();
    controllerRef.current = ctrl;

    try {
      if (active === "article") {
        setStreaming(true);
        const topic = input.trim() || title.trim();
        if (!topic || topic.length < 3) throw new Error("Provide a topic (min 3 chars)");
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
        const session = await getSession();
        const token = (session as unknown as { backendToken?: string })?.backendToken;
        const res = await fetch(`${base}/ai/article?stream=true`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ topic, outline: input.trim() ? undefined : undefined }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) throw new Error("Stream failed");
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let full = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = dec.decode(value);
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data) continue;
            try {
              const j = JSON.parse(data);
              if (j.text) {
                full += j.text;
                setOutput(full);
              }
              if (j.error) throw new Error(j.error);
              if (j.done) break;
            } catch {}
          }
        }
        setCost({ total: Math.ceil(full.length / 4), hint: "Streaming · Ollama Gemma" });
        setStreaming(false);
        return;
      }

      let res: { result: string; total: number; hint: string } | null = null;
      switch (active) {
        case "title":
          if (!input.trim() && !title.trim()) throw new Error("Enter a topic");
          res = await doTitle({ topic: input.trim() || title }).unwrap();
          break;
        case "outline":
          res = await doOutline({ topic: input.trim() || title }).unwrap();
          break;
        case "rewrite":
          if (!content.trim()) throw new Error("Content empty");
          res = await doRewrite({ content, instruction: input.trim() || undefined }).unwrap();
          break;
        case "grammar":
          if (!content.trim()) throw new Error("Content empty");
          res = await doGrammar({ content }).unwrap();
          break;
        case "summarize":
          if (!content.trim()) throw new Error("Content empty");
          res = await doSumm({ content }).unwrap();
          break;
        case "seoTitle":
          res = await doSeoT({ title: input.trim() || title }).unwrap();
          break;
        case "seoDesc":
          res = await doSeoD({ excerpt: input.trim() || excerpt || content.slice(0, 500) }).unwrap();
          break;
        case "tags":
          if (!content.trim()) throw new Error("Content empty");
          res = await doTags({ content }).unwrap();
          break;
        case "category":
          if (!content.trim()) throw new Error("Content empty");
          res = await doCat({ content }).unwrap();
          break;
        case "excerpt":
          if (!content.trim()) throw new Error("Content empty");
          res = await doExcerpt({ content }).unwrap();
          break;
      }
      if (res) {
        setOutput(res.result);
        setCost({ total: res.total, hint: res.hint });
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") setError("Cancelled");
      else setError((e as { data?: { message?: string } })?.data?.message || (e as Error).message || "AI failed");
    } finally {
      setStreaming(false);
      controllerRef.current = null;
    }
  };

  const handleCancel = () => {
    controllerRef.current?.abort();
    setStreaming(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleApply = () => {
    if (!output) return;
    const map: Record<ActionKey, string> = {
      title: "title",
      outline: "content",
      article: "content",
      rewrite: "content",
      grammar: "content",
      summarize: "excerpt",
      seoTitle: "seoTitle",
      seoDesc: "seoDescription",
      tags: "tags",
      category: "category",
      excerpt: "excerpt",
    };
    const field = map[active];
    if (active === "tags") onApply(field, output.split(",").map((t) => t.trim()));
    else onApply(field, output);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-violet-50/50 to-white dark:border-violet-800/30 dark:from-violet-950/20 dark:to-zinc-950">
      {/* Header */}
      <div className="border-b border-violet-100/50 px-5 py-4 dark:border-violet-800/20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
            <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI Assistant</h2>
            <p className="text-[11px] text-zinc-400">Gemma · LangGraph · Streaming</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Action grid */}
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-4" role="group" aria-label="AI actions">
          {ACTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={active === key}
              onClick={() => {
                setActive(key);
                setOutput("");
                setError(null);
                setCost(null);
              }}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-medium outline-none transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet-600 dark:focus-visible:outline-violet-400 ${
                active === key
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="mt-4">
          <Textarea
            aria-label="AI assistant input"
            placeholder={
              active === "title"
                ? "e.g. The future of serverless"
                : active === "article"
                  ? "Leave empty to use post title, or enter outline"
                  : "Optional context…"
            }
            rows={active === "article" ? 3 : 2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={handleGenerate} loading={loading} disabled={loading} size="sm">
            {streaming ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {streaming ? "Generating…" : "Generate"}
          </Button>
          {streaming && (
            <Button variant="secondary" size="sm" onClick={handleCancel}>
              <StopCircle className="h-4 w-4" /> Cancel
            </Button>
          )}
          {output && !streaming && (
            <>
              <Button variant="secondary" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleApply}>
                Apply
              </Button>
            </>
          )}
        </div>

        {/* Cost */}
        {cost && (
          <p className="mt-2 text-[11px] text-zinc-400">
            ~{cost.total} tokens · {cost.hint}
          </p>
        )}

        {/* Error */}
        {error && (
          <div role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-zinc-200/70 bg-white p-4 text-sm leading-relaxed dark:border-zinc-800/70 dark:bg-zinc-950">
            {output}
          </div>
        )}
      </div>
    </div>
  );
}
