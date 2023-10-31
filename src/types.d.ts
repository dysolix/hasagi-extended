import { HasagiEvents as HasagiCoreEvents, LCUEndpointResponseType } from "@hasagi/core";

declare namespace Hasagi {
    export namespace DataSources {
        export namespace DataDragon {
            export type Champion = {
                version: string;
                id: string;
                /** Number-like string */
                key: string;
                name: string;
                title: string;
                blurb: string;
                info: Champion.ChampionInfo;
                image: ImageData;
                tags: Champion.ChampionTag[];
                partype: Champion.ChampionPartype;
                stats: Champion.ChampionStats;
                skins: Champion.SkinData[];
                lore: string;
                allytips: string[];
                enemytips: string[];
                spells: Champion.ChampionAbility[];
                passive: {
                    name: string,
                    description: string,
                    image: ImageData
                };
                recommended: unknown[];
            };

            export namespace Champion {
                export type ChampionAbility = {
                    id: string;
                    name: string;
                    description: string;
                    tooltip: string;
                    leveltip: {
                        label: string[],
                        effect: string[]
                    };
                    maxrank: number;
                    cooldown: number[];
                    cooldownBurn: string;
                    cost: number[];
                    costBurn: string;
                    datavalues: unknown;
                    effect: (number[] | null)[];
                    effectBurn: (string | null)[];
                    vars: unknown[];
                    costType: string;
                    maxammo: string;
                    range: number[];
                    rangeBurn: string;
                    image: ImageData;
                    resource: string;
                }

                export type SkinData = {
                    id: string,
                    num: number,
                    name: string,
                    chromas: boolean
                }

                export type ChampionInfo = {
                    attack: number;
                    defense: number;
                    magic: number;
                    difficulty: number;
                };

                export type ChampionPartype = "None" | "Mana" | "Energy" | "Blood Well" | "Fury" | "Ferocity" | "Heat" | "Grit" | "Crimson Rush" | "Flow" | "Shield";

                export type ChampionStats = {
                    hp: number;
                    hpperlevel: number;
                    mp: number;
                    mpperlevel: number;
                    movespeed: number;
                    armor: number;
                    armorperlevel: number;
                    spellblock: number;
                    spellblockperlevel: number;
                    attackrange: number;
                    hpregen: number;
                    hpregenperlevel: number;
                    mpregen: number;
                    mpregenperlevel: number;
                    crit: number;
                    critperlevel: number;
                    attackdamage: number;
                    attackdamageperlevel: number;
                    attackspeedperlevel: number;
                    attackspeed: number;
                };

                export type ChampionTag = "Fighter" | "Tank" | "Mage" | "Assassin" | "Support" | "Marksman";
            }

            export type Item = {
                name: string;
                description: string;
                colloq: string;
                plaintext: string;
                into: string[];
                image: ImageData;
                gold: {
                    base: number;
                    purchasable: boolean;
                    total: number;
                    sell: number;
                };
                tags: string[];
                maps: {
                    [key: string]: boolean;
                };
                stats: {
                    FlatMovementSpeedMod: number;
                };
            };

            export type SummonerSpell = {
                id: string;
                name: string;
                description: string;
                tooltip: string;
                maxrank: number;
                cooldown: number[];
                cooldownBurn: string;
                cost: number[];
                costBurn: string;
                datavalues: {};
                effect: number[][];
                effectBurn: string[];
                vars: any[];
                key: string;
                summonerLevel: number;
                modes: string[];
                costType: string;
                maxammo: string;
                range: number[];
                rangeBurn: string;
                image: ImageData;
                resource: string;
            };

            export type Rune = {
                id: number;
                key: string;
                icon: string;
                name: string;
                shortDesc: string;
                longDesc: string;
            };

            export type RuneTree = {
                id: number;
                key: string;
                icon: string;
                name: string;
                slots: RuneSlot[];
            };

            export type RuneSlot = {
                runes: Rune[];
            };

            export interface Realm {
                //TODO
            }
        }

        export namespace GameConstants {
            export type GameMap = {
                mapId: number;
                mapName: string;
                notes: string;
            };

            export type GameMode = {
                gameMode: string;
                description: string;
            };

            export type GameQueue = {
                queueId: number;
                map: string;
                description: string;
                notes: string;
            };

            export type GameType = {
                gameType: string;
                description: string;
            };
        }

        export namespace MerakiAnalytics {
            export interface Champion {
                id: number
                key: string
                name: string
                title: string
                fullName: string
                icon: string
                resource: Champion.Resource
                attackType: Champion.AttackType
                adaptiveType: Champion.AdaptiveType
                stats: Champion.Stats
                roles: Champion.Role[]
                attributeRatings: Champion.AttributeRatings
                abilities: Champion.Abilities
                releaseDate: string
                releasePatch: string
                patchLastChanged: string
                price: Champion.Price
                lore: string
                faction: Champion.Faction
                skins: Skin[]
            }

            export namespace Champion {
                export type Resource =
                    | 'BLOOD_WELL'
                    | 'MANA'
                    | 'ENERGY'
                    | 'NONE'
                    | 'HEALTH'
                    | 'RAGE'
                    | 'COURAGE'
                    | 'SHIELD'
                    | 'FURY'
                    | 'FEROCITY'
                    | 'HEAT'
                    | 'GRIT'
                    | 'BLOODTHIRST'
                    | 'FLOW'
                    | 'SOUL_UNBOUND';

                export type Role =
                    | 'FIGHTER'
                    | 'JUGGERNAUT'
                    | 'TANK'
                    | 'ASSASSIN'
                    | 'BURST'
                    | 'MAGE'
                    | 'MARKSMAN'
                    | 'SUPPORT'
                    | 'VANGUARD'
                    | 'BATTLEMAGE'
                    | 'SPECIALIST'
                    | 'CATCHER'
                    | 'SKIRMISHER'
                    | 'WARDEN'
                    | 'DIVER'
                    | 'ENCHANTER'
                    | 'ARTILLERY';

                export type Faction =
                    | 'unaffiliated'
                    | 'ionia'
                    | 'shurima'
                    | 'freljord'
                    | 'mount-targon'
                    | 'void'
                    | 'zaun'
                    | 'piltover'
                    | 'noxus'
                    | 'bandle-city'
                    | 'shadow-isles'
                    | 'demacia'
                    | 'bilgewater'
                    | 'ixtal';

                export type AttackType = 'MELEE' | 'RANGED';

                export type AdaptiveType = 'PHYSICAL_DAMAGE' | 'MAGIC_DAMAGE';

                export interface Stat {
                    flat: number;
                    percent: number;
                    perLevel: number;
                    percentPerLevel: number;
                }

                export interface Stats {
                    health: Stat;
                    healthRegen: Stat;
                    mana: Stat;
                    manaRegen: Stat;
                    armor: Stat;
                    magicResistance: Stat;
                    attackDamage: Stat;
                    movespeed: Stat;
                    acquisitionRadius: Stat;
                    selectionRadius: Stat;
                    pathingRadius: Stat;
                    gameplayRadius: Stat;
                    criticalStrikeDamage: Stat;
                    criticalStrikeDamageModifier: Stat;
                    attackSpeed: Stat;
                    attackSpeedRatio: Stat;
                    attackCastTime: Stat;
                    attackTotalTime: Stat;
                    attackDelayOffset: Stat;
                    attackRange: Stat;
                    aramDamageTaken: Stat;
                    aramDamageDealt: Stat;
                    aramHealing: Stat;
                    aramShielding: Stat;
                    urfDamageTaken: Stat;
                    urfDamageDealt: Stat;
                    urfHealing: Stat;
                    urfShielding: Stat;
                }

                export interface AttributeRatings {
                    damage: number;
                    toughness: number;
                    control: number;
                    mobility: number;
                    utility: number;
                    abilityReliance: number;
                    attack: number;
                    defense: number;
                    magic: number;
                    difficulty: number;
                }

                export interface Abilities {
                    P?: AbilityDetail[];
                    Q?: AbilityDetail[];
                    W?: AbilityDetail[];
                    E?: AbilityDetail[];
                    R?: AbilityDetail[];
                }

                export interface AbilityDetail {
                    name: string;
                    icon: string;
                    effects: AbilityEffect[];
                    cost: null;
                    cooldown: AbilityCooldown;
                    targeting: string;
                    affects: string;
                    spellshieldable: string;
                    resource: null;
                    damageType: string;
                    spellEffects: string;
                    projectile: null;
                    onHitEffects: null;
                    occurrence: null;
                    notes: string;
                    blurb: string;
                    missileSpeed: null;
                    rechargeRate: null;
                    collisionRadius: null;
                    tetherRadius: null;
                    onTargetCdStatic: null;
                    innerRadius: null;
                    speed: string;
                    width: string;
                    angle: null;
                    castTime: string;
                    effectRadius: null;
                    targetRange: null;
                }

                export interface AbilityEffect {
                    description: string;
                    leveling: AbilityEffectLeveling[];
                }

                export interface AbilityEffectLeveling {
                    attribute: string;
                    modifiers: AbilityModifier[];
                }

                export interface AbilityModifier {
                    values: number[];
                    units: string[];
                }

                export interface AbilityCooldown {
                    modifiers: AbilityModifier[];
                    affectedByCdr: boolean;
                }

                export interface Price {
                    blueEssence: number;
                    rp: number;
                    saleRp: number;
                }
            }

            export interface Skin {
                name: string;
                id: number;
                isBase: boolean;
                availability: Skin.Availability;
                formatName: string;
                lootEligible: boolean;
                cost: number;
                sale: number;
                distribution: string | null;
                rarity: string;
                chromas: Skin.Chroma[];
                lore: string;
                release: string;
                set: string[];
                splashPath: string;
                uncenteredSplashPath: string;
                tilePath: string;
                loadScreenPath: string;
                loadScreenVintagePath: string | null;
                newEffects: boolean;
                newAnimations: boolean;
                newRecall: boolean;
                newVoice: boolean;
                newQuotes: boolean;
                voiceActor: string[];
                splashArtist: string[];
            }

            export namespace Skin {
                export interface Chroma {
                    name: string;
                    id: number;
                    chromaPath: string;
                    colors: string[];
                    descriptions: ChromaDescription[];
                    rarities: ChromaRarity[];
                }

                export interface ChromaDescription {
                    description: string | null;
                    region: string | null;
                }

                export interface ChromaRarity {
                    rarity: number;
                    region: string;
                }

                export type Rarity =
                    | "NoRarity"
                    | "Rare"
                    | "Epic"
                    | "Legendary"
                    | "Mythic"
                    | "Ultimate"

                export type Availability =
                    | 'Available'
                    | 'Rare'
                    | 'Limited'
                    | 'Legacy'
                    | 'Upcoming'
            }

            /** incomplete, wip */
            export interface Item {
                id: number;
                name: string;
                tier: number;
                rank: string[];
                buildsFrom: number[];
                buildsInto: number[];
                specialRecipe: number;
                noEffects: boolean;
                removed: boolean;
                requiredChampion: string;
                requiredAlly: string;
                icon: string;
                simpleDescription: string;
                nicknames: string[];
                passives: Item.PassiveEffect[];
                active: Item.ActiveAbility[];
                stats: Item.PassiveStats;
                shop: {
                    prices: Item.ShopPrices;
                    purchasable: boolean;
                    tags: string[];
                };
                iconOverlay: boolean;
                maps?: number[];
            }

            export namespace Item {
                export interface PassiveStats {
                    abilityPower: StatValues;
                    armor: StatValues;
                    armorPenetration: StatValues;
                    attackDamage: StatValues;
                    attackSpeed: StatValues;
                    cooldownReduction: StatValues;
                    criticalStrikeChance: StatValues;
                    goldPer_10: StatValues;
                    healAndShieldPower: StatValues;
                    health: StatValues;
                    healthRegen: StatValues;
                    lethality: StatValues;
                    lifesteal: StatValues;
                    magicPenetration: StatValues;
                    magicResistance: StatValues;
                    mana: StatValues;
                    manaRegen: StatValues;
                    movespeed: StatValues;
                    abilityHaste: StatValues;
                    omnivamp: StatValues;
                    tenacity: StatValues;
                }

                export interface StatValues {
                    flat: number;
                    percent: number;
                    perLevel: number;
                    percentPerLevel: number;
                    percentBase: number;
                    percentBonus: number;
                }

                export interface PassiveEffect {
                    unique: boolean;
                    mythic: boolean;
                    name: string;
                    effects: string | null;
                    range: number | null;
                    cooldown: number | null;
                    stats: PassiveStats;
                }

                export interface ActiveAbility {
                    unique: boolean;
                    name: string;
                    effects: string;
                    range: number | null;
                    cooldown: number | null;
                }

                export interface ShopPrices {
                    total: number;
                    combined: number;
                    sell: number;
                }
            }

            export interface Patches {
                patches: {
                    name: string;
                    start: number;
                    season: number;
                }[];
                shifts: { [key: string]: number }
            }
        }

        export namespace CommunityDragon {
            export interface Queue {
                id: number;
                name: string;
                shortName: string;
                description: string;
                detailedDescription: string;
            }

            export interface Rune {
                id: number;
                name: string;
                majorChangePatchVersion: string;
                tooltip: string;
                shortDesc: string;
                longDesc: string;
                recommendationDescriptor: string;
                iconPath: string;
                endOfGameStatDescs: string[];
                recommendationDescriptorAttributes: {
                    [key: string]: number;
                };
            }

            export interface RuneTrees {
                schemaVersion: number;
                /** The rune trees */
                styles: RuneTree[];
            }

            export interface RuneTree {
                id: number;
                name: string;
                tooltip: string;
                iconPath: string;
                assetMap: {
                    [key: string]: string;
                };
                isAdvanced: boolean;
                allowedSubStyles: number[];
                subStyleBonus: {
                    styleId: number;
                    perkId: number;
                }[];
                slots: {
                    type: string;
                    slotLabel: string;
                    perks: number[];
                }[];
                defaultPageName: string;
                defaultSubStyle: number;
                defaultPerks: number[];
                defaultPerksWhenSplashed: number[];
                defaultStatModsPerSubStyle: {
                    id: string;
                    perks: number[];
                }[];
            }
        }
    }

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
        "gameflow-session-update": (previous: LCUEndpointResponseType<"get", "/lol-gameflow/v1/session"> | null, now: LCUEndpointResponseType<"get", "/lol-gameflow/v1/session"> | null) => void;
        "gameflow-phase-update": (previous: LCUEndpointResponseType<"get", "/lol-gameflow/v1/gameflow-phase">, now: LCUEndpointResponseType<"get", "/lol-gameflow/v1/gameflow-phase">) => void;
        "champ-select-session-update": (previous: LCUEndpointResponseType<"get", "/lol-champ-select/v1/session"> | null, now: LCUEndpointResponseType<"get", "/lol-champ-select/v1/session"> | null) => void;
        "champ-select-phase-update": (previous: string | null, now: string | null) => void;
        "champ-select-local-player-pick-turn": (actionId: number) => void;
        "champ-select-local-player-pick-completed": (championId: number) => void;
        "champ-select-local-player-ban-turn": (actionId: number) => void;
        "champ-select-local-player-ban-completed": (championId: number) => void;
        "champ-select-pick-intent-change": (summonerId: number, previousChampionIntent: number, championIntent: number) => void;
        "rune-pages-update": (previous: LCUEndpointResponseType<"get", "/lol-perks/v1/pages"> | null, now: LCUEndpointResponseType<"get", "/lol-perks/v1/pages">) => void;
    } & HasagiCoreEvents

    export type GameflowSession = LCUEndpointResponseType<"get", "/lol-gameflow/v1/session">;
    export type GameflowPhase = GameflowSession["phase"];

    export type RunePage = LCUEndpointResponseType<"get", "/lol-perks/v1/pages/{id}">;
}

export default Hasagi;