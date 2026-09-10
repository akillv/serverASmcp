# 14-Day ServerAsMcp Launch Calendar

This calendar assumes Day 1 is the day you finish assets, not necessarily the day you launch. Do not launch before the 60–90 second demo and repository metadata are complete.

## Day 1 — Lock positioning

**Goal:** Make the repository tell one story.

- [ ] Review `README.md`, `marketing/positioning.md`, and `marketing/launch/github-metadata.md`.
- [ ] Confirm the headline says agent-native deployment, not only root SSH access.
- [ ] Confirm SSH-key auth is the first quick-start option.
- [ ] Update GitHub description and topics from `github-metadata.md`.
- [ ] Change every package/repository URL to the canonical `akillv/serverASmcp` location.
- [ ] Commit and push documentation updates.

**Completion signal:** A visitor can answer “what is this, who is it for, and how do I try it?” in 30 seconds.

## Day 2 — Record proof

**Goal:** Produce the launch asset.

- [ ] Follow `marketing/demo-script-90-seconds.md`.
- [ ] Record a disposable-VPS deployment and self-heal sequence.
- [ ] Export MP4.
- [ ] Add captions.
- [ ] Cut a 30–45 second vertical version.
- [ ] Create a static screenshot showing the live URL and agent transcript.

**Completion signal:** You have a captioned 60–90 second MP4 and a vertical teaser.

## Day 3 — README conversion

**Goal:** Put proof above features.

- [ ] Add the demo MP4 or GIF near the top of the README.
- [ ] Keep the trust boundary immediately visible.
- [ ] Compress media to GitHub-friendly size.
- [ ] Test every anchor link.
- [ ] Verify all npm/PyPI commands.
- [ ] Publish the README update.

**Completion signal:** README shows outcome, proof, audience, quick start, and trust boundary.

## Day 4 — Build starter material

**Goal:** Reduce time to first success.

- [ ] Create a minimal starter repository or `examples/` app.
- [ ] Include a working `package.json` or equivalent.
- [ ] Document the exact MCP configuration without secrets.
- [ ] Document the exact one-prompt deploy request.
- [ ] Test it against a disposable VPS.
- [ ] Link it from the README.

**Completion signal:** A user can clone the starter and run one agent prompt.

## Day 5 — Directory and social metadata

**Goal:** Make the project discoverable and shareable.

- [ ] Update npm and PyPI descriptions to the canonical one-liner.
- [ ] Add repository topics.
- [ ] Prepare the social preview image.
- [ ] Prepare MCP directory listing copy.
- [ ] Submit to two MCP directories.
- [ ] Add the listing links to a private launch tracker.

**Completion signal:** Package pages and directories no longer lead only with a raw root-access hook.

## Day 6 — Soft launch

**Goal:** Test copy with a receptive technical audience.

- [ ] Post to r/mcp using the prepared post.
- [ ] Share the vertical demo on X.
- [ ] Share the same story on LinkedIn.
- [ ] Monitor replies for one hour in blocks.
- [ ] Record every objection or requested stack.

**Completion signal:** You have public feedback and at least one conversion signal: click, issue, star, fork, or download mention.

## Day 7 — Convert feedback

**Goal:** Remove friction found on Day 6.

- [ ] Add the three most common questions to the README.
- [ ] Fix broken or confusing documentation immediately.
- [ ] Update the demo description if viewers misunderstood the trust boundary.
- [ ] Open roadmap issues for requested guardrails and stack examples.
- [ ] Post a brief “thanks, here’s what I updated” reply.

**Completion signal:** Repeated questions now have repository answers.

## Day 8 — Broaden reach

**Goal:** Reach self-hosters and side-project builders.

- [ ] Post to r/selfhosted.
- [ ] Post to r/SideProject if appropriate.
- [ ] Share one concrete use case on X: “agent fixed the deployment after I stopped the service.”
- [ ] Submit to one relevant newsletter or aggregator if it accepts developer tools.
- [ ] Answer every comment with the same honest trust framing.

**Completion signal:** At least one non-MCP-native audience reacts to the deployment outcome.

## Day 9 — Developer credibility

**Goal:** Speak to the r/devops audience.

- [ ] Post to r/devops using the prepared post.
- [ ] Emphasize staging-first use and the unrestricted tradeoff.
- [ ] Ask which guardrails matter most.
- [ ] Turn technical replies into issue backlog entries.
- [ ] Avoid claiming production safety for untrusted agents.

**Completion signal:** You have specific technical feedback about trust, identity, or deployment workflow.

## Day 10 — Show HN

**Goal:** Launch to a high-signal technical audience.

- [ ] Submit using `marketing/launch/show-hn-draft.md`.
- [ ] Immediately post the first comment.
- [ ] Keep replies technical and concrete.
- [ ] Link to docs, not marketing hype.
- [ ] Ask for tool-boundary and guardrail feedback.

**Completion signal:** Show HN is live and the first comment explains the workflow and tradeoff.

## Day 11 — Hacker News follow-up

**Goal:** Convert attention into clarity.

- [ ] Respond to technical questions during morning and evening peaks.
- [ ] Do not argue; acknowledge the real risk and state the intended user.
- [ ] If guardrail requests dominate, post the roadmap order from `show-hn-draft.md`.
- [ ] Add the top HN objections to README or docs.
- [ ] Capture download, star, and traffic observations.

**Completion signal:** The most substantive HN objections are documented somewhere public or in the issue tracker.

## Day 12 — Stack-specific content

**Goal:** Answer “does it work with my app?”

- [ ] Publish a focused demo or guide for one stack: static site, Next.js, FastAPI, Docker Compose, or a database-backed app.
- [ ] Show the exact prompt.
- [ ] Show the exact verification.
- [ ] Link it from the README.
- [ ] Post the guide on X or LinkedIn.

**Completion signal:** One repeatable stack example is public.

## Day 13 — Community infrastructure

**Goal:** Make contribution and support easy.

- [ ] Verify issue templates and security policy on GitHub.
- [ ] Review open issues and label them.
- [ ] Create a public roadmap issue or section.
- [ ] Add “good first issue” labels for docs or examples.
- [ ] Pin an issue or discussion asking for deployment workflows to support first.

**Completion signal:** A newcomer can tell where to contribute.

## Day 14 — Review and decide the next release

**Goal:** Turn the launch into momentum.

- [ ] Review downloads, stars, forks, issues, PRs, and referring links.
- [ ] Identify the top requested stack.
- [ ] Identify the top requested guardrail.
- [ ] Choose the next release theme.
- [ ] Write a public roadmap update.
- [ ] Schedule the next 14-day cycle.

**Completion signal:** The next release is not speculative; it is based on launch feedback.

## Weekly ongoing loop

- [ ] Monitor npm, PyPI, GitHub, Reddit, X, LinkedIn, Hacker News, and MCP directories.
- [ ] Convert repeated questions into documentation.
- [ ] Ship a small release at least every two weeks when possible.
- [ ] Post a changelog-focused update for every release.
- [ ] Add one proof demo per major workflow.
- [ ] Track successful first deployments, not just stars.
