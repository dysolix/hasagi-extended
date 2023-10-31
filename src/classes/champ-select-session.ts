import { LCUEndpointResponseType, LCUTypes } from "@hasagi/core";

export default class ChampSelectSession implements LCUEndpointResponseType<"get", "/lol-champ-select/v1/session"> {
    gameId: number;
    timer: LCUTypes.LolChampSelectChampSelectTimer;
    chatDetails: LCUTypes.LolChampSelectChampSelectChatRoomDetails;
    myTeam: LCUTypes.LolChampSelectChampSelectPlayerSelection[];
    theirTeam: LCUTypes.LolChampSelectChampSelectPlayerSelection[];
    trades: LCUTypes.LolChampSelectChampSelectTradeContract[];
    pickOrderSwaps: LCUTypes.LolChampSelectChampSelectSwapContract[];
    actions: {
        actorCellId: number;
        championId: number;
        completed: boolean;
        id: number;
        isAllyAction: boolean;
        isInProgress: boolean;
        type: "ban" | "pick" | "ten_bans_reveal";
    }[][];
    bans: LCUTypes.LolChampSelectChampSelectBannedChampions;
    localPlayerCellId: number;
    isSpectating: boolean;
    allowSkinSelection: boolean;
    allowDuplicatePicks: boolean;
    allowBattleBoost: boolean;
    boostableSkinCount: number;
    allowRerolling: boolean;
    rerollsRemaining: number;
    allowLockedEvents: boolean;
    lockedEventIndex: number;
    benchEnabled: boolean;
    benchChampions: LCUTypes.LolChampSelectBenchChampion[];
    counter: number;
    recoveryCounter: number;
    skipChampionSelect: boolean;
    hasSimultaneousBans: boolean;
    hasSimultaneousPicks: boolean;
    isCustomGame: boolean;

    ownBanActionId: number;
    ownPickActionId: number;
    inProgressActionIds: number[];

    constructor(data: LCUEndpointResponseType<"get", "/lol-champ-select/v1/session">) {
        this.ownBanActionId = -1;
        this.ownPickActionId = -1;
        this.inProgressActionIds = [];

        this.actions = data.actions as any;
        this.allowBattleBoost = data.allowBattleBoost;
        this.allowDuplicatePicks = data.allowDuplicatePicks;
        this.allowLockedEvents = data.allowLockedEvents;
        this.allowRerolling = data.allowRerolling;
        this.allowSkinSelection = data.allowSkinSelection;
        this.benchChampions = data.benchChampions;
        this.benchEnabled = data.benchEnabled;
        this.boostableSkinCount = data.boostableSkinCount;
        this.chatDetails = data.chatDetails;
        this.counter = data.counter;
        this.gameId = data.gameId;
        this.hasSimultaneousBans = data.hasSimultaneousBans;
        this.hasSimultaneousPicks = data.hasSimultaneousPicks;
        this.isSpectating = data.isSpectating;
        this.localPlayerCellId = data.localPlayerCellId;
        this.lockedEventIndex = data.lockedEventIndex;
        this.myTeam = data.myTeam;
        this.recoveryCounter = data.recoveryCounter;
        this.rerollsRemaining = data.rerollsRemaining;
        this.skipChampionSelect = data.skipChampionSelect;
        this.theirTeam = data.theirTeam;
        this.timer = data.timer;
        this.trades = data.trades;
        this.isCustomGame = data.isCustomGame;
        this.bans = data.bans;
        this.pickOrderSwaps = data.pickOrderSwaps;

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

    getPhase(): 'PLANNING' | 'BAN_PICK' | 'FINALIZATION' | '' {
        return this.timer.phase as any;
    }

    isBanPhase(){
        for(let actionId of this.inProgressActionIds){
            let action = this.getActionById(actionId);
            if(action?.isInProgress && action?.type === "ban" && !action?.completed)
                return true;
        }

        return false;
    }

    isPickPhase(){
        for(let actionId of this.inProgressActionIds){
            let action = this.getActionById(actionId);
            if(action?.isInProgress && action?.type === "pick" && !action?.completed)
                return true;
        }

        return false;
    }

    isDraft(){
        return this.hasSimultaneousPicks;
    }

    getActionById(id: number) {
        for (let actionGroup of this.actions)
            for (let action of actionGroup)
                if (action.id == id)
                    return action;

        return null;
    }

    getTenBansRevealActionId(): number | null {
        for (let actionGroup of this.actions)
            for (let action of actionGroup)
                if (action.type === "ten_bans_reveal")
                    return action.id;

        return null;
    }

    getTeamMemberByPosition(position: 'top' | 'jungle' | 'middle' | 'bottom' | 'utility' | string) {
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