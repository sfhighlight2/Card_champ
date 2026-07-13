import type { Card, FolderType } from "../types";
import {
  card1, card2, card3, card4, card5, card6,
  card7, card8, card9, card10, card11, card12,
} from "./cardImages";

export const ALL_CARDS: Card[] = [
  { id: 1,  img: card1,  player: "Bo Jackson",       year: "1986", brand: "Topps",        team: "Royals",   grader: "PSA",  grade: "1",   gradeLabel: "Good",     cert: "068264764", value: 320,  change: +4,  subGrades: null,                                                              autograph: false, popReport: 4821, sellPrice: 380  },
  { id: 2,  img: card2,  player: "Bo Jackson",       year: "1986", brand: "Topps Traded", team: "Royals",   grader: "PSA",  grade: "10",  gradeLabel: "Gem Mint", cert: "22365223",  value: 1745, change: +7,  subGrades: null,                                                              autograph: false, popReport: 1152, sellPrice: 2000 },
  { id: 3,  img: card3,  player: "Rickey Henderson", year: "1980", brand: "Topps",        team: "Athletics",grader: "PSA",  grade: "1",   gradeLabel: "Good",     cert: "068264764", value: 185,  change: -2,  subGrades: null,                                                              autograph: false, popReport: 3290, sellPrice: 210  },
  { id: 4,  img: card4,  player: "Gary Nolan",       year: "1978", brand: "Topps",        team: "Angels",   grader: "BGS",  grade: "9",   gradeLabel: "Mint",     cert: "004295496", value: 95,   change: +1,  subGrades: { centering: "9", corners: "9.5", edges: "9.5", surface: "10" }, autograph: true,  popReport: 88,   sellPrice: 115  },
  { id: 5,  img: card5,  player: "John Montague",    year: "1978", brand: "Topps",        team: "Mariners", grader: "FWrk", grade: "9",   gradeLabel: "Mint",     cert: "FW-2023-001",value: 42,  change: 0,   subGrades: { centering: "9.5", corners: "8.5", edges: "9", surface: "9" },  autograph: false, popReport: 142,  sellPrice: 50   },
  { id: 6,  img: card6,  player: "Bo Jackson",       year: "1986", brand: "Topps",        team: "Royals",   grader: "PSA",  grade: "1",   gradeLabel: "Good",     cert: "068264765", value: 310,  change: +3,  subGrades: null,                                                              autograph: false, popReport: 4821, sellPrice: 365  },
  { id: 7,  img: card7,  player: "Shohei Ohtani",    year: "2022", brand: "Bowman",       team: "Dodgers",  grader: "FWrk", grade: "9.5", gradeLabel: "Mint+",    cert: "5625404",   value: 890,  change: +22, subGrades: null,                                                              autograph: false, popReport: 2104, sellPrice: 1050 },
  { id: 8,  img: card8,  player: "Mickey Mantle",    year: "1952", brand: "Topps",        team: "Yankees",  grader: "SGC",  grade: "9.5", gradeLabel: "Mint+",    cert: "364764",    value: 4200, change: +8,  subGrades: { centering: "9.5", corners: "9.5", edges: "9.5", surface: "9.5" },autograph: false, popReport: 23,   sellPrice: 4800 },
  { id: 9,  img: card9,  player: "Mickey Mantle",    year: "1954", brand: "Bowman",       team: "Yankees",  grader: "PSA",  grade: "1",   gradeLabel: "Good",     cert: "068264764", value: 620,  change: +5,  subGrades: null,                                                              autograph: false, popReport: 312,  sellPrice: 720  },
  { id: 10, img: card10, player: "Mickey Hatcher",   year: "1986", brand: "Fleer",        team: "Rangers",  grader: "FWrk", grade: "9.5", gradeLabel: "Mint+",    cert: "5625405",   value: 38,   change: 0,   subGrades: null,                                                              autograph: false, popReport: 67,   sellPrice: 45   },
  { id: 11, img: card11, player: "Jim York",         year: "1975", brand: "Topps",        team: "Astros",   grader: "SGC",  grade: "9.5", gradeLabel: "Mint+",    cert: "364765",    value: 55,   change: +1,  subGrades: { centering: "9.5", corners: "9.5", edges: "9.5", surface: "9.5" },autograph: false, popReport: 44,   sellPrice: 65   },
  { id: 12, img: card12, player: "Don Baylor",       year: "1975", brand: "Topps",        team: "Orioles",  grader: "PSA",  grade: "1",   gradeLabel: "Good",     cert: "068264766", value: 42,   change: -1,  subGrades: null,                                                              autograph: false, popReport: 1876, sellPrice: 48   },
];

export const GRADER_COLOR: Record<string, string> = {
  PSA:  "#E01F26",
  BGS:  "#1A1A1A",
  CGC:  "#1D4FA1",
  SGC:  "#111111",
  TAG:  "#6B7280",
  FWrk: "#111111",
};

export const FOLDER_COLORS = ["#111", "#1a6cc4", "#c9a84c", "#c42020", "#2a9d8f", "#e76f51", "#6a4c93"];

export const DEFAULT_FOLDERS: FolderType[] = [
  { id: 1, name: "Rookies", color: "#1a6cc4", cardIds: [1, 6] },
  { id: 2, name: "Hall of Fame", color: "#c9a84c", cardIds: [2, 3] },
];

export const GRADERS = ["PSA", "BGS", "SGC", "CGC", "TAG", "FWrk"];
export const GRADES  = ["1","1.5","2","2.5","3","3.5","4","4.5","5","5.5","6","6.5","7","7.5","8","8.5","9","9.5","10"];
export const GRADE_LABELS: Record<string, string> = {
  "1":"Poor","1.5":"Fair","2":"Good","2.5":"Good+","3":"VG","3.5":"VG+",
  "4":"VG-EX","4.5":"VG-EX+","5":"EX","5.5":"EX+","6":"EX-MT","6.5":"EX-MT+",
  "7":"NM","7.5":"NM+","8":"NM-MT","8.5":"NM-MT+","9":"Mint","9.5":"Mint+","10":"Gem Mint",
};
export const ALL_YEARS = Array.from({ length: 76 }, (_, i) => String(2025 - i)); // 2025 → 1950

export const BRANDS_BY_YEAR = (y: number): string[] => {
  if (y <= 1954) return ["Topps","Bowman"];
  if (y <= 1959) return ["Topps"];
  if (y <= 1980) return ["Topps","Fleer","Kellogg's"];
  if (y <= 1988) return ["Topps","Fleer","Donruss","Score"];
  if (y <= 1993) return ["Topps","Fleer","Donruss","Upper Deck","Score","Bowman","Leaf"];
  if (y <= 2000) return ["Topps","Fleer","Donruss","Upper Deck","Score","Bowman","Pacific","Leaf","Skybox"];
  if (y <= 2009) return ["Topps","Bowman","Upper Deck","Fleer","Donruss","Leaf"];
  return ["Topps","Bowman","Panini","Leaf"];
};

export const ALL_TEAMS = ["Angels","Astros","Athletics","Blue Jays","Braves","Brewers","Cardinals","Cubs","Dodgers","Giants","Indians","Mariners","Marlins","Mets","Nationals","Orioles","Padres","Phillies","Pirates","Rangers","Red Sox","Reds","Rockies","Royals","Tigers","Twins","White Sox","Yankees"];
