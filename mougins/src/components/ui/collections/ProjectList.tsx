"use client";

import type { Project } from "@/types/user";
import { ProjectItem } from "../items/ProjectItem";

interface Props {
  projects: Project[];
  onEdit?: (index: number) => void;
}

export const ProjectList = ({ projects, onEdit }: Props) => {
  return (
    <ul className="flex flex-col gap-6">
      {projects.map((project, i) => (
        <li key={i}>
          <ProjectItem
            project={project}
            onClick={onEdit ? () => onEdit(i) : undefined}
          />
        </li>
      ))}
    </ul>
  );
};
