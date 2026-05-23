import { Button } from "@/components/ui";
import type { HobbyData } from "../../form/sub-form/HobbySubForm";
import { useTranslations } from "next-intl";

interface Props {
  hobby: HobbyData;
  onClick?: () => void;
}

export const HobbyItem = ({ hobby, onClick }: Props) => {
  const t = useTranslations("common");
  return (
    <div className="flex items-center gap-4">
      <div className="h-10 w-1 rounded-full bg-current"></div>
      <div className="grid w-full grid-cols-[1fr_auto] items-center gap-3">
        <div className="flex min-w-0 flex-col">
          <p className="text-txt">{hobby.title}</p>
          {hobby.description && (
            <p className="text-txt-muted truncate text-sm">
              {hobby.description}
            </p>
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
  );
};
