import { HasagiClient as CoreClient, LCUEndpointBodyType, LCUEndpointResponseType, LCUTypes, LCUError, RequestError } from "@hasagi/core";
import ChampSelectSession from "./classes/champ-select-session.js";
import type Hasagi from "./types";
export type { Hasagi };

export * as Constants from "./constants.js";
export { ChampSelectSession };

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Awaits an initial-state fetch right after connect, retrying only while the client is still warming
 * up — transport failures ({@link RequestError}, e.g. a plugin's port not accepting yet) and 5xx
 * responses — up to `maxAttempts`. A definitive 4xx (e.g. 404 = resource genuinely absent, such as no
 * active champ select or lobby) resolves/throws immediately, so the common "not in that state" cases
 * add no latency. This only covers the transport/5xx axis of post-connect warmup. An endpoint that
 * answers 200 with a still-populating payload (e.g. /lol-perks briefly returns zero rune pages right
 * after a cold start) is NOT retried here — empty is indistinguishable from a legitimately-empty
 * resource (a 0-page account), so it can't be a readiness signal; its live OnJsonApiEvent backfills it
 * instead. Ready clients don't wait on retries, slow ones wait only as long as needed (capped at
 * maxAttempts * retryDelayMs).
 */
async function awaitReady<T>(fetch: () => Promise<T>, maxAttempts = 10, retryDelayMs = 500): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch();
    } catch (error) {
      const warmingUp = error instanceof RequestError || (error instanceof LCUError && error.statusCode >= 500);
      if (!warmingUp || attempt >= maxAttempts)
        throw error;
      await delay(retryDelayMs);
    }
  }
}

export class HasagiClient extends CoreClient<Hasagi.Events> {
  public regionLocale: LCUEndpointResponseType<"get", "/riotclient/region-locale"> | null = null;
  public gameflowSession: LCUEndpointResponseType<"get", "/lol-gameflow/v1/session"> | null = null;
  public champSelectSession: ChampSelectSession | null = null;
  public runePages: LCUEndpointResponseType<"get", "/lol-perks/v1/pages"> = [];

  /**
   * Resources for which a live WebSocket event has delivered state since the current connection's
   * initial fetch began (cleared at the start of each "connected"). An initial GET that resolves after
   * its resource's event — a slow cold-start GET racing the populate event — checks this and skips, so
   * it can't clobber fresher event data with its stale connect-time snapshot.
   */
  private readonly receivedEvents = new Set<string>();

  public constructor(...params: ConstructorParameters<typeof CoreClient>) {
    super(...params);

    this.on("connected", async () => {
      // Reset for this connection. Each initial fetch below seeds state only if a live event hasn't
      // already delivered it (see receivedEvents) — so a slow GET can't overwrite fresher event data.
      this.receivedEvents.clear();
      this.subscribeWebSocketEvent("OnJsonApiEvent");

      await Promise.allSettled([
        awaitReady(() => this.Runes.getRunePages()).then(runePages => {
          if (this.receivedEvents.has("runePages")) return;
          this.runePages = runePages;
          this.emit("rune-pages-update", this.runePages);
        }),
        awaitReady(() => this.getGameflowSession()).then(async gameflowSession => {
          if (this.receivedEvents.has("gameflow")) return;
          this.gameflowSession = gameflowSession;
          this.emit("gameflow-session-update", this.gameflowSession);
          this.emit("gameflow-phase-update", this.gameflowSession?.phase ?? "None");
        }),
        awaitReady(() => this.ChampSelect.getSession()).then(session => {
          if (this.receivedEvents.has("champSelect")) return;
          this.champSelectSession = session;
          this.emit("champ-select-session-update", session);
          this.emit("champ-select-phase-update", session.getPhase());
        }),
        awaitReady(() => this.getClientRegion()).then(regionLocale => {
          this.regionLocale = regionLocale;
        }),
        awaitReady(() => this.Lobby.getLobby()).then(lobby => {
          if (this.receivedEvents.has("lobby")) return;
          this.emit("lobby-update", lobby);
        }),
        awaitReady(() => this.request("get", "/lol-end-of-game/v1/eog-stats-block")).then(r => {
          if (this.receivedEvents.has("eog")) return;
          this.emit("end-of-game-data-received", r);
        }),
      ]);

      this.emit("ready");
      this.emit("connection-state-change", true);
    });

    this.on("disconnected", () => {
      this.champSelectSession = null;
      this.gameflowSession = null;
      this.runePages = [];
      this.regionLocale = null;

      this.emit("connection-state-change", false);
    });

    this.addLCUEventListener({
      // name: "OnJsonApiEvent_lol-lobby_v2_lobby",
      path: "/lol-lobby/v2/lobby",
      callback: (e) => this.onLobbyUpdate(e),
    });

    this.addLCUEventListener({
      // name: "OnJsonApiEvent_lol-end-of-game_v1_eog-stats-block",
      path: "/lol-end-of-game/v1/eog-stats-block",
      callback: (e) => this.onEndOfGameDataReceived(e),
    });

    this.addLCUEventListener({
      // name: "OnJsonApiEvent_lol-matchmaking_v1_search",
      path: "/lol-matchmaking/v1/search",
      callback: (e) => this.onMatchmakingSearchStateUpdate(e),
    });

    this.addLCUEventListener({
      // name: "OnJsonApiEvent_lol-champ-select_v1_session",
      path: "/lol-champ-select/v1/session",
      callback: (e) => this.onChampSelectSessionUpdate(e),
    });

    this.addLCUEventListener({
      path: "/lol-perks/v1/pages",
      callback: (e) => this.onRunePagesUpdate(e),
    });

    this.addLCUEventListener({
      path: "/lol-perks/v1/currentpage",
      callback: (e) => this.onCurrentRunePageUpdate(e),
    });

    this.addLCUEventListener({
      // name: "OnJsonApiEvent_lol-gameflow_v1_session",
      path: "/lol-gameflow/v1/session",
      callback: (e) => this.onGameflowSessionUpdate(e),
    });
  }


  public readonly ChampSelect = {
    getSession: this.buildRequest("get", "/lol-champ-select/v1/session", { transformResponse: res => new ChampSelectSession(res) }),
    getPhase: () => this.ChampSelect.getSession().then(session => session.getPhase()),
  } as const;

  public readonly getLobbyInvitations = this.buildRequest("get", "/lol-lobby/v2/received-invitations");
  public readonly acceptLobbyInvitation = this.buildRequest("post", "/lol-lobby/v2/received-invitations/{invitationId}/accept");
  public readonly declineLobbyInvitation = this.buildRequest("post", "/lol-lobby/v2/received-invitations/{invitationId}/decline");

  public readonly Lobby = {
    getLobby: this.buildRequest("get", "/lol-lobby/v2/lobby"),

    kickLobbyMember: this.buildRequest("post", "/lol-lobby/v2/lobby/members/{summonerId}/kick"),
    promoteLobbyMember: this.buildRequest("post", "/lol-lobby/v2/lobby/members/{summonerId}/promote"),
    grantLobbyMemberInvitePermission: this.buildRequest("post", "/lol-lobby/v2/lobby/members/{summonerId}/grant-invite"),
    revokeLobbyMemberInvitePermission: this.buildRequest("post", "/lol-lobby/v2/lobby/members/{summonerId}/revoke-invite"),

    sendInvitation: this.buildRequest("post", "/lol-lobby/v2/lobby/invitations"),

    /** Using this to automatically queue is forbidden. */
    startQueue: this.buildRequest("post", "/lol-lobby/v2/lobby/matchmaking/search"),
    stopQueue: this.buildRequest("delete", "/lol-lobby/v2/lobby/matchmaking/search"),

    setPositionPreferences: this.buildRequest("put", "/lol-lobby/v2/lobby/members/localMember/position-preferences"),
  } as const;

  /** Using this to automatically accept a ready check is forbidden. */
  public readonly acceptReadyCheck = this.buildRequest("post", "/lol-matchmaking/v1/ready-check/accept");
  public readonly declineReadyCheck = this.buildRequest("post", "/lol-matchmaking/v1/ready-check/decline");

  public readonly Runes = {
    getDisabledRunes: this.buildRequest("get", "/lol-perks/v1/perks/disabled"),
    setSelectedRunePage: this.buildRequest("put", "/lol-perks/v1/currentpage"),
    getSelectedRunePage: this.buildRequest("get", "/lol-perks/v1/currentpage"),

    createRunePage: this.buildRequest("post", "/lol-perks/v1/pages"),
    getRunePage: this.buildRequest("get", "/lol-perks/v1/pages/{id}"),
    deleteRunePage: this.buildRequest("delete", "/lol-perks/v1/pages/{id}"),
    replaceRunePage: (id: number, runePage: Partial<LCUEndpointBodyType<"post", "/lol-perks/v1/pages">>) => this.Runes.deleteRunePage(id).then(() => this.Runes.createRunePage(runePage as any)),

    getRunePages: this.buildRequest("get", "/lol-perks/v1/pages"),
  } as const;

  public readonly Inventory = {
    getOwnedSkins: this.buildRequest("get", "/lol-champions/v1/inventories/{summonerId}/skins-minimal", {
      transformParameters: async () => {
        const summoner = await this.getLocalSummoner();
        return [summoner.summonerId] as const;
      },
      transformResponse: res => res.filter(s => s.ownership.owned),
    }),
    getAllSkins: this.buildRequest("get", "/lol-champions/v1/inventories/{summonerId}/skins-minimal", {
      transformParameters: async () => {
        const summoner = await this.getLocalSummoner();
        return [summoner.summonerId] as const;
      },
    }),

    getOwnedChampions: this.buildRequest("get", "/lol-champions/v1/owned-champions-minimal"),
    getAllChampions: this.buildRequest("get", "/lol-champions/v1/inventories/{summonerId}/champions", {
      transformParameters: async () => {
        const summoner = await this.getLocalSummoner();
        return [summoner.summonerId] as const;
      },
    }),

    setLittleLegend: this.buildRequest("put", "/lol-cosmetics/v1/selection/companion"),

    setTFTBoom: this.buildRequest("put", "/lol-cosmetics/v1/selection/tft-damage-skin"),

    setTFTArena: this.buildRequest("put", "/lol-cosmetics/v1/selection/tft-map-skin"),

    setTFTLegend: this.buildRequest("put", "/lol-cosmetics/v1/selection/playbook"),

    getAccountLoadout: this.buildRequest("get", "/lol-loadouts/v4/loadouts/scope/account", { transformResponse: res => res[0] }),

    updateAccountLoadout: this.buildRequest("put", "/lol-loadouts/v4/loadouts/{id}", {
      transformParameters: async (body: LCUTypes.LolLoadoutsUpdateLoadoutDTO["loadout"]) => {
        let accountLoadout = await this.Inventory.getAccountLoadout() as LCUEndpointResponseType<"get", "/lol-loadouts/v4/loadouts/scope/account">[number];
        return [accountLoadout.id, { ...accountLoadout, loadout: { ...accountLoadout.loadout, ...body } }] as const;
      },
    }),

    setProfileIcon: this.buildRequest("put", "/lol-summoner/v1/current-summoner/icon", { transformParameters: (iconId: number) => [{ profileIconId: iconId } as any] as const }),
  } as const;

  public readonly getLocalSummoner = this.buildRequest("get", "/lol-summoner/v1/current-summoner");
  public readonly getLocalSummonerRankedData = this.buildRequest("get", "/lol-ranked/v1/current-ranked-stats");

  public readonly getSummonerByRiotId = this.buildRequest("get", "/lol-summoner/v1/alias/lookup");
  public readonly getSummonerById = this.buildRequest("get", "/lol-summoner/v1/summoners/{id}");
  public readonly getSummonersByIds = this.buildRequest("get", "/lol-summoner/v2/summoners");
  public readonly getCachedSummonerByPuuid = this.buildRequest("get", "/lol-summoner/v1/summoners-by-puuid-cached/{puuid}");

  public readonly downloadReplay = this.buildRequest("post", "/lol-replays/v1/rofls/{gameId}/download", { transformParameters: (gameId: number) => [gameId, { componentType: "replay-button_match-history" }] as const });

  public readonly watchReplay = this.buildRequest("post", "/lol-replays/v1/rofls/{gameId}/watch", { transformParameters: (gameId: number) => [gameId, { componentType: "replay-button_match-history" }] as const });

  public readonly getGameflowSession = this.buildRequest("get", "/lol-gameflow/v1/session");
  public readonly getGameflowPhase = this.buildRequest("get", "/lol-gameflow/v1/gameflow-phase");

  public readonly getMatchmakingSearchState = this.buildRequest("get", "/lol-matchmaking/v1/search");

  public readonly getClientRegion = this.buildRequest("get", "/riotclient/region-locale");

  public readonly sendNotification = this.buildRequest("post", "/player-notifications/v1/notifications", {
    transformParameters(title: string, message: string, options?: { backgroundUrl?: string; iconUrl?: string }) {
      return [
        {
          detailKey: "pre_translated_details",
          titleKey: "pre_translated_title",
          data: {
            title,
            details: message,
          },
          backgroundUrl: options?.backgroundUrl,
          iconUrl: options?.iconUrl,
        } as unknown as LCUTypes.PlayerNotificationsPlayerNotificationResource,
      ] as const;
    },
  });

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
      },
    }),
    deleteItemSet: (uid: string) => this.ItemSets.getItemSets().then(itemSets => this.ItemSets.setItemSets(itemSets.itemSets.filter(i => i.uid !== uid))),
    addItemSet: (itemSet: LCUEndpointResponseType<"get", "/lol-item-sets/v1/item-sets/{summonerId}/sets">["itemSets"][number]) => this.ItemSets.getItemSets().then(itemSets => this.ItemSets.setItemSets({ ...itemSets, itemSets: [...itemSets.itemSets, itemSet] })),
  } as const;

  // #region EventHandler
  private onChampSelectSessionUpdate(event: LCUTypes.PluginResourceEvent<unknown>) {
    this.receivedEvents.add("champSelect");
    if (event.eventType === "Delete") {
      this.champSelectSession = null;
      this.emit("champ-select-session-update", null);
      this.emit("champ-select-phase-update", null);
      return;
    }

    const oldSessionData = this.champSelectSession;
    const newSessionData = new ChampSelectSession(event.data as LCUEndpointResponseType<"get", "/lol-champ-select/v1/session">);
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
        this.emit("champ-select-local-player-pick-turn", newSessionData.ownPickActionId);
      }

      if (!oldSessionData.getActionById(oldSessionData.ownBanActionId)?.completed && newSessionData.getActionById(newSessionData.ownBanActionId)?.completed) {
        this.emit("champ-select-local-player-ban-completed", newSessionData.getActionById(newSessionData.ownBanActionId)!.championId);
      }

      const changedPickIntents: { puuid: string; previousPickIntent: number; pickIntent: number }[] = [];
      newSessionData.myTeam.forEach((p, index) => {
        // Team sizes can differ between sessions; skip members without an old counterpart.
        const previousMember = oldSessionData!.myTeam[index];
        if (!previousMember) return;
        const previousPickIntent = previousMember.championId !== 0 ? previousMember.championId : previousMember.championPickIntent;
        const pickIntent = p.championId !== 0 ? p.championId : p.championPickIntent;

        if (previousPickIntent !== pickIntent) {
          changedPickIntents.push({
            puuid: p.puuid,
            previousPickIntent,
            pickIntent,
          });
        }
      });

      changedPickIntents.forEach(changedPickIntent => this.emit("champ-select-pick-intent-change", changedPickIntent.puuid, changedPickIntent.pickIntent));

    } else {
      this.emit("champ-select-phase-update", newSessionData.getPhase());
    }

    const oldLocalPlayerData = oldSessionData?.getLocalPlayer() ?? null;
    const newLocalPlayerData = newSessionData.getLocalPlayer();
    const oldLocalPlayerPickAction = oldSessionData?.getActionById(oldSessionData.ownPickActionId) ?? null;
    const newLocalPlayerPickAction = newSessionData.getActionById(newSessionData.ownPickActionId);

    if (oldLocalPlayerPickAction === null && newLocalPlayerPickAction === null && (newLocalPlayerData?.championId ?? 0) !== (oldLocalPlayerData?.championId ?? 0))
      this.emit("champ-select-local-player-pick-completed", newLocalPlayerData!.championId);
    else if (oldLocalPlayerPickAction?.isInProgress && newLocalPlayerPickAction?.completed)
      this.emit("champ-select-local-player-pick-completed", newLocalPlayerData!.championId);
    else if (oldLocalPlayerPickAction?.completed && newLocalPlayerPickAction?.completed && oldLocalPlayerData?.championId !== newLocalPlayerData?.championId)
      this.emit("champ-select-local-player-pick-completed", newLocalPlayerData!.championId);
  }

  private onRunePagesUpdate(event: LCUTypes.PluginResourceEvent<unknown>) {
    if (event.eventType === "Update") {
      this.receivedEvents.add("runePages");
      this.runePages = event.data as LCUEndpointResponseType<"get", "/lol-perks/v1/pages">;
      this.emit("rune-pages-update", this.runePages);
    }
  }

  private onCurrentRunePageUpdate(event: LCUTypes.PluginResourceEvent<unknown>) {
    let updatedRunePage = event.data as LCUEndpointResponseType<"get", "/lol-perks/v1/pages">[number];
    let index = this.runePages.findIndex(rp => rp.id === updatedRunePage.id);
    let currentIndex = this.runePages.findIndex(rp => rp.current);
    if (currentIndex !== -1) this.runePages[currentIndex].current = false;
    if (index === -1) return;
    this.receivedEvents.add("runePages");
    this.runePages[index] = updatedRunePage;
    this.emit("rune-pages-update", this.runePages);
  }

  public currentQueue: LCUEndpointResponseType<"get", "/lol-gameflow/v1/session">["gameData"]["queue"] | null = null;
  public currentMap: LCUEndpointResponseType<"get", "/lol-gameflow/v1/session">["map"] | null = null;

  private async onGameflowSessionUpdate(event: LCUTypes.PluginResourceEvent<unknown>) {
    this.receivedEvents.add("gameflow");
    const oldGameflowSession = this.gameflowSession;
    switch (event.eventType) {
      case "Delete": {
        this.gameflowSession = null;
        break;
      }

      default: {
        this.gameflowSession = event.data as LCUEndpointResponseType<"get", "/lol-gameflow/v1/session">;
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
    this.receivedEvents.add("lobby");
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
        this.receivedEvents.add("eog");
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

  // #endregion
}
