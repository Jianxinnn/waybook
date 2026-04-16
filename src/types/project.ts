export interface ProjectRegistryEntry {
  projectKey: string;
  label?: string;
  repoRoots?: string[];
}

export interface ProjectRegistry {
  projects: ProjectRegistryEntry[];
}
