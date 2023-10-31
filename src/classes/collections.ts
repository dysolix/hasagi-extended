import AbstractDataCollection from "./data-collection.js";
import Hasagi from "../types.js";

export class MerakiChampionCollection extends AbstractDataCollection<Hasagi.DataSources.MerakiAnalytics.Champion> {
    /**
     * @param identifier Can be the id, key, name or fullName
     */
    getChampion(identifier: string | number) {
        return this.entries.find(c => c.id == identifier || c.key == identifier || c.name == identifier || c.fullName == identifier) ?? null;
    }

    getChampionsByFaction(faction: Hasagi.DataSources.MerakiAnalytics.Champion.Faction) {
        return this.entries.filter(c => c.faction === faction);
    }

    /**
     * @param identifier Can be the id or name
     */
    getChampionBySkin(identifier: string | number) {
        return this.entries.find(c => c.skins.some(skin => skin.id == identifier || skin.name == identifier));
    }
}

export class MerakiItemCollection extends AbstractDataCollection<Hasagi.DataSources.MerakiAnalytics.Item> {
    /**
     * @param identifier Can be the name or id
     */
    getItem(identifier: string | number) {
        return this.entries.find(c => c.id == identifier || c.name == identifier) ?? null;
    }
}

export class CDragonQueueCollection extends AbstractDataCollection<Hasagi.DataSources.CommunityDragon.Queue> {
    /**
     * @param identifier Can be the name, id or shortName
     */
    getQueue(identifier: string | number) {
        return this.entries.find(c => c.id == identifier || c.shortName == identifier || c.name == identifier) ?? null;
    }
}

export class CDragonRuneCollection extends AbstractDataCollection<Hasagi.DataSources.CommunityDragon.Rune> {
    /**
     * @param identifier Can be the name or id 
     */
    getRune(identifier: string | number) {
        return this.entries.find(c => c.id == identifier || c.name == identifier) ?? null;
    }
}

export class CDragonRuneTreeCollection extends AbstractDataCollection<Hasagi.DataSources.CommunityDragon.RuneTree> {
    /**
     * @param identifier Can be the name, id
     */
    getRuneTree(identifier: string | number) {
        return this.entries.find(c => c.id == identifier || c.name == identifier) ?? null;
    }

    getRuneTreeByRuneId(id: number) {
        return this.entries.find(c => c.slots.some(slot => slot.perks.includes(id))) ?? null;
    }
}

export class DDragonChampionCollection extends AbstractDataCollection<Hasagi.DataSources.DataDragon.Champion> {
    /**
     * @param identifier Can be the name, id or key
     */
    getChampion(identifier: string | number) {
        return this.entries.find(c => c.id == identifier || c.key == identifier || c.name == identifier) ?? null;
    }
}

export class DDragonSummonerSpellCollection extends AbstractDataCollection<Hasagi.DataSources.DataDragon.SummonerSpell> {
    /**
     * @param identifier Can be the name, id or key
     */
    getSummonerSpell(identifier: string | number) {
        return this.entries.find(c => c.id == identifier || c.key == identifier || c.name == identifier) ?? null;
    }
}

export class DDragonRuneCollection extends AbstractDataCollection<Hasagi.DataSources.DataDragon.RuneTree> {
    /**
     * @param identifier Can be the name, id or key
     */
    getRuneTree(identifier: string | number) {
        return this.entries.find(c => c.id == identifier || c.key == identifier || c.name == identifier) ?? null;
    }

    /**
     * @param identifier Can be the name, id or key
     */
    getRune(identifier: string | number) {
        for (const runeTree of this.entries) {
            for (const runeSlot of runeTree.slots) {
                let rune = runeSlot.runes.find(c => c.id == identifier || c.key == identifier || c.name == identifier);
                if (rune !== undefined) return rune;
            }
        }

        return null;
    }

    /**
     * @param rune Can be the name, id, key or rune object 
     */
    getRuneTreeByRune(rune: Hasagi.DataSources.DataDragon.Rune | string | number) {
        if (typeof rune === "string" || typeof rune === "number") {
            let r = this.getRune(rune)
            if (r === null)
                return null;

            rune = r;
        }

        for (let runeTree of this.entries) {
            for (let runeSlot of runeTree.slots) {
                for (let r of runeSlot.runes) {
                    if (r.id === rune.id) {
                        return runeTree;
                    }
                }
            }
        }

        return null;
    }
}

export class GameConstantsQueueCollection extends AbstractDataCollection<Hasagi.DataSources.GameConstants.GameQueue> {
    getQueue(identifier: number) {
        return this.entries.find(c => c.queueId === identifier) ?? null;
    }

    getQueuesByMap(map: string) {
        return this.entries.filter(queue => queue.map === map)
    }
}

export class GameConstantsMapCollection extends AbstractDataCollection<Hasagi.DataSources.GameConstants.GameMap> {
    /**
     * @param identifier Can be the name or id
     */
    getMap(identifier: string | number) {
        return this.entries.find(c => c.mapId == identifier || c.mapName == identifier) ?? null;
    }
}