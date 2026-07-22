import type { MessageThread } from "../types";
import { ME } from "../types";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const now = Date.now();

export const MOCK_THREADS: MessageThread[] = [
  {
    peerHandle: "@loganpaul",
    messages: [
      { id: 1, senderHandle: "@loganpaul", body: "Yo, saw you're chasing the '52 Mantle too \u{1F440}", createdAt: now - 2 * DAY },
      { id: 2, senderHandle: ME, body: "Haha yeah, been hunting that one for years. You close?", createdAt: now - 2 * DAY + HOUR },
      { id: 3, senderHandle: "@loganpaul", body: "Got a lead on a PSA 8 — want in?", createdAt: now - 1 * DAY },
    ],
  },
  {
    peerHandle: "@garyvee",
    messages: [
      { id: 1, senderHandle: "@garyvee", body: "Found a guy selling a clean Ohtani rookie lot — you still buying?", createdAt: now - 6 * DAY },
      { id: 2, senderHandle: ME, body: "Thanks! Took forever to track that down.", createdAt: now - 5 * DAY },
    ],
  },
];
