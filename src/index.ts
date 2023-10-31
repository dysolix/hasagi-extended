import { HasagiClient as CoreClient, LCUEndpointBodyType, LCUEndpointResponseType, LCUTypes, HasagiEvents } from "@hasagi/core"
import { TypedEmitter } from "tiny-typed-emitter";
import axios from "axios";
import { Agent } from "https";
import ChampSelectSession from "./classes/champ-select-session.js";
import { LANGUAGE_CODES, SERVER_REGIONS } from "./constants.js";
import type Hasagi from "./types";
export type { Hasagi }

export * as Data from "./data.js";
export * as Constants from "./constants.js"

export type LanguageCode = typeof LANGUAGE_CODES[number];
export type ServerRegion = typeof SERVER_REGIONS[number];

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export default class HasagiClient extends TypedEmitter<Hasagi.Events> {
  private readonly coreClient: CoreClient = new CoreClient();

  public isConnected: boolean = false;
  public regionLocale: LCUEndpointResponseType<"get", "/riotclient/region-locale"> | null = null;
  public gameflowSession: LCUEndpointResponseType<"get", "/lol-gameflow/v1/session"> | null = null;
  public champSelectSession: ChampSelectSession | null = null;
  public runePages: LCUEndpointResponseType<"get", "/lol-perks/v1/pages"> = [];

  private liveClientAxiosInstance = axios.create({
    baseURL: "https://127.0.0.1:2999",
    httpsAgent: new Agent({
      rejectUnauthorized: false
    }),
    adapter: "http"
  });

  public constructor() {
    super();

    this.coreClient.on("connected", () => this.emit("connected"));
    this.coreClient.on("connecting", () => this.emit("connecting"));
    this.coreClient.on("connection-attempt-failed", () => this.emit("connection-attempt-failed"));
    this.coreClient.on("disconnected", () => this.emit("disconnected"));
    this.coreClient.on("lcu-event", (e) => this.emit("lcu-event", e));

    this.on("connected", async () => {
      await delay(5000);
      await Promise.allSettled([
        this.Runes.getRunePages().then(runePages => {
          this.runePages = runePages;
          this.emit("rune-pages-update", null, this.runePages);
        }),
        this.getGameflowSession().then(gameflowSession => {
          const oldGameflowSession = this.gameflowSession;
          this.gameflowSession = gameflowSession
          this.emit("gameflow-session-update", oldGameflowSession, this.gameflowSession)
        }),
        this.getClientRegion().then(regionLocale => {
          this.regionLocale = regionLocale;
        })
      ]);

      this.isConnected = true;
      this.emit("connection-state-change", true);
    });

    this.on("disconnected", () => {
      this.champSelectSession = null;
      this.gameflowSession = null;
      this.runePages = [];
      this.regionLocale = null;

      this.isConnected = false;
      this.emit("connection-state-change", false);
    });

    this.addLCUEventListener({
      path: "/lol-champ-select/v1/session",
      callback: (e) => this.onTeamBuilderChampSelectSessionUpdate(e as LCUTypes.PluginResourceEvent<unknown>)
    });

    this.addLCUEventListener({
      path: "/lol-perks/v1/pages",
      callback: (e) => this.onPerksPagesUpdate(e as LCUTypes.PluginResourceEvent<unknown>)
    });

    this.addLCUEventListener({
      path: "/lol-perks/v1/currentpage",
      callback: (e) => this.onPerksCurrentPageUpdate(e as LCUTypes.PluginResourceEvent<unknown>)
    });

    this.addLCUEventListener({
      path: "/lol-gameflow/v1/session",
      callback: (e) => this.onGameflowSessionUpdate(e as LCUTypes.PluginResourceEvent<unknown>)
    });

    this.addLCUEventListener({
      path: "/lol-champ-select/v1/pickable-skin-ids",
      callback: (e) => this.onTeamBuilderChampSelectPickableSkinIdsUpdate(e as LCUTypes.PluginResourceEvent<unknown>)
    });
  }

  public readonly connect = this.coreClient.connect.bind(this.coreClient)
  public readonly addLCUEventListener = this.coreClient.addLCUEventListener.bind(this.coreClient)
  public readonly removeLCUEventListener = this.coreClient.removeLCUEventListener.bind(this.coreClient)
  public readonly buildRequest = this.coreClient.buildRequest.bind(this.coreClient)
  public readonly getBasicAuthToken = this.coreClient.getBasicAuthToken.bind(this.coreClient)
  public readonly getPort = this.coreClient.getPort.bind(this.coreClient)
  public readonly request = this.coreClient.request.bind(this.coreClient)

  ChampSelect = {
    getSession: this.buildRequest("get", "/lol-champ-select/v1/session", { transformResponse: res => new ChampSelectSession(res) }),
    getPhase: this.buildRequest("get", "/lol-champ-select/v1/session", { transformResponse: res => new ChampSelectSession(res).getPhase() }),
  } as const;

  public readonly getLobbyInvitations = this.buildRequest("get", "/lol-lobby/v2/received-invitations")
  public readonly acceptLobbyInvite = this.buildRequest("post", "/lol-lobby/v2/received-invitations/{invitationId}/accept");
  public readonly declineLobbyInvite = this.buildRequest("post", "/lol-lobby/v2/received-invitations/{invitationId}/decline");

  public readonly Lobby = {
    getLobby: this.buildRequest("get", "/lol-lobby/v2/lobby"),

    kickLobbyMember: this.buildRequest("post", `/lol-lobby/v2/lobby/members/{summonerId}/kick`),
    promoteLobbyMember: this.buildRequest("post", `/lol-lobby/v2/lobby/members/{summonerId}/promote`),
    grantLobbyMemberInvitePermission: this.buildRequest("post", `/lol-lobby/v2/lobby/members/{summonerId}/grant-invite`),
    revokeLobbyMemberInvitePermission: this.buildRequest("post", `/lol-lobby/v2/lobby/members/{summonerId}/revoke-invite`),

    sendInvitation: this.buildRequest("post", "/lol-lobby/v2/lobby/invitations"),

    startQueue: this.buildRequest("post", "/lol-lobby/v2/lobby/matchmaking/search"),
    stopQueue: this.buildRequest("delete", "/lol-lobby/v2/lobby/matchmaking/search"),

    setPositionPreferences: this.buildRequest("put", "/lol-lobby/v2/lobby/members/localMember/position-preferences"),
  } as const;

  acceptReadyCheck = this.buildRequest("post", "/lol-matchmaking/v1/ready-check/accept")
  declineReadyCheck = this.buildRequest("post", "/lol-matchmaking/v1/ready-check/decline")

  Runes = {
    getDisabledRunes: this.buildRequest("get", "/lol-perks/v1/perks/disabled"),
    setSelectedRunePage: this.buildRequest("put", "/lol-perks/v1/currentpage"),
    getSelectedRunePage: this.buildRequest("get", "/lol-perks/v1/currentpage"),

    createRunePage: this.buildRequest("post", "/lol-perks/v1/pages"),
    getRunePage: this.buildRequest("get", `/lol-perks/v1/pages/{id}`),
    deleteRunePage: this.buildRequest("delete", `/lol-perks/v1/pages/{id}`),
    updateRunePage: this.buildRequest("put", `/lol-perks/v1/pages/{id}`),
    replaceRunePage: (id: number, runePage: Partial<LCUEndpointBodyType<"post", "/lol-perks/v1/pages">>) => this.Runes.deleteRunePage(id).then(() => this.Runes.createRunePage(runePage as any)),

    getRunePages: this.buildRequest("get", "/lol-perks/v1/pages"),
  } as const

  Inventory = {
    getOwnedSkins: this.buildRequest("get", `/lol-champions/v1/inventories/{summonerId}/skins-minimal`, {
      transformParameters: async () => {
        const summoner = await this.getLocalSummoner();
        return [summoner.summonerId] as const;
      }
    }),

    getOwnedChampions: this.buildRequest("get", `/lol-champions/v1/owned-champions-minimal`),

    setLittleLegend: this.buildRequest("put", "/lol-cosmetics/v1/selection/companion"),

    setTFTBoom: this.buildRequest("put", "/lol-cosmetics/v1/selection/tft-damage-skin"),

    setTFTArena: this.buildRequest("put", "/lol-cosmetics/v1/selection/tft-map-skin"),

    getAccountLoadout: this.buildRequest("get", "/lol-loadouts/v4/loadouts/scope/account", { transformResponse: res => res[0] }),

    updateAccountLoadout: this.buildRequest("put", "/lol-loadouts/v4/loadouts/{id}", {
      transformParameters: async (body: LCUTypes.LolLoadoutsUpdateLoadoutDTO["loadout"]) => {
        var accountLoadout = await this.Inventory.getAccountLoadout() as LCUEndpointResponseType<"get", "/lol-loadouts/v4/loadouts/scope/account">[number];
        return [accountLoadout.id, { ...accountLoadout, loadout: { ...accountLoadout.loadout, ...body } }] as const;
      }
    }),

    setProfileIcon: this.buildRequest("put", "/lol-summoner/v1/current-summoner/icon", { transformParameters: (iconId: number) => [{ profileIconId: iconId } as any] as const })
  } as const

  getLocalSummoner = this.buildRequest("get", "/lol-summoner/v1/current-summoner")
  getLocalSummonerRankedData = this.buildRequest("get", "/lol-ranked/v1/current-ranked-stats")

  getSummonerById = this.buildRequest("get", `/lol-summoner/v1/summoners/{id}`)

  downloadReplay = this.buildRequest("post", `/lol-replays/v1/rofls/{gameId}/download`, { transformParameters: (gameId: number) => [gameId, { componentType: "replay-button_match-history" }] as const })

  watchReplay = this.buildRequest("post", `/lol-replays/v1/rofls/{gameId}/watch`, { transformParameters: (gameId: number) => [gameId, { componentType: "replay-button_match-history" }] as const })

  getGameflowSession = this.buildRequest("get", "/lol-gameflow/v1/session")
  getGameflowPhase = this.buildRequest("get", "/lol-gameflow/v1/gameflow-phase")

  getMatchmakingSearchState = this.buildRequest("get", "/lol-matchmaking/v1/search")

  getClientRegion = this.buildRequest("get", "/riotclient/region-locale")

  LiveClient = {
    request: this.liveClientAxiosInstance.request.bind(this),

    /**
     * @param timeout If the Live Client API is not available after this timeout, the function will throw an error. Defaults to 30000 (milliseconds)
     */
    async waitForLiveClientAvailability(timeout = 30000) {
      let elapsedTime = 0;
      while (elapsedTime < timeout) {
        let summonerName = await this.getLiveClientActivePlayerSummonerName();
        if (summonerName !== null)
          return;

        await delay(1000);
        elapsedTime += 1000;
      }

      throw new Error("Live Client Data is not available.");
    },

    async getLiveClientActivePlayerSummonerName() {
      return await this.request({ method: "get", url: "/liveclientdata/activeplayername" }).then(res => res.data as string, err => null);
    },

    async getLiveClientData(): Promise<Hasagi.LiveClientAPI.AllGameData | null> {
      return await this.request({ method: "get", url: "/liveclientdata/allgamedata" }).then(res => res.data, err => null)
    },

    async getLiveClientActivePlayer(): Promise<Hasagi.LiveClientAPI.LocalPlayer | null> {
      return await this.request({ method: "get", url: "/liveclientdata/activeplayer" }).then(res => res.data, err => null)
    },

    async getLiveClientActivePlayerAbilities(): Promise<Hasagi.LiveClientAPI.LocalPlayerAbilities | null> {
      return await this.request({ method: "get", url: "/liveclientdata/activeplayerabilities" }).then(res => res.data, err => null)
    },

    async getLiveClientActivePlayerRunes(): Promise<Hasagi.LiveClientAPI.LocalPlayerRunes | null> {
      return await this.request({ method: "get", url: "/liveclientdata/activeplayerrunes" }).then(res => res.data, err => null)
    },

    async getLiveClientPlayerList(): Promise<Hasagi.LiveClientAPI.Player[] | null> {
      return await this.request({ method: "get", url: "/liveclientdata/playerlist" }).then(res => res.data, err => null)
    },

    async getLiveClientPlayerScore(summonerName: string): Promise<Hasagi.LiveClientAPI.PlayerScores | null> {
      return await this.request({ method: "get", url: encodeURI("/liveclientdata/playerscores?summonerName=" + summonerName) }).then(res => res.data, err => null)
    },

    async getLiveClientPlayerSummonerSpells(summonerName: string): Promise<Hasagi.LiveClientAPI.PlayerSummonerSpells | null> {
      return await this.request({ method: "get", url: encodeURI("/liveclientdata/playersummonerspells?summonerName=" + summonerName) }).then(res => res.data, err => null)
    },

    async getLiveClientPlayerMainRunes(summonerName: string): Promise<Hasagi.LiveClientAPI.PlayerMainRunes | null> {
      return await this.request({ method: "get", url: encodeURI("/liveclientdata/playermainrunes?summonerName=" + summonerName) }).then(res => res.data, err => null)
    },

    async getLiveClientPlayerItems(summonerName: string): Promise<Hasagi.LiveClientAPI.PlayerItem[] | null> {
      return await this.request({ method: "get", url: encodeURI("/liveclientdata/playeritems?summonerName=" + summonerName) }).then(res => res.data, err => null)
    },

    async getLiveClientEvents(): Promise<{ Events: Hasagi.LiveClientAPI.Event[] } | null> {
      return await this.request({ method: "get", url: "/liveclientdata/eventdata" }).then(res => res.data, err => null)
    },

    async getLiveClientGameStats(): Promise<Hasagi.LiveClientAPI.GameStats | null> {
      return await this.request({ method: "get", url: "/liveclientdata/gamestats" }).then(res => res.data, err => null)
    }
  } as const;

  //#region EventHandler
  private onTeamBuilderChampSelectSessionUpdate(event: LCUTypes.PluginResourceEvent<unknown>) {
    if (event.eventType === "Delete") {
      const oldSession = this.champSelectSession;
      this.champSelectSession = null;
      this.emit("champ-select-session-update", oldSession, null);
      this.emit("champ-select-phase-update", oldSession?.getPhase() ?? null, null);
      return;
    }

    let oldSessionData = this.champSelectSession;
    let newSessionData = new ChampSelectSession(event.data as any);
    this.champSelectSession = newSessionData;
    this.emit("champ-select-session-update", oldSessionData, newSessionData);

    if (oldSessionData !== null) {
      if (newSessionData.getPhase() !== oldSessionData.getPhase()) {
        this.emit("champ-select-phase-update", oldSessionData.getPhase(), newSessionData.getPhase());
      }
      if (newSessionData.isBanPhase() && oldSessionData.getPhase() === "PLANNING") {
        this.emit("champ-select-local-player-ban-turn", newSessionData.ownBanActionId);
      }
      if (newSessionData.inProgressActionIds.includes(newSessionData.ownPickActionId) && !oldSessionData.inProgressActionIds.includes(newSessionData.ownPickActionId)) {
        this.emit("champ-select-local-player-pick-turn", newSessionData.ownPickActionId)
      }

      // if (!oldSessionData.getActionById(oldSessionData.ownPickActionId)?.completed && newSessionData.getActionById(newSessionData.ownPickActionId)?.completed) {
      //   this.emit("champ-select-local-player-pick-completed", newSessionData.getActionById(newSessionData.ownPickActionId)!.championId);
      // } else if (oldSessionData.getActionById(oldSessionData.ownPickActionId)?.completed && newSessionData.getActionById(newSessionData.ownPickActionId)?.completed) {
      //   if (newSessionData.getLocalPlayer() != null && oldSessionData.getLocalPlayer()?.championId !== newSessionData.getLocalPlayer()?.championId)
      //     this.emit("champ-select-local-player-pick-completed", newSessionData.getLocalPlayer()!.championId);
      // }

      if (!oldSessionData.getActionById(oldSessionData.ownBanActionId)?.completed && newSessionData.getActionById(newSessionData.ownBanActionId)?.completed) {
        this.emit("champ-select-local-player-ban-completed", newSessionData.getActionById(newSessionData.ownBanActionId)!.championId);
      }

      const changedPickIntents: { summonerId: number, previousPickIntent: number, pickIntent: number }[] = [];
      newSessionData.myTeam.forEach((p, index) => {
        const previousPickIntent = oldSessionData!.myTeam[index].championPickIntent;
        const pickIntent = p.championPickIntent;

        if (previousPickIntent !== pickIntent || p.championId !== 0 && oldSessionData?.myTeam[index].championId === 0) {
          changedPickIntents.push({
            summonerId: p.summonerId,
            previousPickIntent,
            pickIntent: p.championId !== 0 ? p.championId : pickIntent
          })
        }
      })

      changedPickIntents.forEach(changedPickIntent => this.emit("champ-select-pick-intent-change", changedPickIntent.summonerId, changedPickIntent.previousPickIntent, changedPickIntent.pickIntent))

    } else {
      this.emit("champ-select-phase-update", null, newSessionData.getPhase());
      // if ((newSessionData.getLocalPlayer()?.championId ?? 0) !== 0)
      //   this.emit("champ-select-local-player-pick-completed", newSessionData.getLocalPlayer()!.championId);
    }

    if ((oldSessionData?.getLocalPlayer()?.championId ?? 0) !== (newSessionData.getLocalPlayer()?.championId ?? 0) && (newSessionData.getLocalPlayer()?.championId ?? 0) !== 0)
      this.emit("champ-select-local-player-pick-completed", newSessionData.getLocalPlayer()!.championId);
  }

  private onPerksPagesUpdate(event: LCUTypes.PluginResourceEvent<unknown>) {
    if (event.eventType === "Update") {
      let runes: any[] = event.data as any;
      const oldRunes = this.runePages;
      this.runePages = runes;
      this.emit("rune-pages-update", oldRunes, this.runePages);
    }
  }

  private onPerksCurrentPageUpdate(event: LCUTypes.PluginResourceEvent<unknown>) {
    const oldRunes = this.runePages.map(runePage => ({ ...runePage }))
    let updatedRunePage = event.data as any;
    let index = this.runePages.findIndex(rp => rp.id === updatedRunePage.id);
    let currentIndex = this.runePages.findIndex(rp => rp.current);
    if (currentIndex !== -1) this.runePages[currentIndex].current = false;
    if (index === -1) return;
    this.runePages[index] = updatedRunePage;
    this.emit("rune-pages-update", oldRunes, this.runePages);
  }

  public currentQueue: LCUEndpointResponseType<"get", "/lol-gameflow/v1/session">["gameData"]["queue"] | null = null;
  public currentMapId: number | null = null;

  private async onGameflowSessionUpdate(event: LCUTypes.PluginResourceEvent<unknown>) {
    const oldGameflowSession = this.gameflowSession;
    switch (event.eventType) {
      case "Delete": {
        this.gameflowSession = null;
        break;
      }

      default: {
        this.gameflowSession = event.data as any;
        break;
      }
    }

    const previousPhase = oldGameflowSession?.phase ?? "None";
    const currentPhase = this.gameflowSession?.phase ?? "None";
    if (previousPhase !== currentPhase)
      this.emit("gameflow-phase-update", previousPhase, currentPhase);


    this.currentQueue = this.gameflowSession?.gameData.queue ?? null;
    this.currentMapId = this.gameflowSession?.map.id ?? null;
    this.emit("gameflow-session-update", oldGameflowSession, this.gameflowSession);
  }

  private onLobbyUpdate(event: LCUTypes.PluginResourceEvent<unknown>) {
    switch (event.eventType) {
      case "Create":
      case "Update":

      case "Delete":

    }
  }

  /**
   * This only gets updated in champ select
   */
  pickableSkinIds: number[] = [];
  private onTeamBuilderChampSelectPickableSkinIdsUpdate(event: LCUTypes.PluginResourceEvent<unknown>) {
    if (event.eventType === "Delete")
      return;

    this.pickableSkinIds = event.data as any;
  }

  //#endregion
}