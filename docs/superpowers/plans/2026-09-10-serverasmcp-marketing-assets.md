# ServerAsMcp Marketing Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce and publish the approved positioning, README hero, repo metadata, launch posts, Show HN draft, 90-second demo script, and 14-day marketing calendar.

**Architecture:** Keep reusable positioning in `marketing/`, make the repository README the conversion surface, and make launch/channel copy standalone enough to paste directly into GitHub, Reddit, LinkedIn, X, Hacker News, and MCP directories. The README update is the only repository-facing content change in this iteration.

**Tech Stack:** Markdown, GitHub community health files, existing MIT-licensed ServerAsMcp product.

**Spec:** `docs/superpowers/specs/2026-09-10-serverasmcp-marketing-positioning.md`

## Global Constraints

- Primary category: **agent-native deployment MCP**.
- Primary outcome: **from Git repository to verified live HTTPS production URL**.
- Primary audience: solo founders, indie hackers, AI-agent power users, self-hosters, and consultants.
- Do not market this as suitable for enterprises, zero-trust environments, multi-tenant platforms, or untrusted agents.
- Security language must say **deliberately unrestricted for single-operator environments**, not merely “unrestricted.”
- Use SSH-key authentication as the recommended configuration.
- Preserve the existing npm package name `serverasmcp` and runtime examples.
- All new files are Markdown; no application code changes.

---

### Task 1: Positioning and README Conversion Copy

**Files:**
- Create: `docs/superpowers/specs/2026-09-10-serverasmcp-marketing-positioning.md`
- Create: `marketing/positioning.md`
- Modify: `README.md`

**Interfaces:**
- Produces canonical product headline, description, audience, anti-audience, differentiation table, security framing, and GitHub description reused by all later assets.

- [ ] **Step 1: Write the positioning spec**

Create the source-of-truth positioning document with the approved category, outcome, audience, anti-audience, security framing, comparison, and README structure.

- [ ] **Step 2: Extract reusable launch positioning**

Create `marketing/positioning.md` containing paste-ready GitHub description, tagline options, one-liner, elevator pitch, feature proof points, comparison table, and metrics.

- [ ] **Step 3: Update the README front door**

Replace the current hero with the outcome-led headline and description, add “Who this is for,” “Who this is not for,” quick-start CTA, and move the security warning above the feature detail while keeping installation and tools intact.

- [ ] **Step 4: Verify README rendering**

Run:
```bash
sed -n '1,150p' README.md
```
Expected: no placeholder text, clear positioning, visible security warning, and runnable npx/uvx examples.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-09-10-serverasmcp-marketing-positioning.md marketing/positioning.md README.md
git commit -m "docs: sharpen agent deployment positioning"
```

### Task 2: Repository Metadata and Trust Assets

**Files:**
- Create: `marketing/launch/github-metadata.md`
- Create: `.github/ISSUE_TEMPLATE/bug-report.md`
- Create: `.github/ISSUE_TEMPLATE/feature-request.md`
- Create: `.github/ISSUE_TEMPLATE/config.yml`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Create: `CONTRIBUTING.md`
- Create: `CHANGELOG.md`
- Create: `SECURITY.md`

**Interfaces:**
- Consumes the canonical description and topics from Task 1.
- Produces complete paste-ready GitHub About metadata and standard community/trust files.

- [ ] **Step 1: Create GitHub metadata**

Add repository description, homepage placeholder-free repository URL, topics, README social-preview text guidance, and release announcement template.

- [ ] **Step 2: Add community templates**

Create bug report, feature request, issue chooser, pull request, and contributing templates with concrete prompts for MCP client, runtime, auth mode, server type, expected behavior, and logs.

- [ ] **Step 3: Add trust and release history**

Create a security policy distinguishing responsible disclosure from general support, a contributing workflow, and an initial Keep-a-Changelog entry covering releases through v0.4.6 without inventing dates.

- [ ] **Step 4: Verify assets**

Run:
```bash
find .github CONTRIBUTING.md CHANGELOG.md SECURITY.md marketing/launch/github-metadata.md -maxdepth 3 -type f -print
```
Expected: every listed file exists.

- [ ] **Step 5: Commit**

```bash
git add .github CONTRIBUTING.md CHANGELOG.md SECURITY.md marketing/launch/github-metadata.md
git commit -m "docs: add repository metadata and trust assets"
```

### Task 3: Channel Launch Copy

**Files:**
- Create: `marketing/launch/reddit-and-social-posts.md`
- Create: `marketing/launch/show-hn-draft.md`
- Create: `marketing/launch/mcp-directory-listing.md`

**Interfaces:**
- Consumes Task 1 positioning and Task 2 repository description.
- Produces channel-ready copy for Reddit, X, LinkedIn, Hacker News, and MCP directories.

- [ ] **Step 1: Write social and Reddit copy**

Create launch-safe Reddit posts, a short X thread, a LinkedIn post, and one-paragraph announcements. Each post must lead with the live-deployment outcome, include concrete workflow proof, state the security tradeoff, and invite feedback.

- [ ] **Step 2: Write the Show HN draft**

Create title options, a first-comment draft, launch checklist, likely objections, and replies for security, versus CI/CD, versus PaaS, and trust questions.

- [ ] **Step 3: Create directory listing**

Create a 100-word description, long description, categories, search keywords, install methods, supported clients, repository URL, and requirements.

- [ ] **Step 4: Verify copy quality**

Check every asset for: no unsubstantiated enterprise claims, no “safe for untrusted agents” language, one primary CTA, and a visible security warning.

- [ ] **Step 5: Commit**

```bash
git add marketing/launch/reddit-and-social-posts.md marketing/launch/show-hn-draft.md marketing/launch/mcp-directory-listing.md
git commit -m "docs: add launch and directory copy"
```

### Task 4: Demo Script and 14-Day Calendar

**Files:**
- Create: `marketing/demo-script-90-seconds.md`
- Create: `marketing/content-calendar-14-days.md`

**Interfaces:**
- Consumes canonical positioning and launch copy.
- Produces the recording script and dated publication checklist.

- [ ] **Step 1: Write the 90-second demo script**

Specify on-screen action, spoken line, and terminal beat for fresh server, MCP config, one-prompt deploy, DNS, failure injection, self-healing, and verified URL.

- [ ] **Step 2: Write the 14-day calendar**

Create day-by-day tasks covering README polish, media, starter material, directory submissions, Reddit/X/LinkedIn launches, Show HN, feedback capture, and follow-up content.

- [ ] **Step 3: Verify execution readiness**

Run:
```bash
grep -R "TBD\|TODO\|fill in later" marketing docs/superpowers/specs/2026-09-10-serverasmcp-marketing-positioning.md || true
```
Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add marketing/demo-script-90-seconds.md marketing/content-calendar-14-days.md
git commit -m "docs: add demo script and launch calendar"
```

### Task 5: Final Review

**Files:**
- Modify: only files requiring review fixes.

**Interfaces:**
- Consumes all created assets.
- Produces a release-ready marketing bundle.

- [ ] **Step 1: Check consistency**

Compare product name, GitHub description, README positioning, directory copy, launch posts, and calendar claims.

- [ ] **Step 2: Check security tone**

Confirm every launch-facing asset positions this for trusted single-operator use and recommends SSH keys.

- [ ] **Step 3: Check links and commands**

Validate all local links and ensure every shown command can be copied without replacing hidden values except intentionally user-specific domains, hosts, and credentials.

- [ ] **Step 4: Commit fixes if needed**

```bash
git add README.md marketing docs/superpowers/specs .github CONTRIBUTING.md CHANGELOG.md SECURITY.md
git commit -m "docs: finalize launch bundle"
```
