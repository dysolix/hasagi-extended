import { HasagiClient as CoreClient, LCUEndpointBodyType, LCUEndpointResponseType, LCUTypes, HasagiCoreEvents } from "@hasagi/core"
import { ListenerSignature, TypedEmitter } from "tiny-typed-emitter";
import axios from "axios";
import { Agent } from "https";
import ChampSelectSession from "./classes/champ-select-session.js";
import type Hasagi from "./types";
export type { Hasagi }

export * as Constants from "./constants.js";
export { default as ChampSelectSession } from "./classes/champ-select-session.js";

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export class HasagiClient extends TypedEmitter<Hasagi.Events> {
  /** Can't directly extend the core client because it messes up the typed events :( */
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

  public constructor(...params: ConstructorParameters<typeof CoreClient>) {
    super();

    this.coreClient.setDefaultRetryOptions(params[0]?.defaultRetryOptions ?? null!);

    this.coreClient.on("connected", () => this.emit("connected"));
    this.coreClient.on("connecting", () => this.emit("connecting"));
    this.coreClient.on("connection-attempt-failed", () => this.emit("connection-attempt-failed"));
    this.coreClient.on("disconnected", () => this.emit("disconnected"));
    this.coreClient.on("lcu-event", (e) => this.emit("lcu-event", e));

    this.on("connected", async () => {
      this.subscribeWebSocketEvent("OnJsonApiEvent");

      await delay(5000);
      await Promise.allSettled([
        this.Runes.getRunePages().then(runePages => {
          this.runePages = runePages;
          this.emit("rune-pages-update", this.runePages);
        }),
        this.getGameflowSession().then(async gameflowSession => {
          this.gameflowSession = gameflowSession
          this.emit("gameflow-session-update", this.gameflowSession)
          this.emit("gameflow-phase-update", this.gameflowSession?.phase ?? "None")
        }),
        this.ChampSelect.getSession().then(session => {
          this.champSelectSession = session;
          this.emit("champ-select-session-update", session);
          this.emit("champ-select-phase-update", session.getPhase());
        }),
        this.getClientRegion().then(regionLocale => {
          this.regionLocale = regionLocale;
        }),
        this.Lobby.getLobby().then(lobby => { this.emit("lobby-update", lobby) }),
        this.request("get", "/lol-end-of-game/v1/eog-stats-block").then(r => this.emit("end-of-game-data-received", r)),
      ]);

      this.isConnected = true;

      this.emit("ready");
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
      //name: "OnJsonApiEvent_lol-lobby_v2_lobby",
      path: "/lol-lobby/v2/lobby",
      callback: (e) => this.onLobbyUpdate(e)
    });

    this.addLCUEventListener({
      //name: "OnJsonApiEvent_lol-end-of-game_v1_eog-stats-block",
      path: "/lol-end-of-game/v1/eog-stats-block",
      callback: (e) => this.onEndOfGameDataReceived(e)
    })

    this.addLCUEventListener({
      //name: "OnJsonApiEvent_lol-matchmaking_v1_search",
      path: "/lol-matchmaking/v1/search",
      callback: (e) => this.onMatchmakingSearchStateUpdate(e)
    })

    this.addLCUEventListener({
      //name: "OnJsonApiEvent_lol-champ-select_v1_session",
      path: "/lol-champ-select/v1/session",
      callback: (e) => this.onChampSelectSessionUpdate(e)
    });

    this.addLCUEventListener({
      path: "/lol-perks/v1/pages",
      callback: (e) => this.onRunePagesUpdate(e)
    });

    this.addLCUEventListener({
      path: "/lol-perks/v1/currentpage",
      callback: (e) => this.onCurrentRunePageUpdate(e)
    });

    // this.addLCUEventListener({
    //   name: "OnJsonApiEvent_lol-champ-select_v1_session", // You could omit the name and will still get the same result. If omitted, Hasagi will automatically set it to OnJsonApiEvent
    //   path: "/lol-champ-select/v1/session",
    //   callback: (e) => {
    //     switch (e.eventType) {
    //       case "Create":
    //       case "Update":
    //         const data = e.data as LCUEndpointResponseType<"get", "/lol-champ-select/v1/session">; // Type needs to be manually specified because event types can't be auto-generated
    //         // ...
    //         break;
    //       case "Delete":
    //         // Data is null in this case
    //         break;
    //     }
    //   }
    // });

    this.addLCUEventListener({
      //name: "OnJsonApiEvent_lol-gameflow_v1_session",
      path: "/lol-gameflow/v1/session",
      callback: (e) => this.onGameflowSessionUpdate(e)
    });
  }

  public readonly getBasicAuthToken = this.coreClient.getBasicAuthToken.bind(this.coreClient)
  public readonly getPassword = this.coreClient.getPassword.bind(this.coreClient);
  public readonly getPort = this.coreClient.getPort.bind(this.coreClient)
  public readonly getProtocol = this.coreClient.getHostWithAuthentication.bind(this.coreClient)

  public readonly setDefaultRetryOptions = this.coreClient.setDefaultRetryOptions.bind(this.coreClient);

  public readonly connect = this.coreClient.connect.bind(this.coreClient)

  public readonly request: CoreClient["request"] = this.coreClient.request.bind(this.coreClient);
  public readonly poll: CoreClient["poll"] = this.coreClient.poll.bind(this.coreClient);
  public readonly buildRequest = this.coreClient.buildRequest.bind(this.coreClient)

  public readonly addLCUEventListener = this.coreClient.addLCUEventListener.bind(this.coreClient);
  public readonly removeLCUEventListener = this.coreClient.removeLCUEventListener.bind(this.coreClient);
  public readonly subscribeWebSocketEvent = this.coreClient.subscribeWebSocketEvent.bind(this.coreClient);
  public readonly unsubscribeWebSocketEvent = this.coreClient.unsubscribeWebSocketEvent.bind(this.coreClient);

  public readonly ChampSelect = {
    getSession: this.buildRequest("get", "/lol-champ-select/v1/session", { transformResponse: res => new ChampSelectSession(res) }),
    getPhase: () => this.ChampSelect.getSession().then(session => session.getPhase())
  } as const;

  public readonly getLobbyInvitations = this.buildRequest("get", "/lol-lobby/v2/received-invitations")
  public readonly acceptLobbyInvitation = this.buildRequest("post", "/lol-lobby/v2/received-invitations/{invitationId}/accept");
  public readonly declineLobbyInvitation = this.buildRequest("post", "/lol-lobby/v2/received-invitations/{invitationId}/decline");

  public readonly Lobby = {
    getLobby: this.buildRequest("get", "/lol-lobby/v2/lobby"),

    kickLobbyMember: this.buildRequest("post", `/lol-lobby/v2/lobby/members/{summonerId}/kick`),
    promoteLobbyMember: this.buildRequest("post", `/lol-lobby/v2/lobby/members/{summonerId}/promote`),
    grantLobbyMemberInvitePermission: this.buildRequest("post", `/lol-lobby/v2/lobby/members/{summonerId}/grant-invite`),
    revokeLobbyMemberInvitePermission: this.buildRequest("post", `/lol-lobby/v2/lobby/members/{summonerId}/revoke-invite`),

    sendInvitation: this.buildRequest("post", "/lol-lobby/v2/lobby/invitations"),

    /** Using this to automatically queue is forbidden. */
    startQueue: this.buildRequest("post", "/lol-lobby/v2/lobby/matchmaking/search"),
    stopQueue: this.buildRequest("delete", "/lol-lobby/v2/lobby/matchmaking/search"),

    setPositionPreferences: this.buildRequest("put", "/lol-lobby/v2/lobby/members/localMember/position-preferences"),
  } as const;

  /** Using this to automatically accept a ready check is forbidden. */
  public readonly acceptReadyCheck = this.buildRequest("post", "/lol-matchmaking/v1/ready-check/accept")
  public readonly declineReadyCheck = this.buildRequest("post", "/lol-matchmaking/v1/ready-check/decline")

  public readonly Runes = {
    getDisabledRunes: this.buildRequest("get", "/lol-perks/v1/perks/disabled"),
    setSelectedRunePage: this.buildRequest("put", "/lol-perks/v1/currentpage"),
    getSelectedRunePage: this.buildRequest("get", "/lol-perks/v1/currentpage"),

    createRunePage: this.buildRequest("post", "/lol-perks/v1/pages"),
    getRunePage: this.buildRequest("get", `/lol-perks/v1/pages/{id}`),
    deleteRunePage: this.buildRequest("delete", `/lol-perks/v1/pages/{id}`),
    replaceRunePage: (id: number, runePage: Partial<LCUEndpointBodyType<"post", "/lol-perks/v1/pages">>) => this.Runes.deleteRunePage(id).then(() => this.Runes.createRunePage(runePage as any)),

    getRunePages: this.buildRequest("get", "/lol-perks/v1/pages"),
  } as const

  public readonly Inventory = {
    getOwnedSkins: this.buildRequest("get", `/lol-champions/v1/inventories/{summonerId}/skins-minimal`, {
      transformParameters: async () => {
        const summoner = await this.getLocalSummoner();
        return [summoner.summonerId] as const;
      },
      transformResponse: res => res.filter(s => s.ownership.owned)
    }),
    getAllSkins: this.buildRequest("get", `/lol-champions/v1/inventories/{summonerId}/skins-minimal`, {
      transformParameters: async () => {
        const summoner = await this.getLocalSummoner();
        return [summoner.summonerId] as const;
      }
    }),

    getOwnedChampions: this.buildRequest("get", `/lol-champions/v1/owned-champions-minimal`),
    getAllChampions: this.buildRequest("get", `/lol-champions/v1/inventories/{summonerId}/champions`, {
      transformParameters: async () => {
        const summoner = await this.getLocalSummoner();
        return [summoner.summonerId] as const;
      }
    }),

    setLittleLegend: this.buildRequest("put", "/lol-cosmetics/v1/selection/companion"),

    setTFTBoom: this.buildRequest("put", "/lol-cosmetics/v1/selection/tft-damage-skin"),

    setTFTArena: this.buildRequest("put", "/lol-cosmetics/v1/selection/tft-map-skin"),

    setTFTLegend: this.buildRequest("put", "/lol-cosmetics/v1/selection/playbook"),

    getAccountLoadout: this.buildRequest("get", "/lol-loadouts/v4/loadouts/scope/account", { transformResponse: res => res[0] }),

    updateAccountLoadout: this.buildRequest("put", "/lol-loadouts/v4/loadouts/{id}", {
      transformParameters: async (body: LCUTypes.LolLoadoutsUpdateLoadoutDTO["loadout"]) => {
        var accountLoadout = await this.Inventory.getAccountLoadout() as LCUEndpointResponseType<"get", "/lol-loadouts/v4/loadouts/scope/account">[number];
        return [accountLoadout.id, { ...accountLoadout, loadout: { ...accountLoadout.loadout, ...body } }] as const;
      }
    }),

    setProfileIcon: this.buildRequest("put", "/lol-summoner/v1/current-summoner/icon", { transformParameters: (iconId: number) => [{ profileIconId: iconId } as any] as const })
  } as const

  public readonly getLocalSummoner = this.buildRequest("get", "/lol-summoner/v1/current-summoner")
  public readonly getLocalSummonerRankedData = this.buildRequest("get", "/lol-ranked/v1/current-ranked-stats")

  public readonly getSummonerByRiotId = this.buildRequest("get", `/lol-summoner/v1/alias/lookup`)
  public readonly getSummonerById = this.buildRequest("get", `/lol-summoner/v1/summoners/{id}`)
  public readonly getSummonersByIds = this.buildRequest("get", `/lol-summoner/v2/summoners`)
  public readonly getCachedSummonerByPuuid = this.buildRequest("get", `/lol-summoner/v1/summoners-by-puuid-cached/{puuid}`)

  public readonly downloadReplay = this.buildRequest("post", `/lol-replays/v1/rofls/{gameId}/download`, { transformParameters: (gameId: number) => [gameId, { componentType: "replay-button_match-history" }] as const })

  public readonly watchReplay = this.buildRequest("post", `/lol-replays/v1/rofls/{gameId}/watch`, { transformParameters: (gameId: number) => [gameId, { componentType: "replay-button_match-history" }] as const })

  public readonly getGameflowSession = this.buildRequest("get", "/lol-gameflow/v1/session")
  public readonly getGameflowPhase = this.buildRequest("get", "/lol-gameflow/v1/gameflow-phase")

  public readonly getMatchmakingSearchState = this.buildRequest("get", "/lol-matchmaking/v1/search")

  public readonly getClientRegion = this.buildRequest("get", "/riotclient/region-locale")

  public readonly sendNotification = this.buildRequest("post", "/player-notifications/v1/notifications", {
    transformParameters(title: string, message: string, options?: { backgroundUrl?: string, iconUrl?: string }) {
      return [{
        detailKey: "pre_translated_details",
        titleKey: "pre_translated_title",
        data: {
          title,
          details: message
        },
        backgroundUrl: options?.backgroundUrl,
        iconUrl: options?.iconUrl,
      } as unknown as LCUTypes.PlayerNotificationsPlayerNotificationResource] as const;
    },
  })

  public readonly ItemSets = {
    getItemSets: this.buildRequest("get", "/lol-item-sets/v1/item-sets/{summonerId}/sets", { transformParameters: async () => [await this.getLocalSummoner().then(summoner => summoner.summonerId)] as const }),
    getItemSet: (uid: string) => this.ItemSets.getItemSets().then(itemSets => itemSets.itemSets.find(i => i.uid === uid)),
    setItemSets: this.buildRequest("put", "/lol-item-sets/v1/item-sets/{summonerId}/sets", {
      transformParameters: async (itemSets: LCUTypes.LolItemSetsItemSets | LCUTypes.LolItemSetsItemSets["itemSets"]) => {
        const summoner = await this.getLocalSummoner();
        if (Array.isArray(itemSets)) {
          const currentItemSet: LCUEndpointResponseType<"get", "/lol-item-sets/v1/item-sets/{summonerId}/sets"> = await this.ItemSets.getItemSets();
          return [summoner.summonerId, { ...currentItemSet, itemSets }] as const;
        } else {
          return [summoner.summonerId, itemSets] as const;
        }
      }
    }),
    deleteItemSet: (uid: string) => this.ItemSets.getItemSets().then(itemSets => this.ItemSets.setItemSets(itemSets.itemSets.filter(i => i.uid !== uid))),
    addItemSet: (itemSet: LCUEndpointResponseType<"get", "/lol-item-sets/v1/item-sets/{summonerId}/sets">["itemSets"][number]) => this.ItemSets.getItemSets().then(itemSets => this.ItemSets.setItemSets({ ...itemSets, itemSets: [...itemSets.itemSets, itemSet] }))
  } as const;

  //#region EventHandler
  private onChampSelectSessionUpdate(event: LCUTypes.PluginResourceEvent<unknown>) {
    if (event.eventType === "Delete") {
      this.champSelectSession = null;
      this.emit("champ-select-session-update", null);
      this.emit("champ-select-phase-update", null);
      return;
    }

    const oldSessionData = this.champSelectSession;
    const newSessionData = new ChampSelectSession(event.data as any);
    this.champSelectSession = newSessionData;
    this.emit("champ-select-session-update", newSessionData);

    if (oldSessionData !== null) {
      if (newSessionData.getPhase() !== oldSessionData.getPhase()) {
        this.emit("champ-select-phase-update", newSessionData.getPhase());
      }
      if (newSessionData.isBanPhase() && oldSessionData.getPhase() === "PLANNING") {
        this.emit("champ-select-local-player-ban-turn", newSessionData.ownBanActionId);
      }
      if (newSessionData.inProgressActionIds.includes(newSessionData.ownPickActionId) && !oldSessionData.inProgressActionIds.includes(newSessionData.ownPickActionId)) {
        this.emit("champ-select-local-player-pick-turn", newSessionData.ownPickActionId)
      }

      if (!oldSessionData.getActionById(oldSessionData.ownBanActionId)?.completed && newSessionData.getActionById(newSessionData.ownBanActionId)?.completed) {
        this.emit("champ-select-local-player-ban-completed", newSessionData.getActionById(newSessionData.ownBanActionId)!.championId);
      }

      const changedPickIntents: { puuid: string, previousPickIntent: number, pickIntent: number }[] = [];
      newSessionData.myTeam.forEach((p, index) => {
        const previousPickIntent = oldSessionData!.myTeam[index].championId !== 0 ? oldSessionData!.myTeam[index].championId : oldSessionData!.myTeam[index].championPickIntent;
        const pickIntent = p.championId !== 0 ? p.championId : p.championPickIntent;

        if (previousPickIntent !== pickIntent) {
          changedPickIntents.push({
            puuid: p.puuid,
            previousPickIntent,
            pickIntent
          })
        }
      })

      changedPickIntents.forEach(changedPickIntent => this.emit("champ-select-pick-intent-change", changedPickIntent.puuid, changedPickIntent.pickIntent))

    } else {
      this.emit("champ-select-phase-update", newSessionData.getPhase());
    }

    const oldLocalPlayerData = oldSessionData?.getLocalPlayer() ?? null;
    const newLocalPlayerData = newSessionData.getLocalPlayer();
    const oldLocalPlayerPickAction = oldSessionData?.getActionById(oldSessionData.ownPickActionId) ?? null;
    const newLocalPlayerPickAction = newSessionData.getActionById(newSessionData.ownPickActionId)

    if (oldLocalPlayerPickAction === null && newLocalPlayerPickAction === null && (newLocalPlayerData?.championId ?? 0) !== (oldLocalPlayerData?.championId ?? 0))
      this.emit("champ-select-local-player-pick-completed", newLocalPlayerData!.championId);
    else if (oldLocalPlayerPickAction?.isInProgress && newLocalPlayerPickAction?.completed)
      this.emit("champ-select-local-player-pick-completed", newLocalPlayerData!.championId);
    else if (oldLocalPlayerPickAction?.completed && newLocalPlayerPickAction?.completed && oldLocalPlayerData?.championId !== newLocalPlayerData?.championId)
      this.emit("champ-select-local-player-pick-completed", newLocalPlayerData!.championId);
  }

  private onRunePagesUpdate(event: LCUTypes.PluginResourceEvent<unknown>) {
    if (event.eventType === "Update") {
      let runes: any[] = event.data as any;
      const oldRunes = this.runePages;
      this.runePages = runes;
      this.emit("rune-pages-update", this.runePages);
    }
  }

  private onCurrentRunePageUpdate(event: LCUTypes.PluginResourceEvent<unknown>) {
    const oldRunes = this.runePages.map(runePage => ({ ...runePage }))
    let updatedRunePage = event.data as any;
    let index = this.runePages.findIndex(rp => rp.id === updatedRunePage.id);
    let currentIndex = this.runePages.findIndex(rp => rp.current);
    if (currentIndex !== -1) this.runePages[currentIndex].current = false;
    if (index === -1) return;
    this.runePages[index] = updatedRunePage;
    this.emit("rune-pages-update", this.runePages);
  }

  public currentQueue: LCUEndpointResponseType<"get", "/lol-gameflow/v1/session">["gameData"]["queue"] | null = null;
  public currentMap: LCUEndpointResponseType<"get", "/lol-gameflow/v1/session">["map"] | null = null;

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
    if (previousPhase !== currentPhase) {
      this.emit("gameflow-phase-update", currentPhase);
    }

    this.currentQueue = this.gameflowSession?.gameData.queue ?? null;
    this.currentMap = this.gameflowSession?.map ?? null;

    this.emit("gameflow-session-update", this.gameflowSession);
  }

  private onLobbyUpdate(event: LCUTypes.PluginResourceEvent<unknown>) {
    switch (event.eventType) {
      case "Create":
      case "Update":
        const data = event.data as Hasagi.Lobby;
        this.emit("lobby-update", data);
        break;
      case "Delete":
        this.emit("lobby-update", null);
        break;
    }
  }

  private onEndOfGameDataReceived(event: LCUTypes.PluginResourceEvent<unknown>) {
    switch (event.eventType) {
      case "Create":
      case "Update":
        const data = event.data as Hasagi.EndOfGameData;
        this.emit("end-of-game-data-received", data);
        break;
      case "Delete":
        break;
    }
  }

  private onMatchmakingSearchStateUpdate(event: LCUTypes.PluginResourceEvent<unknown>) {
    switch (event.eventType) {
      case "Create":
      case "Update":
        const data = event.data as Hasagi.QueueState;
        this.emit("queue-state-update", data);
        break;
      case "Delete":
        this.emit("queue-state-update", null);
        break;
    }
  }

  //#endregion
}

export default HasagiClient;