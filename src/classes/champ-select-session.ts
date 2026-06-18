import { LCUEndpointResponseType, LCUTypes } from "@hasagi/core";

export default class ChampSelectSession implements LCUEndpointResponseType<"get", "/lol-champ-select/v1/session"> {
  // Fields sourced verbatim from the endpoint payload are `declare`d (ambient): they carry no runtime
  // initializer and are populated in one pass by `Object.assign(this, data)` in the constructor. The
  // `implements` clause still forces this list to track the LCU type at compile time.
  declare gameId: number;
  declare actions: {
    actorCellId: number;
    championId: number;
    completed: boolean;
    id: number;
    isAllyAction: boolean;
    isInProgress: boolean;
    type: "ban" | "pick" | "ten_bans_reveal";
  }[][];
  declare localPlayerCellId: number;
  declare isSpectating: boolean;
  declare allowSkinSelection: boolean;
  declare allowDuplicatePicks: boolean;
  declare allowBattleBoost: boolean;
  declare boostableSkinCount: number;
  declare allowRerolling: boolean;
  declare rerollsRemaining: number;
  declare allowLockedEvents: boolean;
  declare lockedEventIndex: number;
  declare benchEnabled: boolean;
  declare counter: number;
  declare skipChampionSelect: boolean;
  declare hasSimultaneousBans: boolean;
  declare hasSimultaneousPicks: boolean;
  declare isCustomGame: boolean;

  // Derived in the constructor from `actions` — not present on the endpoint payload.
  ownBanActionId: number;
  ownPickActionId: number;
  inProgressActionIds: number[];

  declare showQuitButton: boolean;
  declare isLegacyChampSelect: boolean;

  declare allowSubsetChampionPicks: boolean;
  declare allowPlayerPickSameChampion: boolean;
  declare disallowBanningTeammateHoveredChampions: boolean;
  declare queueId: number;

  declare bans: LCUTypes.TeamBuilderDirect_ChampSelectBannedChampions;
  declare id: string;
  declare timer: LCUTypes.TeamBuilderDirect_TeambuilderDirectTypes_ChampSelectTimer;
  declare chatDetails: LCUTypes.TeamBuilderDirect_ChampSelectChatRoomDetails;
  declare myTeam: LCUTypes.TeamBuilderDirect_ChampSelectPlayerSelection[];
  declare theirTeam: LCUTypes.TeamBuilderDirect_ChampSelectPlayerSelection[];
  declare trades: LCUTypes.TeamBuilderDirect_ChampSelectSwapContract[];
  declare pickOrderSwaps: LCUTypes.TeamBuilderDirect_ChampSelectSwapContract[];
  declare positionSwaps: LCUTypes.TeamBuilderDirect_ChampSelectSwapContract[];
  declare benchChampions: LCUTypes.TeamBuilderDirect_BenchChampion[];

  constructor(data: LCUEndpointResponseType<"get", "/lol-champ-select/v1/session">) {
    // Copy every endpoint field onto the instance in a single pass. Previously each field was
    // assigned by hand, which had to be kept in sync with both the type and the LCU payload —
    // a forgotten line silently dropped that field. The `declare`d field list above is the single
    // source of truth the `implements` clause checks against.
    Object.assign(this, data);

    this.ownBanActionId = -1;
    this.ownPickActionId = -1;
    this.inProgressActionIds = [];

    for (let actionGroup of this.actions)
      for (let action of actionGroup) {
        if (action.isInProgress)
          this.inProgressActionIds.push(action.id);
        if (action.actorCellId === data.localPlayerCellId) {
          if (action.type === "ban") {
            this.ownBanActionId = action.id;
          } else if (action.type === "pick") {
            this.ownPickActionId = action.id;
          }
        }
      }
  }

  getPickedChampionIds(): number[] {
    let picked: number[] = [];

    for (let actionGroup of this.actions)
      for (let action of actionGroup)
        if (action.type === "pick" && !picked.includes(action.championId)) {
          picked.push(Number(action.championId));
        }

    return picked;
  }

  getBannedChampionIds(): number[] {
    let banned: number[] = [];

    for (let actionGroup of this.actions)
      for (let action of actionGroup)
        if (action.type === "ban" && !banned.includes(action.championId)) {
          banned.push(Number(action.championId));
        }

    return banned;
  }

  getPhase(): "PLANNING" | "BAN_PICK" | "FINALIZATION" | "" {
    return this.timer.phase as "PLANNING" | "BAN_PICK" | "FINALIZATION" | "";
  }

  isBanPhase() {
    for (let actionId of this.inProgressActionIds) {
      let action = this.getActionById(actionId);
      if (action?.isInProgress && action?.type === "ban" && !action?.completed)
        return true;
    }

    return false;
  }

  isPickPhase() {
    for (let actionId of this.inProgressActionIds) {
      let action = this.getActionById(actionId);
      if (action?.isInProgress && action?.type === "pick" && !action?.completed)
        return true;
    }

    return false;
  }

  isDraft() {
    return !this.hasSimultaneousPicks;
  }

  getActionById(id: number) {
    for (let actionGroup of this.actions)
      for (let action of actionGroup)
        if (action.id == id)
          return action;

    return null;
  }

  getTenBansRevealAction() {
    for (let actionGroup of this.actions)
      for (let action of actionGroup)
        if (action.type === "ten_bans_reveal")
          return action;

    return null;
  }

  getTeamMemberByPosition(position: "top" | "jungle" | "middle" | "bottom" | "utility" | string) {
    position = position.trim().toLowerCase();
    if (position === "support")
      position = "utility";
    if (position === "mid")
      position = "middle";
    if (position === "adc")
      position = "bottom";

    for (let teamMember of this.myTeam) {
      if (teamMember.assignedPosition === position)
        return teamMember;
    }

    return null;
  }

  getTeamMemberByCellId(cellId: number) {
    for (let teamMember of this.myTeam) {
      if (teamMember.cellId === cellId)
        return teamMember;
    }

    return null;
  }

  getLocalPlayer() {
    return this.getTeamMemberByCellId(this.localPlayerCellId);
  }
}
