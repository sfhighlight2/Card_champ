import type { Peer, SuggestedPeer } from "../types";
import {
  loganPaul, barbaraCorcoran, garyVee, kevinOLeary,
  card1, card2, card3, card4, card5, card6, card7, card8, card9, card10, card11, card12,
} from "./cardImages";

export const PEERS: Peer[] = [
  {
    name: "Logan Paul", handle: "@loganpaul", cards: 142, value: 284000, avatar: loganPaul, badge: "Top Collector", verified: true,
    topCards: [card8, card7, card2], snapshot: [card8, card7, card2, card9, card1, card3],
    specialty: "Yankees · Modern",
  },
  {
    name: "Barbara Corcoran", handle: "@barbaracorcoran", cards: 67, value: 93000, avatar: barbaraCorcoran, badge: "Top Collector", verified: false,
    topCards: [card2, card8, card11], snapshot: [card2, card8, card11, card4, card6, card5],
    specialty: "HOF · Vintage",
  },
  {
    name: "Gary Vee", handle: "@garyvee", cards: 318, value: 520000, avatar: garyVee, badge: "Top Collector", verified: true,
    topCards: [card8, card2, card7], snapshot: [card8, card2, card7, card9, card3, card12],
    specialty: "Graded · Investment",
  },
  {
    name: "Kevin O'Leary", handle: "@kevinoleary", cards: 89, value: 176000, avatar: kevinOLeary, badge: "Trending", verified: false,
    topCards: [card7, card8, card2], snapshot: [card7, card8, card2, card11, card4, card10],
    specialty: "ROI · Rare Finds",
  },
];

export const SUGGESTED: SuggestedPeer[] = [
  { name: "DJ Khaled", handle: "@djkhaled", cards: 203, avatar: card8 },
  { name: "Meek Mill", handle: "@meekmill", cards: 87, avatar: card7 },
  { name: "Lil Baby", handle: "@lilbaby", cards: 54, avatar: card2 },
  { name: "Pat McAfee", handle: "@patmcafee", cards: 121, avatar: card3 },
  { name: "Rich Paul", handle: "@richpaul", cards: 178, avatar: card9 },
];
