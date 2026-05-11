# Keeping the Reference page fresh

The Reference page is the only part of the site whose content drifts with upstream PSRCHIVE. Hand-copying the full manual would rot within months. The approach here is **one machine-refreshed file + hand-authored prose around it**.

## Architecture

```
site/data/commands.json          ← the single data file the page renders from
tools/scrape_help.py             ← parses `<command> --help` into the JSON
.github/workflows/refresh-docs.yml  ← runs the scraper monthly inside a PSRCHIVE container, opens a PR
```

- `site/data/commands.json` is checked into the repo. The page just `fetch()`-es it at runtime — no build step.
- For each command, two kinds of fields live side-by-side:
  - **machine-refreshed** — `usage`, `flags`, `help_raw`, `help_available`. The scraper overwrites these.
  - **hand-authored** — `desc`, `long`, `examples`, `related`. The scraper preserves these untouched.

## How a refresh runs

1. **GitHub Action** (`.github/workflows/refresh-docs.yml`) triggers on the 1st of each month or via the Actions tab.
2. It boots a container with PSRCHIVE installed (currently `stevertaylor/docker-psrchive:latest` — swap if you maintain your own).
3. `python3 tools/scrape_help.py` runs each command with `-h` / `--help`, parses `Usage:` and the flag table out of the output, and rewrites only those fields in `commands.json`. The hand-authored prose, examples, and related links are kept verbatim.
4. `peter-evans/create-pull-request` opens a PR with the diff. You review and merge.

## Why a PR and not a direct push?

PSRCHIVE's `--help` text isn't uniform across commands or releases. The parser is forgiving but not perfect — a new release could change a flag format and produce a misleading diff. A PR puts a human in the loop without blocking everything else.

If the parser does regress, **edit `tools/scrape_help.py`** — never edit the JSON directly to "fix" something the parser got wrong, because the next refresh will undo it.

## Adding a new command

Add a new entry to `site/data/commands.json` with at minimum:

```json
{
  "name": "newcmd",
  "cat": "plot",
  "desc": "one-line summary",
  "long": "a paragraph",
  "examples": [{ "t": "Common case", "c": "newcmd file.ar" }],
  "related": ["psrplot"]
}
```

The next scrape will fill in `usage` and `flags` automatically.

## Credits

Every command card on the Reference page links back to its upstream manual page at `psrchive.sourceforge.net/manuals/<command>/`, and the page footer carries the PSRCHIVE version + last-scraped date pulled from `commands.json`'s `_meta` block.

In the site footer (TODO), credit:
- PSRCHIVE — © Willem van Straten, Aidan Hotan, the PSRCHIVE collaboration. License: GPL.
- Sample archives — see `plots/README.md` for per-archive provenance.
- Tutorial content (this site) — your own attribution / license.

## Doing it without a PSRCHIVE install

If you ever need to run the scraper somewhere without a real install, point it at the upstream **manuals** instead by writing a small alternative scraper that pulls HTML from `psrchive.sourceforge.net/manuals/<name>/` and parses the flag table out of the page. The schema is the same; only the data source changes. Live `--help` is preferred because it matches the version you actually built against; the manuals occasionally lag.
