import type { TemplateModule } from "./types.js";
import featureSection from "./feature-section/index.js";

/** Registry of available layout templates, keyed by name. */
export const templates: Record<string, TemplateModule> = {
  [featureSection.name]: featureSection,
};

export function getTemplate(name: string): TemplateModule {
  const tpl = templates[name];
  if (!tpl) {
    const known = Object.keys(templates).join(", ");
    throw new Error(`Unknown template "${name}". Available: ${known}`);
  }
  return tpl;
}

export function listTemplates(): TemplateModule[] {
  return Object.values(templates);
}
