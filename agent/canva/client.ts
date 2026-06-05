import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { REPO_ROOT } from "../brand.js";
import { pngSize } from "../util/png-size.js";

/**
 * Thin client for the Canva Connect API. `fetchImpl` is injectable so the
 * orchestration (autofill → poll → export → poll → download) can be tested offline.
 *
 * NOTE: the live endpoints require a Canva Connect app (OAuth) and, for Brand
 * Templates, a Canva Teams/Enterprise plan. The async-job envelopes are parsed
 * defensively (`body.job ?? body`) since Canva wraps job responses in a `job` object.
 */

const BASE = "https://api.canva.com/rest/v1";
type FetchImpl = typeof fetch;

export type AutofillData = Record<
  string,
  { type: "text"; text: string } | { type: "image"; asset_id: string }
>;

interface JobLike {
  id?: string;
  status?: string;
  error?: { message?: string; error_code?: string };
  result?: { design?: { id?: string; url?: string } };
  design?: { id?: string; url?: string };
  design_id?: string;
  asset?: { id?: string };
  asset_id?: string;
  urls?: (string | { url?: string })[];
}

function job(body: unknown): JobLike {
  const b = body as { job?: JobLike } & JobLike;
  return b.job ?? b;
}

export class CanvaClient {
  constructor(
    private accessToken: string,
    private fetchImpl: FetchImpl = fetch,
    private pollIntervalMs = 1500,
    private maxPolls = 40,
  ) {}

  private async req(method: string, path: string, body?: unknown, extraHeaders?: Record<string, string>) {
    const res = await this.fetchImpl(`${BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...(body !== undefined && !extraHeaders ? { "Content-Type": "application/json" } : {}),
        ...extraHeaders,
      },
      body: body === undefined ? undefined : extraHeaders ? (body as BodyInit) : JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Canva ${method} ${path} → ${res.status}: ${detail.slice(0, 300)}`);
    }
    return res.json();
  }

  private async poll(get: () => Promise<JobLike>): Promise<JobLike> {
    for (let i = 0; i < this.maxPolls; i++) {
      const j = await get();
      if (j.status === "success") return j;
      if (j.status === "failed") {
        throw new Error(`Canva job failed: ${j.error?.message ?? j.error?.error_code ?? "unknown"}`);
      }
      await new Promise((r) => setTimeout(r, this.pollIntervalMs));
    }
    throw new Error("Canva job timed out");
  }

  /** Discover the named data fields a brand template expects. */
  async getBrandTemplateDataset(brandTemplateId: string): Promise<Record<string, { type: string }>> {
    const body = (await this.req("GET", `/brand-templates/${brandTemplateId}/dataset`)) as {
      dataset?: Record<string, { type: string }>;
    };
    return body.dataset ?? {};
  }

  async createAutofill(brandTemplateId: string, data: AutofillData, title?: string): Promise<JobLike> {
    return job(await this.req("POST", "/autofills", { brand_template_id: brandTemplateId, title, data }));
  }
  async getAutofill(jobId: string): Promise<JobLike> {
    return job(await this.req("GET", `/autofills/${jobId}`));
  }

  async createExport(designId: string, fileType = "png"): Promise<JobLike> {
    return job(await this.req("POST", "/exports", { design_id: designId, format: { type: fileType } }));
  }
  async getExport(exportId: string): Promise<JobLike> {
    return job(await this.req("GET", `/exports/${exportId}`));
  }

  async createAssetUpload(bytes: Buffer, name: string): Promise<JobLike> {
    const meta = Buffer.from(JSON.stringify({ name_base64: Buffer.from(name).toString("base64") })).toString("base64");
    return job(
      await this.req("POST", "/asset-uploads", bytes, {
        "Content-Type": "application/octet-stream",
        "Asset-Upload-Metadata": meta,
      }),
    );
  }
  async getAssetUpload(jobId: string): Promise<JobLike> {
    return job(await this.req("GET", `/asset-uploads/${jobId}`));
  }

  private firstUrl(j: JobLike): string {
    const first = j.urls?.[0];
    const url = typeof first === "string" ? first : first?.url;
    if (!url) throw new Error("Canva export produced no download URL");
    return url;
  }

  private designId(j: JobLike): string {
    const id = j.result?.design?.id ?? j.design?.id ?? j.design_id;
    if (!id) throw new Error("Canva autofill produced no design id");
    return id;
  }

  /** High-level: autofill a brand template with data and export the first page to a PNG on disk. */
  async autofillToPng(args: {
    brandTemplateId: string;
    data: AutofillData;
    outPath: string;
    title?: string;
  }): Promise<{ outPath: string; width: number; height: number; designId: string }> {
    const autofillJob = await this.createAutofill(args.brandTemplateId, args.data, args.title);
    if (!autofillJob.id) throw new Error("Canva autofill job has no id");
    const doneFill = await this.poll(() => this.getAutofill(autofillJob.id!));
    const designId = this.designId(doneFill);

    const exportJob = await this.createExport(designId, "png");
    if (!exportJob.id) throw new Error("Canva export job has no id");
    const doneExport = await this.poll(() => this.getExport(exportJob.id!));

    const url = this.firstUrl(doneExport);
    const res = await this.fetchImpl(url);
    if (!res.ok) throw new Error(`Canva asset download ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());

    const outPath = isAbsolute(args.outPath) ? args.outPath : resolve(REPO_ROOT, args.outPath);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, buffer);
    const size = pngSize(buffer) ?? { width: 0, height: 0 };
    return { outPath, width: size.width, height: size.height, designId };
  }

  /** Upload a local image as a Canva asset and return its asset id (handoff step 1). */
  async uploadAsset(bytes: Buffer, name: string): Promise<string> {
    const up = await this.createAssetUpload(bytes, name);
    if (!up.id) throw new Error("Canva asset-upload job has no id");
    const done = await this.poll(() => this.getAssetUpload(up.id!));
    const assetId = done.asset?.id ?? done.asset_id;
    if (!assetId) throw new Error("Canva asset upload produced no asset id");
    return assetId;
  }
}
