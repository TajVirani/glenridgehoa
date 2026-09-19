# Content guide for board members

Everything on the website that changes (news, meetings, documents, Section information) lives in five small text files. You edit them in your web browser on GitHub. You do not need to install anything.

## How to make a change

1. Sign in to GitHub and open this repository.
2. Go to the folder `site/content/` and click the file you need (see the table below).
3. Click the pencil icon (**Edit this file**).
4. Make your change. Copy an existing entry and change its text; that is the safest way to get the punctuation right.
5. Click **Commit changes…**, write a few words about what you changed ("Add November meeting"), and click **Commit changes**.

The website updates itself in about a minute.

| To change… | Edit this file |
| --- | --- |
| A news item | `news.json` |
| A meeting, agenda link or minutes link | `meetings.json` |
| A governing document, form or policy | `documents.json` |
| A Section's rules link or map boundary | `sections.json` |
| The board's email address or the Portal links | `site.json` |

## If GitHub emails you that something failed

Nothing is broken for homeowners. The website checks every change before publishing it; when a check fails, the site keeps showing the previous version.

It almost always means a punctuation slip in the file you just edited. Open the file again and look for:

- a missing or extra **comma**: every entry is followed by a comma *except the last one* in a list;
- a missing **quotation mark**: all text goes inside straight double quotes `"like this"`;
- a missing **brace or bracket**: every `{` needs a `}`, every `[` needs a `]`.

Fix it and commit again. If you cannot find it, email the site maintainer; the old version stays up in the meantime.

## Rules that apply to every file

- **Dates** are written year-month-day with dashes: `"2026-10-07"`.
- **Plain text only.** No formatting, no HTML, no links inside a sentence. If a news item needs more than one paragraph, see `news.json` below.
- **To use a quotation mark inside text**, put a backslash before it: `"The \"Fall Festival\" is back"`.
- Each file starts with a `"_note"` line explaining the file. Leave it there.
- Enter each fact once. The website works out the rest: you never need to mark a meeting as "past" or tell the home page what the next meeting is.

## Documents are links

The website does not store documents. It links to where they already live: the management company's **Portal**, or the board's Google Drive.

- In Google Drive, set sharing to **Anyone with the link can view** before you copy the link. This is the most common reason a document "doesn't work".
- If a homeowner must log in to the Portal to see the document, add `"portal": true` to its entry. The website will then say "Portal login required" next to the link.

## The files

### news.json

Newest item first. The home page shows the first three.

```json
{
  "date": "2026-09-14",
  "title": "Fall dues invoices mailed",
  "summary": "Annual assessments were mailed September 12 and are due October 31.",
  "tag": "Dues"
}
```

- `tag` is one word shown as a label: `Dues`, `Projects`, `Meetings`, `Rules`, `Events`.
- For more than one paragraph, add a `body` with one quoted paragraph per line:

```json
  "body": [
    "First paragraph.",
    "Second paragraph."
  ]
```

### meetings.json

One list holds every meeting, past and future, in any order. The website sorts them and decides which are upcoming by looking at the date.

```json
{
  "date": "2026-10-07",
  "time": "7:00 PM",
  "title": "Board meeting",
  "note": "Open to all homeowners. Agenda posted one week prior.",
  "agenda": "https://…",
  "minutes": "https://…"
}
```

- `date`, `time` and `title` are required. Everything else is optional.
- Before the meeting: add the `agenda` link when it is ready.
- After the meeting: add the `minutes` link. That is all; the meeting moves to the past list on its own.
- If the agenda and minutes need the Portal login, add `"portal": true` to that meeting.
- `location` at the top of the file applies to every meeting. To hold one meeting somewhere else, add a `location` line to that meeting.

### documents.json

Documents are arranged in groups; each group has a `title` and a list of `items`.

```json
{
  "title": "Bylaws",
  "desc": "How the association is run: board, meetings, voting, and dues.",
  "updated": "2023-11-15",
  "url": "https://…",
  "portal": true
}
```

- `title` and `url` are required. `updated` is the date of the document itself, not the day you added it.
- Leave out `"portal": true` for documents anyone can open.
- Section rules are not listed here. They come from `sections.json`.

### sections.json

One entry for each of the 8 Sections.

```json
{
  "id": 1,
  "name": "Section 1",
  "rules": "https://…",
  "polygon": [[39.578, -84.190], [39.578, -84.1855], [39.571, -84.1855], [39.571, -84.190]]
}
```

- `rules` is the link to that Section's rules, and follows the same rules as any Document link (add `"portal": true` if it needs the Portal login).
- `polygon` is the Section's boundary on the map, as latitude/longitude corners. Ask the site maintainer before changing it.

### site.json

```json
{
  "payUrl": "https://…",
  "requestUrl": "https://…",
  "email": "board@glenridgehomeowners.com"
}
```

- `payUrl` and `requestUrl` are the Portal pages for paying dues and submitting a request. They feed the buttons in the header of every page.
- `email` is shown in the footer and wherever the site asks homeowners to contact the board.
