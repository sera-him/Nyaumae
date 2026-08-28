import { fullSearchIndex } from "./src/data/fullSearchIndex.ts";

console.log("TOTAL_ITEMS", fullSearchIndex.length);
const friendHits = fullSearchIndex.filter(it => {
  const segs = (it.frequencySegments ?? []).join(" ").toLowerCase();
  const content = (it.content ?? "").toLowerCase();
  return segs.includes("friend") || content.toLowerCase().includes("friend");
});
console.log("FRIEND_HITS_ITEMS", friendHits.length);
for (const it of friendHits.slice(0,20)) {
  console.log(it.id, it.title, "segments:", (it.frequencySegments ?? []).slice(0,3).join(" | ").slice(0,200), " content_snippet:", it.content.slice(0,200).replace(/\n/g," "));
}
 // also check documentsBy logic later
 // dump all ids
