import { HasagiEvents as HasagiCoreEvents, LCUEndpointResponseType } from "@hasagi/core";
import ChampSelectSession from "./classes/champ-select-session.js";

declare namespace Hasagi {
    export namespace LiveClientAPI {
        export type LocalPlayerAbilities = {
            Passive: LiveClientPassiveAbility,
            Q: LiveClientAbility,
            W: LiveClientAbility,
            E: LiveClientAbility,
            R: LiveClientAbility,
        }

        export type LocalPlayer = {
            abilities: LocalPlayerAbilities;
            championStats: LiveClientChampionStats;
            currentGold: number;
            fullRunes: LocalPlayerRunes;
            level: number;
            summonerName: string;
        }

        export type LocalPlayerRunes = {
            keystone: LiveClientKeystone;
            primaryRuneTree: LiveClientRuneTree;
            secondaryRuneTree: LiveClientRuneTree;
            generalRunes: LiveClientRuneTree[];
            statRunes: LiveClientStatRune[];
        }

        export type LiveClientStatRune = {
            id: number;
            rawDescription: string;
        }


        export type LiveClientChampionStats = {
            abilityHaste: number;
            abilityPower: number;
            armor: number;
            armorPenetrationFlat: number;
            armorPenetrationPercent: number;
            attackDamage: number;
            attackRange: number;
            attackSpeed: number;
            bonusArmorPenetrationPercent: number;
            bonusMagicPenetrationPercent: number;
            cooldownReduction: number;
            critChance: number;
            critDamage: number;
            currentHealth: number;
            healthRegenRate: number;
            lifeSteal: number;
            magicLethality: number;
            magicPenetrationFlat: number;
            magicPenetrationPercent: number;
            magicResist: number;
            maxHealth: number;
            moveSpeed: number;
            physicalLethality: number;
            resourceMax: number;
            resourceRegenRate: number;
            resourceType: string;
            resourceValue: number;
            spellVamp: number;
            tenacity: number;
        }

        export type LiveClientRuneTree = {
            displayName: string;
            id: number;
            rawDescription: string;
            rawDisplayName: string;
        }

        export type LiveClientKeystone = {
            displayName: string;
            id: number;
            rawDescription: string;
            rawDisplayName: string;
        }

        export type GameStats = {
            gameMode: string;
            gameTime: number;
            mapName: string;
            mapNumber: number;
            mapTerrain: string;
        }

        export type Player = {
            championName: string;
            isBot: boolean;
            isDead: boolean;
            items: PlayerItem[];
            level: number;
            position: string;
            rawChampionName: string;
            respawnTimer: number;
            runes: PlayerMainRunes;
            scores: PlayerScores;
            skinID: number;
            summonerName: string;
            summonerSpells: PlayerSummonerSpells;
            team: string;
        }

        export type PlayerMainRunes = {
            keystone: LiveClientKeystone;
            primaryRuneTree: LiveClientRuneTree;
            secondaryRuneTree: LiveClientRuneTree;
        }

        export type PlayerSummonerSpells = {
            summonerSpellOne: LiveClientSummonerSpell;
            summonerSpellTwo: LiveClientSummonerSpell;
        }

        export type PlayerItem = {
            canUse: boolean;
            consumable: boolean;
            count: number;
            displayName: string;
            itemID: number;
            price: number;
            rawDescription: string;
            rawDisplayName: string;
            slot: number;
        }

        export type LiveClientPassiveAbility = {
            displayName: string;
            id: string;
            rawDescription: string;
            rawDisplayName: string;
        }

        export type LiveClientAbility = {
            abilityLevel: number;
            displayName: string;
            id: string;
            rawDescription: string;
            rawDisplayName: string;
        }

        export type PlayerScores = {
            assists: number;
            creepScore: number;
            deaths: number;
            kills: number;
            wardScore: number;
        }

        export type LiveClientSummonerSpell = {
            displayName: string;
            rawDescription: string;
            rawDisplayName: string;
        }

        export type AllGameData = {
            activePlayer: LocalPlayer,
            allPlayers: Player[],
            events: {
                Events: Event[]
            },
            gameData: GameStats
        }

        export type Event = LiveClientGameStartEvent | LiveClientMinionsSpawningEvent | LiveClientFirstBrickEvent | LiveClientTurretKilledEvent | LiveClientInhibKilledEvent | LiveClientDragonKillEvent | LiveClientHeraldKillEvent | LiveClientBaronKillEvent | LiveClientChampionKillEvent | LiveClientMultikillEvent | LiveClientAceEvent | LiveClientEventBase & { EventName: string, [key: string]: string | number }

        export type LiveClientEventBase = {
            EventID: number;
            EventTime: number;
        }

        export type LiveClientGameStartEvent = {
            EventName: "GameStart"
        } & LiveClientEventBase

        export type LiveClientMinionsSpawningEvent = {
            EventName: "MinionsSpawning"
        } & LiveClientEventBase

        export type LiveClientFirstBrickEvent = {
            EventName: "FirstBrick",
            KillerName: string
        } & LiveClientEventBase

        export type LiveClientTurretKilledEvent = {
            EventName: "TurretKilled"
            TurretKilled: string,
            KillerName: string,
            Assisters: string[]
        } & LiveClientEventBase

        export type LiveClientInhibKilledEvent = {
            EventName: "InhibKilled",
            InhibKilled: string,
            KillerName: string,
            Assisters: string[]
        } & LiveClientEventBase

        export type LiveClientDragonKillEvent = {
            EventName: "DragonKill",
            DragonType: string,
            Stolen: "False" | "True",
            KillerName: string,
            Assisters: string[]
        } & LiveClientEventBase

        export type LiveClientHeraldKillEvent = {
            EventName: "HeraldKill",
            Stolen: "False" | "True",
            KillerName: string,
            Assisters: string[]
        } & LiveClientEventBase

        export type LiveClientBaronKillEvent = {
            EventName: "BaronKill",
            Stolen: "False" | "True",
            KillerName: string,
            Assisters: string[]
        } & LiveClientEventBase

        export type LiveClientChampionKillEvent = {
            EventName: "ChampionKill",
            KillerName: string,
            VictimName: string,
            Assisters: string[]
        } & LiveClientEventBase

        export type LiveClientMultikillEvent = {
            EventName: "Multikill",
            KillerName: string,
            KillStreak: number
        } & LiveClientEventBase

        export type LiveClientAceEvent = {
            EventName: "Ace",
            Acer: string,
            AcingTeam: string
        } & LiveClientEventBase
    }

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
}

export default Hasagi;