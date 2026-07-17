import Link from "next/link";

import {
  listVideoFacetsAction,
  listVideosAction,
} from "@/app/actions/video";
import { Logo } from "@/components/landing/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VideoFilters } from "@/components/videos/video-filters";
import { VideoLibrary } from "@/components/videos/video-library";
import { requireUser } from "@/lib/auth/session";

type VideosPageProps = {
  searchParams: Promise<{
    category?: string;
    role?: string;
    industry?: string;
    experience?: string;
    q?: string;
  }>;
};

export default async function VideosPage({ searchParams }: VideosPageProps) {
  await requireUser();
  const params = await searchParams;

  const filters = {
    category: params.category?.trim() || undefined,
    role: params.role?.trim() || undefined,
    industry: params.industry?.trim() || undefined,
    experience: params.experience?.trim() || undefined,
    q: params.q?.trim() || undefined,
  };

  const [{ videos, seedHint }, facets] = await Promise.all([
    listVideosAction(filters),
    listVideoFacetsAction(),
  ]);

  return (
    <main className="min-h-screen bg-page px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Logo />
          <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
            <Link
              href="/videos/admin"
              className="text-brand-blue hover:underline"
            >
              Add video
            </Link>
            <Link href="/dashboard" className="text-brand-blue hover:underline">
              Back to dashboard
            </Link>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-extrabold tracking-tight">
                Interview video library
              </CardTitle>
              <CardDescription>
                Curated human-made interview prep videos (externally hosted).
                Not AI-generated content — links open public YouTube/Vimeo (or
                similar) placeholders for MVP.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Filter by category, role, industry, or experience level. Empty
                filter fields on a video mean it applies to all values on that
                dimension.
              </p>
              {seedHint ? (
                <p className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs">
                  {seedHint}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <VideoFilters
                value={filters}
                categories={facets.categories}
                roles={facets.roles}
                industries={facets.industries}
                experienceLevels={facets.experienceLevels}
              />
            </CardContent>
          </Card>

          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              {videos.length} video{videos.length === 1 ? "" : "s"}
            </p>
            <VideoLibrary videos={videos} />
          </div>
        </div>
      </div>
    </main>
  );
}
