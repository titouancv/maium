"use client";

import type { Project } from "@/types/user";
import { ProjectItem } from "../items/ProjectItem";

interface Props {
  projects: Project[];
  onEdit?: (index: number) => void;
}

export const ProjectList = ({ projects, onEdit }: Props) => {
  return (
    <div className="@container w-full">
      <ul className="grid grid-cols-1 gap-6 @2xl:grid-cols-2">
        {projects.map((project, i) => (
          <li key={i}>
            <ProjectItem
              project={project}
              onClick={onEdit ? () => onEdit(i) : undefined}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};
