import axios from "axios";
import { CDragonQueueCollection, CDragonRuneCollection, CDragonRuneTreeCollection, DDragonChampionCollection, DDragonRuneCollection, DDragonSummonerSpellCollection, GameConstantsMapCollection, GameConstantsQueueCollection, MerakiChampionCollection, MerakiItemCollection } from "./classes/collections.js";
import { LanguageCode, ServerRegion } from "./index.js"
import type Hasagi from "./types.js";

const dataLoaderAxios = axios.create({ adapter: "http" })

class MerakiAnalytics {
    public static async getChampions() {
        return await dataLoaderAxios.get("https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json").then(res => Object.values(res.data as Hasagi.DataSources.MerakiAnalytics.Champion[])).then(c => new MerakiChampionCollection(c.map(e => snakeCaseToCamelCase(e))));
    }

    /**
     * @param champion The champion id as found in DDragon, e.g. AurelionSol / Kaisa
     */
    public static async getChampion(champion: string): Promise<Hasagi.DataSources.MerakiAnalytics.Champion> {
        if (champion === "Wukong")
            champion = "MonkeyKing";

        return await dataLoaderAxios.get(`https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions/${champion}.json`).then(res => snakeCaseToCamelCase(res.data));
    }

    public static async getItems() {
        const dDragonItems = await dataLoaderAxios.get(`http://ddragon.leagueoflegends.com/cdn/${await DataDragon.getLatestPatch("euw")}/data/en_US/item.json`).then(res => res.data.data, () => { })
        return await dataLoaderAxios.get("https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/items.json")
            .then(res => Object.values(res.data) as Hasagi.DataSources.MerakiAnalytics.Item[])
            .then(items => items.map(e => snakeCaseToCamelCase(e)))
            .then(items => items.map(item => dDragonItems[item.id] != undefined ? { ...item, maps: Object.entries(dDragonItems[item.id].maps).map(([key, value]) => {
                if(value) 
                    return Number(key);
                else
                    return -1;
            }).filter(m => m != -1)} as Hasagi.DataSources.MerakiAnalytics.Item : item))
            .then(items => new MerakiItemCollection(items));
    }

    public static async getItem(id: number) {
        return await dataLoaderAxios.get(`https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/items/${id}.json`).then(res => snakeCaseToCamelCase(res.data) as Hasagi.DataSources.MerakiAnalytics.Item);
    }

    public static async getPatches(): Promise<Hasagi.DataSources.MerakiAnalytics.Patches> {
        return await dataLoaderAxios.get("https://cdn.merakianalytics.com/riot/lol/resources/patches.json").then(res => res.data);
    }
}

class CommunityDragon {
    public static async getQueues(language = "default", patch = "latest") {
        return await dataLoaderAxios.get(`https://raw.communitydragon.org/${patch}/plugins/rcp-be-lol-game-data/global/${language}/v1/queues.json`)
            .then(res => Object.entries(res.data).map(entry => ({ id: entry[0], ...entry[1] as any })) as Hasagi.DataSources.CommunityDragon.Queue[])
            .then(qs => new CDragonQueueCollection(qs))
    }

    public static async getRunes(language = "default", patch = "latest") {
        return await dataLoaderAxios.get(`https://raw.communitydragon.org/${patch}/plugins/rcp-be-lol-game-data/global/${language}/v1/perks.json`)
            .then(res => res.data as Hasagi.DataSources.CommunityDragon.Rune[])
            .then(res => new CDragonRuneCollection(res));
    }

    public static async getRuneTrees(language = "default", patch = "latest") {
        return await dataLoaderAxios.get(`https://raw.communitydragon.org/${patch}/plugins/rcp-be-lol-game-data/global/${language}/v1/perkstyles.json`)
            .then(res => res.data as Hasagi.DataSources.CommunityDragon.RuneTrees)
            .then(res => new CDragonRuneTreeCollection(res.styles))
    }
}

const getDataDragonURL = (patch: string, language: LanguageCode, file = "") => `https://ddragon.leagueoflegends.com/cdn/${patch}/data/${language}/${file}`;

class DataDragon {
    public static async getLatestPatch(region: ServerRegion) {
        return await dataLoaderAxios.get(`https://ddragon.leagueoflegends.com/realms/${region}.json`).then(res => res.data.dd as string);
    }

    public static async getRealms() {
        return await dataLoaderAxios.get("https://ddragon.leagueoflegends.com/api/realms.json").then(res => res.data as string[]);
    }

    public static async getLanguages() {
        return await dataLoaderAxios.get("https://ddragon.leagueoflegends.com/cdn/languages.json").then(res => res.data as string[]);
    }

    public static async getChampions(patch: string, language: LanguageCode = "en_US") {
        return await dataLoaderAxios.get(getDataDragonURL(patch, language, "championFull.json"))
            .then(res => Object.values(res.data.data) as Hasagi.DataSources.DataDragon.Champion[])
            .then(res => new DDragonChampionCollection(res));
    }

    public static async getSummonerSpells(patch: string, language: LanguageCode = "en_US") {
        return await dataLoaderAxios.get(getDataDragonURL(patch, language, "summoner.json"))
            .then(res => Object.values(res.data.data) as Hasagi.DataSources.DataDragon.SummonerSpell[])
            .then(res => new DDragonSummonerSpellCollection(res));
    }

    public static async getRunes(patch: string, language: LanguageCode = "en_US") {
        return await dataLoaderAxios.get(getDataDragonURL(patch, language, "runesReforged.json"))
            .then(res => res.data as Hasagi.DataSources.DataDragon.RuneTree[])
            .then(res => new DDragonRuneCollection(res))
    }
}

const getGameConstantsURL = (file: string = "") => `https://static.developer.riotgames.com/docs/lol/${file}`;

class GameConstants {
    public static async getQueues() {
        return await dataLoaderAxios.get(getGameConstantsURL("queues.json"))
            .then(res => res.data as Hasagi.DataSources.GameConstants.GameQueue[])
            .then(res => new GameConstantsQueueCollection(res))
    }

    public static async getMaps() {
        return await dataLoaderAxios.get(getGameConstantsURL("maps.json"))
            .then(res => res.data as Hasagi.DataSources.GameConstants.GameMap[])
            .then(res => new GameConstantsMapCollection(res))
    }

    public static async getGameModes() {
        return await dataLoaderAxios.get(getGameConstantsURL("gameModes.json")).then(res => res.data as Hasagi.DataSources.GameConstants.GameMode[])
    }

    public static async getGameTypes() {
        return await dataLoaderAxios.get(getGameConstantsURL("gameTypes.json")).then(res => res.data as Hasagi.DataSources.GameConstants.GameType[])
    }
}

/** Converts an object which keys are in camel case to an object with camel case keys */
function snakeCaseToCamelCase(obj: Record<string, any>): any {
    const newObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        newObj[key.replace(/_\w/g, m => m[1].toUpperCase())] = value;
    }

    return newObj;
}

export { MerakiAnalytics, CommunityDragon, DataDragon, GameConstants }
export * as Collections from "./classes/collections.js";
export { default as AbstractDataCollection } from "./classes/data-collection.js";  