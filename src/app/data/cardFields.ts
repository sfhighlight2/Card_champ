// Reference vocabularies for the card forms, and the grader brand colours the
// tiles and badges paint with. Not mock data — the collection itself now comes
// from Supabase, and these are the fixed option lists the pickers offer.
//
// `GRADERS` mirrors the `code` column of the seeded `grading_companies` table;
// `repositories.lookupGraderId` resolves a code back to its row.

export const GRADER_COLOR: Record<string, string> = {
  PSA:  "#E01F26",
  BGS:  "#1A1A1A",
  CGC:  "#1D4FA1",
  SGC:  "#111111",
  TAG:  "#6B7280",
  FWrk: "#111111",
};

// `folders.color` is constrained to `^#[0-9a-fA-F]{6}$`, so three-digit
// shorthand is rejected by the database. "#111" used to sit first here and is
// what NewFolderSheet defaults to, which made creating a folder with the default
// swatch fail outright.
export const FOLDER_COLORS = ["#111111", "#1a6cc4", "#c9a84c", "#c42020", "#2a9d8f", "#e76f51", "#6a4c93"];

/** Mirrors the `folders_color_check` constraint. */
export const FOLDER_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

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
