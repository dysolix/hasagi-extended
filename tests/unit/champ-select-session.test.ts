import { describe, it, expect } from "vitest";
import type { LCUEndpointResponseType } from "@hasagi/core";
import ChampSelectSession from "../../src/classes/champ-select-session";

type Session = LCUEndpointResponseType<"get", "/lol-champ-select/v1/session">;

// Local fixture shapes covering only the fields ChampSelectSession reads. The generated endpoint
// type indexes loosely (and the class casts `data.actions as any`), so we model the inputs directly
// and cast the assembled payload to the endpoint type rather than indexing into it.
interface TestAction {
  actorCellId: number;
  championId: number;
  completed: boolean;
  id: number;
  isAllyAction: boolean;
  isInProgress: boolean;
  type: "ban" | "pick" | "ten_bans_reveal";
}

interface TestMember {
  cellId: number;
  puuid: string;
  assignedPosition: string;
  championId: number;
  championPickIntent: number;
}

interface SessionInput {
  localPlayerCellId?: number;
  hasSimultaneousPicks?: boolean;
  timer?: { phase: string };
  myTeam?: TestMember[];
  actions?: TestAction[][];
}

function action(overrides: Partial<TestAction>): TestAction {
  return {
    actorCellId: -1,
    championId: 0,
    completed: false,
    id: 0,
    isAllyAction: true,
    isInProgress: false,
    type: "pick",
    ...overrides,
  };
}

function member(overrides: Partial<TestMember>): TestMember {
  return {
    cellId: -1,
    puuid: "",
    assignedPosition: "",
    championId: 0,
    championPickIntent: 0,
    ...overrides,
  };
}

/**
 * Builds a champ-select session payload covering only the fields ChampSelectSession reads.
 * The result is cast to the full endpoint type — the unread fields are irrelevant to these tests.
 */
function makeSession(overrides: SessionInput = {}): Session {
  return {
    localPlayerCellId: 0,
    hasSimultaneousPicks: false,
    timer: { phase: "BAN_PICK" },
    myTeam: [
      member({ cellId: 0, puuid: "p0", assignedPosition: "top" }),
      member({ cellId: 1, puuid: "p1", assignedPosition: "utility" }),
    ],
    actions: [
      [
        action({ id: 5, type: "ten_bans_reveal", actorCellId: -1 }),
      ],
      [
        action({ id: 10, actorCellId: 0, type: "ban", championId: 84, completed: true }),
        action({ id: 11, actorCellId: 1, type: "ban", championId: 84, completed: true }),
      ],
      [
        action({ id: 20, actorCellId: 0, type: "pick", championId: 157, isInProgress: true }),
        action({ id: 21, actorCellId: 1, type: "pick", championId: 0 }),
      ],
    ],
    ...overrides,
  } as unknown as Session;
}

describe("ChampSelectSession constructor", () => {
  it("derives the local player's ban and pick action ids from actorCellId", () => {
    const session = new ChampSelectSession(makeSession());
    expect(session.ownBanActionId).toBe(10);
    expect(session.ownPickActionId).toBe(20);
  });

  it("collects the ids of all in-progress actions", () => {
    const session = new ChampSelectSession(makeSession());
    expect(session.inProgressActionIds).toEqual([20]);
  });

  it("leaves own action ids at -1 when the local player has no actions", () => {
    const session = new ChampSelectSession(makeSession({ localPlayerCellId: 99 }));
    expect(session.ownBanActionId).toBe(-1);
    expect(session.ownPickActionId).toBe(-1);
  });
});

describe("ChampSelectSession champion id helpers", () => {
  it("returns distinct picked champion ids", () => {
    const session = new ChampSelectSession(makeSession());
    expect(session.getPickedChampionIds()).toContain(157);
  });

  it("dedupes banned champion ids across action groups", () => {
    const session = new ChampSelectSession(makeSession());
    // Both ban actions banned champion 84 — it must appear only once.
    expect(session.getBannedChampionIds()).toEqual([84]);
  });
});

describe("ChampSelectSession action lookup", () => {
  it("finds an action by id", () => {
    const session = new ChampSelectSession(makeSession());
    expect(session.getActionById(20)?.type).toBe("pick");
  });

  it("returns null for an unknown action id", () => {
    const session = new ChampSelectSession(makeSession());
    expect(session.getActionById(999)).toBeNull();
  });

  it("finds the ten-bans-reveal action", () => {
    const session = new ChampSelectSession(makeSession());
    expect(session.getTenBansRevealAction()?.id).toBe(5);
  });

  it("returns null when there is no ten-bans-reveal action", () => {
    const session = new ChampSelectSession(makeSession({
      actions: [[action({ id: 1, type: "pick" })]],
    }));
    expect(session.getTenBansRevealAction()).toBeNull();
  });
});

describe("ChampSelectSession phase helpers", () => {
  it("exposes the timer phase", () => {
    expect(new ChampSelectSession(makeSession()).getPhase()).toBe("BAN_PICK");
  });

  it("reports pick phase when an in-progress pick action exists", () => {
    const session = new ChampSelectSession(makeSession());
    expect(session.isPickPhase()).toBe(true);
    expect(session.isBanPhase()).toBe(false);
  });

  it("reports ban phase when an in-progress, uncompleted ban action exists", () => {
    const session = new ChampSelectSession(makeSession({
      actions: [[action({ id: 30, actorCellId: 0, type: "ban", isInProgress: true })]],
    }));
    expect(session.isBanPhase()).toBe(true);
    expect(session.isPickPhase()).toBe(false);
  });

  it("treats simultaneous picks as non-draft", () => {
    expect(new ChampSelectSession(makeSession({ hasSimultaneousPicks: true })).isDraft()).toBe(false);
    expect(new ChampSelectSession(makeSession({ hasSimultaneousPicks: false })).isDraft()).toBe(true);
  });
});

describe("ChampSelectSession team member lookup", () => {
  it("looks up a member by cell id", () => {
    const session = new ChampSelectSession(makeSession());
    expect(session.getTeamMemberByCellId(1)?.puuid).toBe("p1");
  });

  it("returns null for an unknown cell id", () => {
    expect(new ChampSelectSession(makeSession()).getTeamMemberByCellId(99)).toBeNull();
  });

  it("resolves the local player from localPlayerCellId", () => {
    expect(new ChampSelectSession(makeSession()).getLocalPlayer()?.puuid).toBe("p0");
  });

  it("normalizes position aliases (support -> utility, case/whitespace insensitive)", () => {
    const session = new ChampSelectSession(makeSession());
    expect(session.getTeamMemberByPosition("support")?.cellId).toBe(1);
    expect(session.getTeamMemberByPosition("  UTILITY ")?.cellId).toBe(1);
    expect(session.getTeamMemberByPosition("top")?.cellId).toBe(0);
  });

  it("returns null when no member plays the requested position", () => {
    // "mid" normalizes to "middle", which nobody in the fixture is assigned.
    expect(new ChampSelectSession(makeSession()).getTeamMemberByPosition("mid")).toBeNull();
  });
});
