# Design changes

Proposed changes to the Savvy admin dashboard design. Not released yet.

## 2026-11-15

- **Clearer image names.** A stream shows its host twice, each as an image on a background: the **Live game host avatar** (background + image) and the **Hero card** (background + image). "Stream image background" is now **Live game host avatar background**; "Host picture" is now **Live game host avatar image**.
- **Backgrounds on the game set, images on the host.** A game set keeps both backgrounds (up to five each). A host keeps up to five live game host avatar images and five hero card images, one of each selected for new streams; a stream's Change menu lists all of them.
- **Images on a stream's page.** A new Images section shows all four. Each has **Change**: pick another of the game set's backgrounds (or the host's image), **Upload for this stream** (only this stream changes, not the game set or host), or edit the game set / host in a side sheet. The trial bake previews both results.
- **Reward sets.** A new page under Library › Gameplay. A reward set is everything a stream pays: each round's Round Pounder, the showdown prize, participation, host buster and stumper rewards, and raffle winners. There can be several; a game set picks one (like its scoring preset); a stream can pick another or change its own copy ("Custom"), and reset to its game set's.
- **Words and rewards apart.** A stream's Words section has only words and times; everything paid is in one Rewards section. Word sets were already words only.
- **Square avatar background, colours and gradients.** The live game host avatar background is square (1024 × 1024) and can be a colour or gradient: 12 presets, and **+** adds a custom one (solid or gradient, two colours, direction), kept with the presets for everyone; custom ones can be removed. On a game set they join its backgrounds; on a stream, Change › Colour or gradient sets it for that stream only.
- **Images layout.** On a stream, each picture (live game host avatar, hero card) shows on the left and its background and image controls on the right.
- **Power-ups per game set.** Picked on the game set (and changeable per stream, in a Power-ups section), no longer on the game mode. A game mode is now its title and logo.

## 2026-11-13

- **Edit in Game sets opens a side sheet.** On a stream's page it no longer leaves for another page: like Edit in Hosts, the game set opens in a side sheet with all of it (name, stream image background, who can join, scoring, game, share cards, notifications) and Cancel / Save. The game set's own page shows the same parts.
- **Stream image background belongs to the game set.** The 900 × 1200 image behind the stream's screen moved from Hosts to Game sets: up to five per game set, and the selected one goes on its new streams. A stream's page shows it at the top of When & title and can switch to another of its game set's backgrounds. Hosts keep only Host picture and Hero card image.
- **One card style in Library.** Game sets, Scoring, Notifications, Share cards and Seasons use the same cards as the other library pages. Make default and Use in app are in the item's side sheet, not on the card.
- **No repeated labels.** A section title isn't repeated by a field label right under it.

## 2026-11-12

- **Menu: Library › Gameplay.** Game sets, Word sets, Scoring, Game modes and Power-ups sit together under Library › Gameplay.
- **Yellow letter points in every game mode.** Shown and editable for SubText too, and no longer reset to zero.
- **Smoother side menu.** Opening and closing the menu animates smoothly; the game mode logos no longer slow the page down.

## Before

- **Game sets.** A game set is what a new stream starts from: who can join (Public or Internal, and Super Savvy only), the showdown and its prize, rewards and messaging. There are three: Cash game · Super Savvy Showdown, Sparks game · Savvy Showdown, Cash game · Savvy Showdown.
- **Who can join comes from the game set.** New stream and Create event don't ask. A stream can still change its own.
- **Game sets have no host or sponsor.** Both are picked on the stream, or for a whole series in Create event.
- **New page: Word sets.** Word sets have their own page under Library › Gameplay. Each set says which game mode it's for (TextChain or SubText); picking it on a stream sets the stream's game mode.
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

- **Hero image generator — trial.** On a stream's page (When & title) the host's picture is cut out in the browser and placed on the game set's stream image background. Preview only, nothing is saved; waiting for a decision. If it stays: save the result as the stream's image (in production, made on the server once per background and host).
