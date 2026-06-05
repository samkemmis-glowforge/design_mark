import { readFile } from "node:fs/promises";
import { basename, isAbsolute, resolve } from "node:path";
import { REPO_ROOT } from "../brand.js";
import { CanvaClient, type AutofillData } from "../canva/client.js";
import { getCanvaAccessToken } from "../canva/tokens.js";

/**
 * Agent-facing Canva operations. These require a connected Canva integration
 * (`npm run canva:auth`) and, for brand templates, a Canva Teams/Enterprise plan.
 */

async function client(): Promise<CanvaClient> {
  return new CanvaClient(await getCanvaAccessToken());
}

export interface CanvaTemplateInput {
  brandTemplateId: string;
  /** field name -> text value (image fields aren't auto-uploaded here yet). */
  fields: Record<string, string>;
  outPath?: string;
  title?: string;
}

/** Autofill a Canva Brand Template with text fields and export it to a PNG. */
export async function renderCanvaTemplate(input: CanvaTemplateInput) {
  const data: AutofillData = {};
  for (const [k, v] of Object.entries(input.fields)) {
    data[k] = { type: "text", text: v };
  }
  const outPath = input.outPath ?? `output/canva-${input.brandTemplateId}-${Date.now()}.png`;
  const c = await client();
  return c.autofillToPng({ brandTemplateId: input.brandTemplateId, data, outPath, title: input.title });
}

/** Inspect which fields a brand template expects (so the agent can fill them correctly). */
export async function getCanvaTemplateFields(brandTemplateId: string) {
  const c = await client();
  return c.getBrandTemplateDataset(brandTemplateId);
}

/** Push a finished local asset into the user's Canva uploads for hand-tweaking. */
export async function handoffToCanva(path: string): Promise<{ assetId: string; name: string }> {
  const abs = isAbsolute(path) ? path : resolve(REPO_ROOT, path);
  const bytes = await readFile(abs);
  const name = basename(abs);
  const c = await client();
  const assetId = await c.uploadAsset(bytes, name);
  return { assetId, name };
}
