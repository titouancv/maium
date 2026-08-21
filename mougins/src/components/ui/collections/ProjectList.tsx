"use client";

import type { Project } from "@/types/user";
import { ProjectItem } from "../items/ProjectItem";

interface Props {
  projects: Project[];
}

export const ProjectList = ({ projects }: Props) => {
  return (
    <div className="@container w-full">
      <ul className="grid grid-cols-1 gap-14 md:gap-8 @2xl:grid-cols-2">
        {projects.map((project, i) => (
          <li key={i}>
            <ProjectItem project={project} />
          </li>
        ))}
      </ul>
    </div>
  );
};
