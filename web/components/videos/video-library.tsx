import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { VideoListItem } from "@/app/actions/video";

type VideoLibraryProps = {
  videos: VideoListItem[];
};

export function VideoLibrary({ videos }: VideoLibraryProps) {
  if (videos.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">No videos match</CardTitle>
          <CardDescription>
            Try clearing filters or add a new entry from the admin form.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <ul className="space-y-4">
      {videos.map((video) => (
        <li key={video.id}>
          <Card className="shadow-sm">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <CardTitle className="text-base font-semibold leading-snug">
                  {video.title}
                </CardTitle>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-sm font-semibold text-brand-blue hover:underline"
                >
                  Watch externally →
                </a>
              </div>
              {video.summary ? (
                <CardDescription className="text-sm leading-relaxed">
                  {video.summary}
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {video.categoryTags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <dl className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <div>
                  <dt className="font-medium text-foreground/80">Roles</dt>
                  <dd>
                    {video.targetRoles.length > 0
                      ? video.targetRoles.join(", ")
                      : "All roles"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground/80">Industries</dt>
                  <dd>
                    {video.targetIndustries.length > 0
                      ? video.targetIndustries.join(", ")
                      : "All industries"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground/80">Experience</dt>
                  <dd>
                    {video.experienceLevels.length > 0
                      ? video.experienceLevels.join(", ")
                      : "All levels"}
                  </dd>
                </div>
              </dl>
              {video.transcript ? (
                <details className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                  <summary className="cursor-pointer font-medium">
                    Notes / transcript excerpt
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                    {video.transcript}
                  </p>
                </details>
              ) : null}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
