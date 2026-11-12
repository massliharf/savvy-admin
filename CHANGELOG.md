# Design changes

Proposed changes to the Savvy admin dashboard design. Not released yet.

- **Game sets.** A game set is what a new stream starts from: who can join (Public or Internal, and Super Savvy only), the showdown and its prize, rewards and messaging. There are three: Cash game · Super Savvy Showdown, Sparks game · Savvy Showdown, Cash game · Savvy Showdown.
- **Who can join comes from the game set.** New stream and Create event don't ask. A stream can still change its own.
- **Game sets have no host or sponsor.** Both are picked on the stream, or for a whole series in Create event.
- **New page: Word sets.** Word sets have their own page under Streams. Each set says which game mode it's for (TextChain or SubText); picking it on a stream sets the stream's game mode.
- **New page: Scoring.** Points per round are scoring presets, like share card and notification presets: add and save them, make one the Default, pick one per game set (like its share cards and notifications), and change it on a stream's Scoring.
- **Game modes: title, logo and power-ups.** One card each for Savvy TextChain and Savvy SubText; each picks the power-ups its How to play shows.
- **New page: Power-ups.** Icon, name and what it does, edited once and picked by the game modes.
- **The game mode comes with the word set.** TextChain or SubText is the stream's word set's; picking another set changes it. Every stream view (calendar, list, cards) shows its game mode logo and its word set, which picks another set right there (upcoming and live streams; ended ones keep theirs).
- **A word set is its words and its game mode.** No logo, filter, rewards or showdown prize; rewards and the prize come from the stream's game set.
- **Time slots are simpler:** time, days, host, and who can join. No game mode.
- **Create event replaces Fill month and time slots.** One stream on a date and time, with its game set, host and sponsor; or Recurring, on the picked weekdays (M T W T F S S) until an end date; or Month, any days picked on a calendar (across months, past days greyed out). It opens as a centered dialog; a summary card spells out how many streams, on which days, at what time and between which dates, and Create stays disabled until there's something to add. Streams are added even when another one is at the same time.
- **Game set messaging shows the library's presets.** Pick one per kind, or open a preset in a side sheet to edit it there.
- **Unsaved changes ask before leaving.** On pages and when closing a side sheet.

## To do

- **Hero image generator:** not built yet.
