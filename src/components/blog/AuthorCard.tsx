import Link from "next/link";
import { Avatar } from "@/src/components/ui/Avatar";
import type { PopularAuthor } from "@/src/store/api/contentApi";

/**
 * Author spotlight card: avatar, name, bio, output + follower stats.
 * Avatar and name link to the public profile at /author/[username].
 */
export function AuthorCard({ author }: { author: PopularAuthor }) {
  const name = author.displayName || author.user?.name || author.username;
  return (
    <article className="flex flex-col items-center rounded-2xl border border-zinc-200/70 bg-white p-6 text-center transition-all duration-200 hover:border-zinc-300 hover:shadow-soft dark:border-zinc-800/70 dark:bg-zinc-950 dark:hover:border-zinc-700">
      <Link
        href={`/author/${author.username}`}
        aria-label={`View ${name}'s profile`}
        className="flex flex-col items-center rounded-xl transition-opacity hover:opacity-85"
      >
        <Avatar name={name} src={author.avatarUrl ?? author.user?.image} size="xl" />
        <h3 className="headline mt-4 text-lg text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100">
          {name}
        </h3>
      </Link>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">@{author.username}</p>
      {author.bio && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {author.bio}
        </p>
      )}
      <p className="mt-4 flex items-center gap-4 border-t border-zinc-100 pt-4 text-sm text-zinc-500 dark:border-zinc-900 dark:text-zinc-400">
        <span>
          <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{author.postCount}</strong>{" "}
          {author.postCount === 1 ? "article" : "articles"}
        </span>
        <span aria-hidden>·</span>
        <span>
          <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{author.followerCount}</strong>{" "}
          followers
        </span>
      </p>
    </article>
  );
}
