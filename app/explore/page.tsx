import { redirect } from "next/navigation";

/** Legacy path — the explore feed lives at /blog now. */
export default function ExploreRedirect() {
  redirect("/blog");
}
