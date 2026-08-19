import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button, Rail, Text, UrlItem } from "@/components/ui";
import type { Project } from "@/types/user";

interface Props {
  project: Project;
  onClick?: () => void;
}

export const ProjectItem = ({ project, onClick }: Props) => {
  const t = useTranslations("common");
  return (
    <div className="flex flex-col gap-3">
      {project.imageUrl && (
        <div className="bg-surface-100 relative aspect-video w-full overflow-hidden rounded-sm">
          <Image
            src={project.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex items-start gap-4">
        <Rail className="text-txt-muted mt-1 h-10" />
        <div className="grid w-full grid-cols-[1fr_auto] items-start gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <Text>{project.title}</Text>
            {project.bio && (
              <Text tone="muted" size="sm">
                {project.bio}
              </Text>
            )}
            {(project.websiteUrl || project.githubUrl) && (
              <div className="mt-1 flex flex-wrap gap-4">
                {project.websiteUrl && <UrlItem url={project.websiteUrl} />}
                {project.githubUrl && <UrlItem url={project.githubUrl} />}
              </div>
            )}
          </div>
          {onClick && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={onClick}
            >
              {t("editButton")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
