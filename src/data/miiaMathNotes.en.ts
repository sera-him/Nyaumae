// English mirror of the inline `paragraphs` / `highlights` / `redMarks` arrays
// in ../sections/MiiaMathNotes.tsx. Same order, same length.
// `@` is the girl's invented operator and is kept verbatim throughout;
// angle-bracket notation like <numbers, odd> mirrors <数，数是奇数>.

export const miiaMathParagraphsEn: string[] = [
  `I'm in 2nd grade now, and I'm thinking: 1 is odd, 3 is odd, 5 is odd... can there be a thing that decides by itself whether a number is odd? Then we could call it "odd-number check".`,
  `We can put these numbers together, and call it <numbers, odd>. So 1 is in <numbers, odd>, 2 is not in <numbers, odd>; every number knows by itself whether it is inside.`,
  `At our school, different scores get different star rewards: above 90 gives 40 stars, above 85 gives 37, above 80 gives 33, above 75 gives 30, above 70 gives 27, above 67 gives 23, above 65 gives 20, above 62 gives 17, above 60 gives 10, and failing gives no stars.`,
  `Important subjects get multiplied stars. For example, math class is 550 times stars, English class is 200 times stars. I'm thinking: we can design a thing where, from the score alone, you know how many stars you get. Let's call it "@stars". Like 99 @stars = 40, 80 @stars = 33, 64 @stars = 17...`,
  `We all learned the story of the tortoise and hare. The tortoise looks slow, but in the end it still reaches the finish line first. Can we use that for @? We can have time @ tortoise = distance, time @ hare = distance. For example, we can say time @ tortoise = time × 1 km per hour, and time @ hare = time × 10 km per hour for the first 6 minutes, = 1 km for minutes 6 to 116 (because the hare is sleeping), = 1 km + (time − 116 minutes) × 10 km per hour in the last few minutes.`,
  `If the distance is 2 km, we can work out that 120 minutes @ tortoise = 2 km, and 122 minutes @ hare = 2 km. So the tortoise is faster.`,
  `But if the distance is infinitely long, then the hare is faster. But after infinite time, who runs faster? Can we compare infinite time @ hare with infinite time @ tortoise? No. If two equally fast people race and one gets a head start, the race will always show the head-start person as faster — that's unfair.`,
  `What can we do? We use division. If they're equally fast, the division comes out to 1. That way any two people can race.`,
  `But I still feel like something is different. Like when something falls down, it keeps speeding up. Without air, no matter how fast you run, in the end you are not as fast as it. (infinite time @ you) / (infinite time @ falling thing) = 0. This 0 shows that no matter how fast you are, after infinite time you still can't outrun it.`,
  `That <numbers, odd> from before — can we fill it with other things? Let me try, and turn it into <@ thing, rule>. Let's play, and put these things together.`,
  `Let all our games satisfy this rule: a game = <@ thing one, @ thing two exists inside the game, (infinite time @ thing one) / (infinite time @ thing two) = 0>. All games are different from each other. Let a game @ game-classify = @ one thing: (infinite time @ anything in the game) / (infinite time @ this thing) is not 0, and (infinite time @ this thing) / (infinite time @ anything not in the game) is not 0.`,
  `I found that between different such things, at infinite time they are never 0. Isn't that fun? We call them an @-class.`,
  `The bad news is that sometimes some of these divisions can't be worked out, and any that can't be worked out are all bad @; we can skip them. Wiggling around still counts as working it out, as long as it stays in one of 0 / infinity / something else, it counts as worked out and can wiggle however it likes.`,
  `I counted, and I found there are lots of @-classes. How many? So many that even if I turned all the numbers 1, 2, 3, 4, 5... into little paper slips to label @-classes, no matter how I label them, there would always be plenty of @-classes left without labels.`,
  `I counted again: good @ and bad @ are both even more numerous than @-classes. Even using all the @-classes, no matter how you label them, you can't label them all. But good @, bad @, and all @ — when labeling among themselves, they can all be labeled completely.`,
  `Actually, @ splits into two kinds: one where the front is a number, and one where the front isn't a number, like @ game-classify. The second kind has even more of them.`,
  `I found that even something as big as @ can line up in a queue. Lining up means we can build a robot, and no matter which two people you pick, the robot can tell you who stands in front. And the robot also discovered a secret: if A stands in front of B and B stands in front of C, then A must stand in front of C, no need to ask again! Just like how I stand in front of Xiao Hong and Xiao Hong stands in front of Xiao Gang — then I must stand in front of Xiao Gang, right? Why even compare?`,
  `How can we make the robot tell us faster? We can use the fastest chip. But the fastest chip is really expensive. So we can only buy very small fastest chips. To speed it up, we can make it work like the subway: upload on both sides, download in the middle.`,
  `Upload and download to the second-fastest chip, and the second-fastest chip can be a bit bigger. Then to the third-fastest chip, which is bigger still, and so on. The engineers need to squeeze as many things as possible into the fastest chip. Best of all, every thing can be @'d to get a position, so we can find it right away.`,
  `But the fastest chip is too small. Because of the birthday paradox, useful data often gets pushed out, and then we have to go fetch it from a slower chip. Engineers want to reduce how often we fetch from slower chips, because every fetch costs a lot of time.`,
  `So we could just throw things in randomly, but then to use it we'd have to look through the whole fastest chip, which is still no good. So engineers invented several different @s. Each thing first uses the first @; if there's already something there, try another @; only when they're all occupied does something get pushed out. That way the robot can tell you the fastest which of these two things stands in front.`,
];

// Must appear verbatim in miiaMathParagraphsEn so the <mark> highlight still hits.
export const miiaMathHighlightsEn: string[] = [
  'odd',          // 数是奇数
  '@stars',       // @星星
  'tortoise and hare', // 龟兔赛跑
  'infinite time',     // 无限时间
  '@-class',      // 艾特分类
  'bad @',        // 坏@
  'birthday paradox',  // 生日悖论
  'robot',        // 机器人
];

// Must appear verbatim in miiaMathParagraphsEn so the red-circle still hits.
export const miiaMathRedMarksEn: string[] = [
  'unfair',   // 不公平
  'infinity', // 无穷大
];
