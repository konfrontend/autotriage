# Issue tracker: GitHub Issues

Issues and specs for this repo live in GitHub Issues of `konfrontend/autotriage`. Use the `gh` CLI for every operation; run it from the repo root so it picks up the repo.

## Conventions

- A feature spec is an issue whose body holds the spec. Implementation tickets are sub-issues of that spec issue, one per ticket, numbered in the title (`01 <slug>`, `02 <slug>`, ...). Never combine several tickets in one issue.
- Triage state is a label on the issue (see `triage-labels.md`). The five triage labels exist in the repo; apply them, do not create new ones.
- Comments and conversation history go into issue comments, not into the body.
- Closed as done: `gh issue close <n> --reason completed`. Closed as not planned: `--reason "not planned"` plus the `wontfix` label.

## When a skill says "publish to the issue tracker"

`gh issue create --title "<title>" --body-file <file>`. For an implementation ticket, create it, then attach it to the spec issue as a sub-issue:

```bash
gh api repos/konfrontend/autotriage/issues/<spec-number>/sub_issues -X POST -F sub_issue_id=<ticket-issue-id>
```

`<ticket-issue-id>` is the issue's numeric `id` (`gh api repos/konfrontend/autotriage/issues/<n> --jq .id`), not its number. Report the returned issue number and URL to the user.

## When a skill says "fetch the relevant ticket"

`gh issue view <n> --comments`.

## PRs as a request surface

Off. Pull requests are not part of the triage queue for this repo.
