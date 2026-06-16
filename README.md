# @hasagi/extended

A higher-level League of Legends client API (LCU) library built on top of
[`@hasagi/core`](https://www.npmjs.com/package/@hasagi/core). It adds convenient, pre-typed helpers
for common workflows (champ select, lobby, runes, inventory, item sets, …) and a richer set of
semantic events on top of core's connection, request, polling and WebSocket primitives.

## Installation

```bash
npm install @hasagi/extended
```

## Quick start

```ts
import { HasagiClient } from "@hasagi/extended";

const client = new HasagiClient();
await client.connect();

// Everything from @hasagi/core is available (connect, request, poll, buildRequest, events, …)
const summoner = await client.request("get", "/lol-summoner/v1/current-summoner");

// Plus higher-level, pre-typed helpers:
const session = await client.ChampSelect.getSession();
const lobby = await client.Lobby.getLobby();
const runePages = await client.Runes.getRunePages();
```

## Helper namespaces

The client groups higher-level, fully-typed request builders under namespaces, including:

- **`ChampSelect`** — current session (as a `ChampSelectSession`), phase, and actions
- **`Lobby`** — lobby state and position preferences
- **`Runes`** — rune pages, the selected page, and disabled runes
- **`Inventory`** — owned / all champions and skins, cosmetics, loadouts
- **`ItemSets`** — read and update item sets for the local summoner

## Events

In addition to core's connection lifecycle (`connecting`, `connected`, `disconnected`,
`connection-attempt-failed`, `connection-state-change`, `ready`, `lcu-event`), the extended client
emits semantic events:

- **Champ select** — `champ-select-session-update`, `champ-select-phase-update`,
  `champ-select-pick-intent-change`, `champ-select-local-player-ban-turn`,
  `champ-select-local-player-pick-turn`, `champ-select-local-player-ban-completed`,
  `champ-select-local-player-pick-completed`
- **Runes** — `rune-pages-update`
- **Gameflow** — `gameflow-session-update`, `gameflow-phase-update`
- **Lobby / queue** — `lobby-update`, `queue-state-update`
- **End of game** — `end-of-game-data-received`

```ts
client.on("champ-select-phase-update", (phase) => console.log("phase:", phase));
client.on("gameflow-phase-update", (phase) => console.log("gameflow:", phase));
```

## Disclaimer

Hasagi is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or
anyone officially involved in producing or managing Riot Games properties. Riot Games and all
associated properties are trademarks or registered trademarks of Riot Games, Inc.
