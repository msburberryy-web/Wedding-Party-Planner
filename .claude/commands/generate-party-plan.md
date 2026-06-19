# /generate-party-plan

You are a wedding party planner assistant for **Amore Wedding Tokyo**. Your task is to create a complete wedding party plan — a JSON plan file plus a downloadable Excel sheet — from the client information provided.

---

## Step 1 — Gather client information

Extract from the user's message, or ask if missing:

| Field | Example |
|---|---|
| Groom full name | Tint Htoo Aung |
| Groom nickname | Louis |
| Bride full name | Ei Phyu Win |
| Bride nickname | Ei |
| Wedding date | 2026-06-21 |
| Venue name | Hotel Bell Classic Tokyo |
| Reception start time | 17:00 |
| Reception end time | 19:30 |
| Guest count | 90 |
| Language | en / ja / my |
| Staff coordinator name | (coordinator's name) |
| MC name | (MC's name) |
| Photographers/VTR info | snapshot / commemorative / VTR names |
| Special requests | cultural customs, specific moments |

---

## Step 2 — Build the activity list

Use the established Amore Wedding Tokyo reception flow as the base. Adapt timing and activities to fit `startTime` → `endTime`. All durations must sum correctly.

### Standard reception flow (adjust as needed):

**Prep activities** (isPrep: true, calculated backward from startTime):
- Venue reception setup check (15 min)
- Group photo setup (10 min)
- Chapel / ceremony photo (15 min)
- MC briefing (10 min)
- Wait / final check (5 min)

**Main reception flow** (starting at startTime):
1. Guest arrival / venue open (reception hall opens, guests seated) — 20 min
2. Bridal party entrance (grand entrance with BGM) — 5 min
3. Opening remarks / greeting (MC welcome) — 5 min
4. Kanpai / toast — 5 min
5. Dinner start / meal service — 15 min
6. Wedding cake cutting — 10 min
7. Guest mingling / table visit — 15 min
8. Video message / VTR screening (if applicable) — 5 min
9. Guest speeches (2–3 speakers) — 15 min
10. Musical performance or entertainment — 10 min
11. Bouquet toss or anniversary dance (if applicable) — 10 min
12. Letter reading / parent gifts — 10 min
13. Final words from couple — 5 min
14. Closing remarks by MC — 5 min
15. Send-off / exit — 10 min

Adjust, add, or remove items based on client's special requests.

---

## Step 3 — Populate all fields per activity

For **each activity**, populate:

```json
{
  "id": "unique-id",
  "name": "English name",
  "nameJa": "日本語名",
  "nameMy": "မြန်မာဘာသာ (if applicable)",
  "duration": 10,
  "location": "2F Banquet Hall",
  "coordinationNotes": "English coordination note for the planner",
  "coordinationNotesJa": "日本語での進行メモ",
  "bgm": "Song Title - Artist (if applicable)",
  "needsMic": false,
  "onStage": false,
  "isPrep": false,
  "staffNotes": {
    "mc": "MC cue or attention note",
    "photo": "Photographer position or shot note",
    "lighting": "Lighting cue note"
  }
}
```

**Rules:**
- `coordinationNotesJa` should be a natural Japanese translation/adaptation of the English notes, written for a Japanese-speaking coordinator
- `staffNotes` only needed for visually/logistically critical moments (entrance, cake cutting, send-off, speech, etc.) — not every activity
- `location` must reflect the real venue floor (e.g., "2F Chapel", "1F Lobby", "Banquet Hall", "Garden")
- `bgm` only for activities with specific music cues
- `needsMic: true` for MC, speeches, toast
- `onStage: true` for couple moments at the stage/altar

---

## Step 4 — Write the JSON plan file

Save to: `public/client plans/YYYY-MM-DD-[GroomNickname][BrideNickname].json`

Use this top-level structure:

```json
{
  "metadata": {
    "date": "YYYY-MM-DD",
    "venue": "Venue Name",
    "groomName": "Full Name",
    "groomNickname": "Nickname",
    "groomFurigana": "フリガナ (if known)",
    "brideName": "Full Name",
    "brideNickname": "Nickname",
    "brideFurigana": "フリガナ (if known)",
    "guestCount": 90,
    "staffName": "Coordinator Name",
    "mcName": "MC Name",
    "photographers": {
      "postHairMakeup": true,
      "commemorative": "Photographer names",
      "snapshot": "Snapshot photographer",
      "vtr": "Video team"
    },
    "extras": {}
  },
  "language": "en",
  "startTime": "17:00",
  "totalTime": 150,
  "activities": [ ... ]
}
```

`totalTime` = sum of all non-prep activity durations.

---

## Step 5 — Generate the Excel

After writing the JSON file, run:

```bash
node generate-excel.cjs --plan="public/client plans/YYYY-MM-DD-[GroomNickname][BrideNickname].json"
```

Then send the generated `.xlsx` file to the user.

---

## Step 6 — Commit and push

```bash
git add "public/client plans/YYYY-MM-DD-[GroomNickname][BrideNickname].json"
git commit -m "Add party plan for [GroomNickname] & [BrideNickname] — [Date]"
git push
```

---

## Notes

- Always use MS P Mincho font in Excel (already handled by generator)
- The Excel column layout is: A-B = 時間, C = 進行, D = 場所, E-G = 内容, H-I = BGM, J = スタッフ
- Prep activities appear at the top in grey italic; main activities follow
- The plan JSON lives in `public/client plans/` so it's accessible in the web app at the deployed GitHub Pages URL
- If the user uploads a handwritten sheet or venue notes image, read it and incorporate the notes into `coordinationNotes` and `coordinationNotesJa` fields before generating
