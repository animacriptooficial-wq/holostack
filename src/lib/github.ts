/* ============================================================
   GITHUB API CLIENT — cloud-native
   Commit e leitura de ficheiros diretamente na REST API do
   GitHub, sem binário git nem filesystem. Funciona na Vercel.
   Env: GITHUB_TOKEN, GITHUB_REPO (owner/repo), GITHUB_BRANCH
   ============================================================ */

const API = "https://api.github.com"

export interface GitHubConfig {
  token: string
  repo: string // "owner/repo"
  branch: string
}

export function githubConfig(): GitHubConfig | null {
  const token = (process.env.GITHUB_TOKEN || "").trim()
  const repo = (process.env.GITHUB_REPO || "").trim()
  if (!token || !repo.includes("/")) return null
  return { token, repo, branch: (process.env.GITHUB_BRANCH || "main").trim() }
}

function headers(cfg: GitHubConfig): Record<string, string> {
  return {
    Authorization: `Bearer ${cfg.token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  }
}

/* Commit atómico: blobs → tree → commit → update ref.
   Devolve o SHA do commit ou lança erro descritivo. */
export async function commitFilesToGitHub(
  cfg: GitHubConfig,
  baseDir: string,
  files: { path: string; content: string }[],
  message: string
): Promise<string> {
  const refRes = await fetch(
    `${API}/repos/${cfg.repo}/git/ref/heads/${cfg.branch}`,
    { headers: headers(cfg), cache: "no-store" }
  )
  if (!refRes.ok) {
    throw new Error(`GitHub ref falhou: HTTP ${refRes.status}`)
  }
  const refData = await refRes.json()
  const baseSha = refData?.object?.sha as string
  if (!baseSha) throw new Error("GitHub: SHA da branch não encontrado")

  const treeRes = await fetch(`${API}/repos/${cfg.repo}/git/trees`, {
    method: "POST",
    headers: headers(cfg),
    body: JSON.stringify({
      base_tree: baseSha,
      tree: files.map((f) => ({
        path: `${baseDir}/${f.path}`.replace(/\/+/g, "/"),
        mode: "100644",
        type: "blob",
        content: f.content,
      })),
    }),
  })
  if (!treeRes.ok) {
    const t = await treeRes.text()
    throw new Error(`GitHub tree falhou: HTTP ${treeRes.status} ${t.slice(0, 200)}`)
  }
  const treeData = await treeRes.json()

  const commitRes = await fetch(`${API}/repos/${cfg.repo}/git/commits`, {
    method: "POST",
    headers: headers(cfg),
    body: JSON.stringify({
      message,
      tree: treeData.sha,
      parents: [baseSha],
    }),
  })
  if (!commitRes.ok) {
    throw new Error(`GitHub commit falhou: HTTP ${commitRes.status}`)
  }
  const commitData = await commitRes.json()

  const updateRes = await fetch(
    `${API}/repos/${cfg.repo}/git/refs/heads/${cfg.branch}`,
    {
      method: "PATCH",
      headers: headers(cfg),
      body: JSON.stringify({ sha: commitData.sha }),
    }
  )
  if (!updateRes.ok) {
    throw new Error(`GitHub ref update falhou: HTTP ${updateRes.status}`)
  }
  return commitData.sha as string
}

/* Lê todos os ficheiros de texto de um diretório do repo via
   git/trees recursivo + contents raw. */
export async function readDirFromGitHub(
  cfg: GitHubConfig,
  dir: string
): Promise<{ path: string; content: string }[]> {
  const treeRes = await fetch(
    `${API}/repos/${cfg.repo}/git/trees/${encodeURIComponent(cfg.branch)}?recursive=1`,
    { headers: headers(cfg), cache: "no-store" }
  )
  if (!treeRes.ok) return []
  const treeData = await treeRes.json()
  const prefix = dir.replace(/\/+$/g, "") + "/"
  const blobs: string[] = (treeData.tree || [])
    .filter((e: { type: string; path: string }) => e.type === "blob" && e.path.startsWith(prefix))
    .map((e: { path: string }) => e.path)
    .slice(0, 60)

  const files: { path: string; content: string }[] = []
  for (const p of blobs) {
    const res = await fetch(`${API}/repos/${cfg.repo}/contents/${encodeURIComponent(p)}`, {
      headers: { ...headers(cfg), Accept: "application/vnd.github.raw" },
      cache: "no-store",
    })
    if (!res.ok) continue
    const content = await res.text()
    if (content.length > 512 * 1024) continue
    files.push({ path: p.slice(prefix.length), content })
  }
  return files
}
