import { Button, Rail, Text } from "@/components/ui";
import type { HobbyData } from "@/types/user";
import { useTranslations } from "next-intl";

interface Props {
  hobby: HobbyData;
  onClick?: () => void;
}

export const HobbyItem = ({ hobby, onClick }: Props) => {
  const t = useTranslations("common");
  return (
    <div className="flex items-center gap-4">
      <Rail className="text-txt-muted h-10" />
      <div className="grid w-full grid-cols-[1fr_auto] items-center gap-3">
        <div className="flex min-w-0 flex-col">
          <Text>{hobby.title}</Text>
          {hobby.description && (
            <Text tone="muted" size="sm" truncate>
              {hobby.description}
            </Text>
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
