import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as url from "url";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const DRY_RUN = !!process.env.DRY_RUN;
const GIT_SHA = process.env.GITHUB_SHA || "";
const GIT_BRANCH = process.env.GITHUB_REF_NAME || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

const repoRoot = path.dirname(path.dirname(url.fileURLToPath(import.meta.url)));
const includeDirs = [
  "docs",
  "bmad-core/agents",
  "bmad-core/templates",
  "bmad-core/tasks",
  "bmad-core/workflows",
  "bmad-core/checklists",
  "bmad-core/data",
];
const allowedExts = new Set([".md", ".markdown", ".yml", ".yaml"]);

type FileRec = { path: string; title: string; content: string; checksum: string; tags: string[]; agent?: string | null };
const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const titleFrom = (p: string) => path.basename(p).replace(/\.(md|markdown|yml|yaml)$/i, "").replace(/[-_]/g," ").trim();
const tagsFor = (p: string) => {
  const t: string[] = [];
  if (p.startsWith("docs/")) t.push("docs");
  if (p.startsWith("bmad-core/")) t.push("bmad-core");
  if (p.includes("/templates/")) t.push("template");
  if (p.includes("/agents/")) t.push("agent");
  if (p.includes("/workflows/")) t.push("workflow");
  if (p.includes("/tasks/")) t.push("task");
  if (p.includes("/checklists/")) t.push("checklist");
  if (p.includes("/data/")) t.push("data");
  return t;
};
const agentFor = (p: string) => p.includes("/agents/partner") ? "partner" : p.includes("/agents/dev") ? "dev" : null;

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (allowedExts.has(path.extname(full).toLowerCase())) out.push(full);
  }
  return out;
}

async function readTracked(): Promise<FileRec[]> {
  const files: string[] = [];
  for (const d of includeDirs) files.push(...walk(path.join(repoRoot, d)));
  return files.map((full) => {
    const rel = path.relative(repoRoot, full).replace(/\\/g, "/");
    const content = fs.readFileSync(full, "utf-8");
    return { path: rel, title: titleFrom(rel), content, checksum: sha256(content), tags: tagsFor(rel), agent: agentFor(rel) };
  });
}

async function existingDocs(): Promise<Record<string, { id: string; checksum: string; deleted: boolean }>> {
  const map: Record<string, { id: string; checksum: string; deleted: boolean }> = {};
  const { data, error } = await supabase.from("documents").select("id,path,checksum,deleted").limit(10000);
  if (error) throw error;
  for (const row of data ?? []) map[row.path] = { id: row.id, checksum: row.checksum, deleted: row.deleted };
  return map;
}

async function upsert(rec: FileRec, prev?: { id: string; checksum: string; deleted: boolean }) {
  if (prev && prev.checksum === rec.checksum && !prev.deleted) return { action: "noop" as const, id: prev.id };
  if (DRY_RUN) return { action: prev ? "update" as const : "create" as const, id: prev?.id || "" };

  if (prev) {
    const { data, error } = await supabase.from("documents")
      .update({ title: rec.title, content: rec.content, checksum: rec.checksum, tags: rec.tags, agent: rec.agent, deleted: false })
      .eq("id", prev.id).select("id").single();
    if (error) throw error;
    await supabase.from("document_revisions").insert({ document_id: data.id, checksum: rec.checksum, content: rec.content, commit_sha: GIT_SHA, branch: GIT_BRANCH, action: "update" });
    return { action: "update" as const, id: data.id };
  } else {
    const { data, error } = await supabase.from("documents")
      .insert({ path: rec.path, title: rec.title, content: rec.content, checksum: rec.checksum, tags: rec.tags, agent: rec.agent, deleted: false })
      .select("id").single();
    if (error) throw error;
    await supabase.from("document_revisions").insert({ document_id: data.id, checksum: rec.checksum, content: rec.content, commit_sha: GIT_SHA, branch: GIT_BRANCH, action: "create" });
    return { action: "create" as const, id: data.id };
  }
}

async function markDeleted(id: string) {
  if (DRY_RUN) return { action: "delete" as const, id };
  const { error } = await supabase.from("documents").update({ deleted: true }).eq("id", id);
  if (error) throw error;
  await supabase.from("document_revisions").insert({ document_id: id, checksum: "deleted", content: "", commit_sha: GIT_SHA, branch: GIT_BRANCH, action: "delete" });
  return { action: "delete" as const, id };
}

(async () => {
  const files = await readTracked();
  const prev = await existingDocs();
  const seen = new Set<string>();
  let created = 0, updated = 0, deleted = 0, noop = 0;

  for (const rec of files) {
    seen.add(rec.path);
    const res = await upsert(rec, prev[rec.path]);
    if (res.action === "create") created++;
    else if (res.action === "update") updated++;
    else noop++;
  }

  for (const [p, info] of Object.entries(prev)) {
    if (!seen.has(p) && !info.deleted) {
      const res = await markDeleted(info.id);
      if (res.action === "delete") deleted++;
    }
  }

  console.log(JSON.stringify({ created, updated, deleted, unchanged: noop, total_files: files.length }, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
