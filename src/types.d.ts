import { HasagiCoreEvents, LCUEndpointResponseType } from "@hasagi/core";
import ChampSelectSession from "./classes/champ-select-session.js";

declare namespace Hasagi {
    export type Events = {
        "ready": () => void;
        "connection-state-change": (state: boolean) => void;

        "gameflow-session-update": (session: GameflowSession | null) => void;
        "gameflow-phase-update": (phase: GameflowPhase) => void;

        "champ-select-session-update": (session: ChampSelectSession | null) => void;
        "champ-select-phase-update": (phase: ReturnType<ChampSelectSession["getPhase"]> | null) => void;
        "champ-select-local-player-pick-turn": (actionId: number) => void;
        "champ-select-local-player-pick-completed": (championId: number) => void;
        "champ-select-local-player-ban-turn": (actionId: number) => void;
        "champ-select-local-player-ban-completed": (championId: number) => void;
        "champ-select-pick-intent-change": (puuid: string, championIntent: number) => void;

        "rune-pages-update": (runePages: RunePage[]) => void;

        "lobby-update": (lobby: Lobby | null) => void;

        "queue-state-update": (queueState: QueueState | null) => void;

        "end-of-game-data-received": (data: EndOfGameData) => void;
    } & HasagiCoreEvents

    export type GameflowSession = LCUEndpointResponseType<"get", "/lol-gameflow/v1/session">;
    export type GameflowPhase = GameflowSession["phase"];

    export type RunePage = LCUEndpointResponseType<"get", "/lol-perks/v1/pages/{id}">;

    export type Lobby = LCUEndpointResponseType<"get", "/lol-lobby/v2/lobby">;

    export type QueueState = LCUEndpointResponseType<"get", "/lol-matchmaking/v1/search">;

    export type EndOfGameData = LCUEndpointResponseType<"get", "/lol-end-of-game/v1/eog-stats-block">;
    export type EndOfGameMasteryData = LCUEndpointResponseType<"get", "/lol-end-of-game/v1/champion-mastery-updates">;
}

export default Hasagi;