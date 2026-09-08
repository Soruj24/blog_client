import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AtSign,
  BookOpen,
  Calendar,
  Eye,
  Globe,
  Link2,
  MapPin,
  Users,
} from "lucide-react";
import { auth } from "@/auth";
import { Avatar } from "@/src/components/ui/Avatar";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { BlogPagination } from "@/src/components/blog/BlogPagination";
import { FollowButton } from "@/src/components/blog/FollowButton";
import { PostGrid } from "@/src/components/blog/PostGrid";
import {
  BLOG_PAGE_SIZE,
  fetchAuthorProfile,
  fetchBlogArticles,
} from "@/src/lib/server-api";

const apiBase =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/api/v1";

async function fetchFollowState(username: string, token: string) {
  try {
    const res = await fetch(`${apiBase}/follows/${username}/state`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return { following: false };
    const json = (await res.json()) as { data: { following: boolean } };
    return json.data;
  } catch {
    return { following: false };
  }
}

function socialUrl(kind: "website" | "twitter" | "github" | "linkedin", value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const handle = value.replace(/^@/, "");
  switch (kind) {
    case "twitter":
      return `https://x.com/${handle}`;
    case "github":
      return `https://github.com/${handle}`;
    case "linkedin":
      return `https://www.linkedin.com/in/${handle}`;
    default:
      return `https://${value}`;
  }
}

function socialLabel(kind: "website" | "twitter" | "github" | "linkedin", value: string): string {
  if (kind === "website") {
    try {
      return new URL(socialUrl(kind, value)).hostname.replace(/^www\./, "");
    } catch {
      return value;
    }
  }
  const names = { twitter: "X (Twitter)", github: "GitHub", linkedin: "LinkedIn" } as const;
  return value.startsWith("http") ? names[kind] : `@${value.replace(/^@/, "")}`;
}

interface AuthorPageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { username } = await params;
  const author = await fetchAuthorProfile(username);
  if (!author) return { title: "Author not found", robots: { index: false, follow: false } };
  const description =
    author.bio ||
    `Read stories by ${author.displayName} on Inkwell — ${author.postCount} ${author.postCount === 1 ? "article" : "articles"}.`;
  return {
    title: `${author.displayName} (@${author.username})`,
    description,
    alternates: { canonical: `/author/${author.username}` },
    openGraph: {
      type: "profile",
      title: `${author.displayName} on Inkwell`,
      description,
      images: author.avatarUrl ? [{ url: author.avatarUrl, alt: author.displayName }] : undefined,
    },
    twitter: {
      card: "summary",
      title: `${author.displayName} on Inkwell`,
      description,
      images: author.avatarUrl ? [author.avatarUrl] : undefined,
    },
  };
}

function AuthorJsonLd({
  author,
}: {
  author: NonNullable<Awaited<ReturnType<typeof fetchAuthorProfile>>>;
}) {
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const sameAs = [author.website, author.twitter, author.github, author.linkedin]
    .filter((v): v is string => !!v)
    .map((v, i) =>
      socialUrl(["website", "twitter", "github", "linkedin"][i] as "website", v),
    );
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: author.displayName,
      description: author.bio || undefined,
      image: author.avatarUrl ?? undefined,
      sameAs: sameAs.length > 0 ? sameAs : undefined,
    },
    url: `${siteUrl}/author/${author.username}`,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
}

/**
 * Public author profile — server-rendered for SEO. Only allowlisted
 * public fields ever reach the client (see author.service shaping).
 * Guests see a sign-in prompt on the follow button; the page itself
 * stays fully public.
 */
export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
  const { username } = await params;
  const sp = await searchParams;
  const rawPage = Number(Array.isArray(sp["page"]) ? sp["page"][0] : sp["page"]);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const session = await auth();

  const author = await fetchAuthorProfile(username);
  if (!author) notFound();

  const [articles, popular] = await Promise.all([
    fetchBlogArticles({
      q: "",
      category: "",
      tag: "",
      author: author.username,
      sort: "latest",
      featured: false,
      page,
    }),
    fetchBlogArticles({
      q: "",
      category: "",
      tag: "",
      author: author.username,
      sort: "popular",
      featured: false,
      page: 1,
      limit: 3,
    }),
  ]);

  const follow = session?.backendToken
    ? await fetchFollowState(author.username, session.backendToken)
    : { following: false };
  const isSelf =
    !!session?.user?.username && session.user.username.toLowerCase() === author.username.toLowerCase();

  const socials = (
    [
      { kind: "website", value: author.website, Icon: Globe },
      { kind: "twitter", value: author.twitter, Icon: AtSign },
      { kind: "github", value: author.github, Icon: Link2 },
      { kind: "linkedin", value: author.linkedin, Icon: Link2 },
    ] as const
  ).filter((s) => s.value);

  const stats = [
    { Icon: BookOpen, value: formatCount(author.postCount), label: author.postCount === 1 ? "article" : "articles" },
    { Icon: Users, value: formatCount(author.followerCount), label: author.followerCount === 1 ? "follower" : "followers" },
    { Icon: Eye, value: formatCount(author.totalViews), label: "total reads" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <AuthorJsonLd author={author} />

      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
          <li>
            <Link href="/" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-zinc-900 dark:text-zinc-100">
            @{author.username}
          </li>
        </ol>
      </nav>

      <header className="mt-6 overflow-hidden rounded-3xl border border-zinc-200/70 dark:border-zinc-800/70">
        {author.coverUrl ? (
          <div className="relative h-36 sm:h-48">
            <Image
              src={author.coverUrl}
              alt=""
              fill
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="object-cover"
            />
          </div>
        ) : (
          <div
            aria-hidden
            className="h-24 bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-300 sm:h-32 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800"
          />
        )}
        <div className="bg-white px-5 pb-6 dark:bg-zinc-950 sm:px-8">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4 sm:-mt-12">
            <Avatar
              name={author.displayName}
              src={author.avatarUrl}
              size="xl"
              className="h-20 w-20 text-2xl ring-4 ring-white sm:h-24 sm:w-24 dark:ring-zinc-950"
            />
            {!isSelf && (
              <FollowButton
                username={author.username}
                displayName={author.displayName}
                initialFollowing={follow.following}
                initialFollowerCount={author.followerCount}
              />
            )}
          </div>
          <h1 className="headline mt-4 text-3xl sm:text-4xl">{author.displayName}</h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">@{author.username}</p>
          {author.bio && (
            <p className="mt-3 max-w-2xl leading-relaxed text-zinc-600 dark:text-zinc-300">
              {author.bio}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            {author.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden />
                {author.location}
              </span>
            )}
            {author.joinedAt && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" aria-hidden />
                Joined{" "}
                {new Date(author.joinedAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
            {socials.map(({ kind, value, Icon }) => (
              <a
                key={kind}
                href={socialUrl(kind, value as string)}
                target="_blank"
                rel="noopener noreferrer me"
                className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <Icon className="h-4 w-4" aria-hidden />
                {socialLabel(kind, value as string)}
              </a>
            ))}
          </div>
          <dl className="mt-6 grid max-w-lg grid-cols-3 gap-4 border-t border-zinc-200/70 pt-5 dark:border-zinc-800/70">
            {stats.map(({ Icon, value, label }) => (
              <div key={label}>
                <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                </dt>
                <dd className="headline mt-1 text-2xl">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {popular?.items && popular.items.length > 0 && (
        <section aria-labelledby="popular-heading" className="mt-14">
          <h2 id="popular-heading" className="headline text-2xl">
            Most read
          </h2>
          <div className="mt-6">
            <PostGrid articles={popular.items} />
          </div>
        </section>
      )}

      <section aria-labelledby="articles-heading" className="mt-14">
        <h2 id="articles-heading" className="headline text-2xl">
          Published articles
        </h2>
        {articles === null ? (
          <div className="mt-6">
            <ErrorState
              title="Couldn't load articles"
              description="This author's feed is temporarily unavailable."
            />
          </div>
        ) : articles.items.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<BookOpen className="h-5 w-5" aria-hidden />}
              title="No stories yet"
              description={`${author.displayName} hasn't published anything so far.`}
            />
          </div>
        ) : (
          <>
            <div className="mt-6">
              <PostGrid articles={articles.items} />
            </div>
            <BlogPagination
              page={articles.page}
              totalPages={Math.max(1, Math.ceil(articles.total / BLOG_PAGE_SIZE))}
            />
          </>
        )}
      </section>
    </div>
  );
}
