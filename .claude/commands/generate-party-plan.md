# /generate-party-plan

You are a senior wedding coordinator assistant for **Amore Wedding Tokyo**. Your job is to generate a complete, production-ready wedding party plan — a JSON file and a downloadable Excel party plan sheet — tailored to the client.

---

## Step 1 — Gather client information

Extract from the user's message. Ask only for fields that are genuinely missing and can't be inferred:

| Field | Notes |
|---|---|
| Groom full name | e.g. Tint Htoo Aung |
| Groom nickname | used in filename and greetings |
| Bride full name | e.g. Ei Phyu Win |
| Bride nickname | used in filename |
| Wedding date | YYYY-MM-DD |
| Venue name | e.g. Hotel Bell Classic |
| Reception start time | when couple enters; typically 17:00 |
| Reception end time | typically 19:30 |
| Guest count | |
| Language | `en` / `ja` / `my` (Myanmar). Affects which fields show in Excel |
| Coordinator name | (Amore staff name, e.g. May) |
| MC name | e.g. Antt Minn |
| Photography team | snapshot, commemorative, VTR names |
| Special requests | cultural customs, games, entrance style, etc. |
| Any uploaded notes | handwritten sheets, venue notes — read and incorporate |

---

## Step 2 — Build the activity list

Use the **standard Amore Wedding Tokyo reception flow** below as the base. Adjust timing, names, and content to match the client's requests. All main activity durations must sum to `totalTime` (= endTime − startTime in minutes).

### Prep activities (isPrep: true, shown above the main timeline, times calculated backward from startTime)

These happen before the reception opens. List in reverse order — last prep first:

| Activity | Typical duration | Location | Notes |
|---|---|---|---|
| 入場待機 / Entrance Standby | 10 min | バックステージ / Backstage | MC does welcome speech warm-up. BGM standby. |
| MC準備・BGM確認 / MC & BGM Check | 30 min | 会場内 / Venue | 16:00 MC briefing, 16:30 BGM check. Confirm opening slideshow BGM. |
| チャペル撮影 / Chapel Photo | 20 min | チャペル / Chapel | Couple photo session in chapel before reception. |
| 集合写真 / Group Photo | 20 min | 2F | Family group photo. |
| ファーストミート / First Meet | 20 min | 控室 / Bridal Room | Video & photo team on standby. |
| ゲスト受付 / Guest Reception | 30 min | ロビー / Lobby | ①席次表 ②Finger Print ③ドレス色あてゲーム ④手紙を探す — adjust to client |

### Main reception flow (starting at startTime)

| # | Activity (JA) | Activity (EN) | Typical duration | Key notes |
|---|---|---|---|---|
| 1 | スライドショー上映 | Opening Slideshow | 5 min | Couple profile photo slideshow on screen before entrance |
| 2 | 新郎新婦入場 | Couple Entrance | 10 min | Sub-activities: 新郎一人入場 → 新婦入場 → お二人でバージンロード. BGM cue. Photo: capture door opening & walk |
| 3 | 指輪交換 | Ring Exchange | 5 min | In front of main table. MC officiates |
| 4 | 乾杯・ウェルカムスピーチ | Welcome Toast | 10 min | MC welcome speech → toast. needsMic: true |
| 5 | 食事スタート | Meal Service Start | 15 min | Free photo time during meal. No MC announcement needed |
| 6 | ケーキ入刀 | Cake Cutting | 10 min | Cake cutting → First Bite (groom small spoon / bride large spoon). Sub: Surprise (give cake to a guest chosen by MC) → First Kiss |
| 7 | 中座 | Couple Exit (Intermission) | 20 min | Flash light send-off by guests. MC announces. BGM cue. Spotlight effect. Sub: table round during exit |
| 8 | 映像上映 | VTR Screening | 3 min | Camera team shoots tables during screening. MC announces dress color game glow sticks |
| 9 | 再入場 | Re-entrance | 10 min | Laser show effect. From 2F staircase. BGM cue. Sub: Love Speech by couple at chairs |
| 10 | MCクイズゲーム | MC Quiz Game | 15 min | All guests stand. MC asks couple quiz questions. Guests raise right (groom) or left (bride) hand. Wrong = sit. Final 5 winners get prizes |
| 11 | クイズ結果・プレゼント | Quiz Winners & Prizes | 5 min | 5 winners → gift + photo with couple |
| 12 | テーブルラウンド撮影 | Table Round Photography | 15 min | Couple visits each table (~10 tables × 9 guests × 1 min). Photographer follows |
| 13 | 新郎手紙・お二人謝辞 | Letter & Closing Words | 10 min | Groom reads letter to family in native language. BGM backing music. Sub: couple's joint closing speech |
| 14 | フラワーシャワー | Flower Shower | 5 min | Distribute flowers to guests. Couple walks through flower shower on aisle. BGM cue |
| 15 | ブーケトス | Bouquet Toss | 5 min | MC gathers guests at staircase base. Party music |
| 16 | 全員集合写真 | Group Photo (All) | 10 min | All guests + couple + family. Photographer arranges positions |
| 17 | 新郎新婦ご退場 | Couple's Exit | 5 min | Couple exits together up staircase. Guests wave goodbye from below. MC announces letter pickup |
| 18 | ロビー送賓・プチギフト | Lobby Send-off & Gifts | 10 min | Couple stands at lobby entrance. Hands petit gift + wedding gift to each departing guest. Photographer captures farewell |

---

## Step 3 — Populate all fields per activity

For **each activity** in the JSON, fill in all applicable fields:

```json
{
  "id": "unique-kebab-id",
  "name": "English name",
  "nameJa": "日本語名（絵文字可）",
  "nameMy": "မြန်မာဘာသာ（if language = my）",
  "duration": 10,
  "location": "場所 e.g. 1Fドア / 2F / メインテーブルの前",
  "coordinationNotes": "English planner note",
  "coordinationNotesJa": "日本語での進行メモ（自然な日本語で）",
  "bgm": "Song Title (if specific music cue)",
  "needsMic": false,
  "onStage": false,
  "isPrep": false,
  "staffNotes": {
    "mc": "MC cue — only for key moments",
    "photo": "Photo/video position note — only for key moments",
    "lighting": "Lighting cue — only for key moments"
  },
  "subActivities": [
    {
      "id": "sub-id",
      "name": "Sub-step name",
      "nameJa": "日本語",
      "duration": 3,
      "startOffset": 0
    }
  ]
}
```

**Field rules:**
- `coordinationNotesJa` — Write in natural Japanese as a coordinator would read it. Include specific cues like `★ケーキを準備` or `BGMのタイミングで`. Mirror the detail level of your English note.
- `staffNotes` — Only for visually or logistically critical moments (entrances, cake, send-off, letter, quiz prizes). Skip for routine activities.
- `nameJa` — Match exactly what should appear in the Excel 進行 column. Include emoji where appropriate (e.g. `新郎新婦入場 🎭`, `乾杯 🎤 🎭`).
- `location` — Use Japanese floor/room name as it appears on venue signage.
- `bgm` — Only set if there's a specific song. Format: `"Song Title - Artist"` or just `"Song Title"`.
- `needsMic: true` — MC announcements, toasts, speeches.
- `onStage: true` — Couple moments at main table or stage.

**For MC Quiz games:** add the actual questions to `coordinationNotes` or as a separate `"extras"` field in metadata. Format:
```json
"extras": {
  "mcQuizQuestions": [
    { "question": "Who is the better cook?", "answer": "Groom", "direction": "R" },
    ...
  ]
}
```

---

## Step 4 — Write the JSON plan file

Save to:
```
public/client plans/YYYY-MM-DD-[GroomNickname][BrideNickname].json
```

Top-level structure:
```json
{
  "metadata": {
    "date": "YYYY-MM-DD",
    "venue": "Venue Name",
    "groomName": "Full Name",
    "groomNickname": "Nickname",
    "groomFurigana": "フリガナ（if known）",
    "brideName": "Full Name",
    "brideNickname": "Nickname",
    "brideFurigana": "フリガナ（if known）",
    "guestCount": 90,
    "staffName": "Coordinator Name",
    "mcName": "MC Name",
    "photographers": {
      "postHairMakeup": true,
      "commemorative": "Team name",
      "snapshot": "Team name",
      "vtr": "Team name"
    },
    "extras": {}
  },
  "language": "ja",
  "startTime": "17:00",
  "totalTime": 150,
  "activities": [ ...prep activities first, then main activities... ]
}
```

`totalTime` = sum of all **non-prep** activity durations only.

---

## Step 5 — Generate the Excel

After writing the JSON, run:
```bash
node generate-excel.cjs --plan="public/client plans/YYYY-MM-DD-[GroomNickname][BrideNickname].json"
```

The output file name is auto-generated as `Wedding_Plan_YYYYMMDD_[GroomNickname]_[BrideNickname].xlsx`.

Send the `.xlsx` file to the user.

---

## Step 6 — Commit and push

```bash
git add "public/client plans/YYYY-MM-DD-[GroomNickname][BrideNickname].json"
git commit -m "Add party plan: [GroomNickname] & [BrideNickname] — [Date] @ [Venue]"
git push -u origin <current-branch>
```

---

## Reference — Excel column layout

| Col | Header | Content |
|---|---|---|
| A–B | 時間 | startTime (merged) |
| C | 進行 | nameJa (or name if language=en) |
| D | 場所 | location |
| E–G | 内容 | coordinationNotesJa (or coordinationNotes) — merged |
| H–I | BGM | bgm with circled number ① ② … |
| J | スタッフ | staffNotes stacked: 🎤 mc / 📸 photo / 💡 lighting |

Prep activities appear at top in grey italic. Main activities follow in regular style.

---

## Tips for quality plans

- **Food timing note**: If the venue controls food service timing, add a note at the top of the sheet like `会場様の食事提供の時間に合わせる`.
- **Entrance sub-activities**: Always split couple entrance into 3 sub-steps: groom solo → bride solo → together on aisle. Use `startOffset` (minutes from parent start) for each.
- **Cake section**: Split into sub-activities: cutting → first bite → surprise gift to guest → first kiss.
- **Cultural notes**: If the couple has native language speeches or cultural elements, note the language in parentheses e.g. `ミャンマー語で` in `coordinationNotesJa`.
- **Quiz game**: Capture actual questions in `metadata.extras.mcQuizQuestions` so they can be printed separately or referenced during the event.
- **BGM**: Use circled numbers ① ② ③ in the plan notes to match the Excel's auto-numbered BGM counter.
