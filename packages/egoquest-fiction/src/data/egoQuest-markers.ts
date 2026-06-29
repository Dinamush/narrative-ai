import type {
  BirthOrderType,
  CoreWoundType,
  FamilyRoleType,
} from "../types.js"

export const EGO_QUEST_CORE_WOUND_MARKERS: Record<CoreWoundType, readonly string[]> = {
  rejection: [
    "unwanted", "misunderstood", "don't belong", "not belong", "excluded", "rejected",
    "outsider", "alienated", "never fit in", "not accepted", "pushed away",
    "they never got me", "nobody gets me", "feel unwanted",
  ],
  abandonment: [
    "abandoned", "left behind", "betrayed", "ghosted", "deserted", "walked out",
    "afraid they will leave", "fear of leaving", "people always leave", "left alone",
    "won't stay", "leave me", "being left", "attachment anxiety",
  ],
  insignificance: [
    "unseen", "invisible", "overlooked", "undervalued", "don't matter", "ignored",
    "nobody notices", "forgotten", "insignificant", "small and unnoticed",
    "never chosen", "passed over", "in the background",
  ],
  failure: [
    "not good enough", "incompetent", "inadequate", "imposter", "mess up", "failing",
    "can't do it right", "always failing", "not capable", "fall short", "never enough",
    "fear of failure", "afraid to fail", "disappoint everyone",
  ],
  vulnerability: [
    "powerless", "controlled", "trapped", "helpless", "weak", "manipulated",
    "can't protect", "at their mercy", "no control", "dominated", "exposed",
    "afraid of being hurt", "can't defend", "unsafe",
  ],
}

export const EGO_QUEST_SOCIAL_MASK_MARKERS = {
  laughing: [
    "make a joke", "kidding", "banter", "witty", "playful", "lighthearted", "sarcasm",
    "deflect with humor", "make people laugh", "clown around", "keep it light",
    "jester", "trickster", "disarming humor", "cracking jokes", "play the fool",
  ],
  crying: [
    "heavy burden", "solemn", "grave", "stoic", "carry the weight", "must be strong",
    "can't show weakness", "serious all the time", "tragic", "burdened",
    "responsible for everyone", "the responsible one", "never light", "always serious",
  ],
  adaptive: [
    "different persona", "switch personas", "perform for", "image management",
    "different around", "adapt my personality", "wear a mask", "social mask",
    "who i am depends on", "chameleon in social",
  ],
} as const

export const EGO_QUEST_BIRTH_ORDER_MARKERS: Record<BirthOrderType, readonly string[]> = {
  firstborn: [
    "oldest child", "firstborn", "first child", "dethroned", "set the example",
    "responsible sibling", "older sibling", "always had to lead", "parentified",
  ],
  middle: [
    "middle child", "sandwiched", "peacemaker between", "negotiate between siblings",
    "forgotten middle", "in the middle", "mediator in the family",
  ],
  youngest: [
    "youngest child", "baby of the family", "youngest sibling", "always the baby",
    "youngest got away", "attention seeking youngest", "spoiled youngest",
  ],
  only: [
    "only child", "grew up alone", "only kid", "no siblings", "spent time with adults",
    "mature for my age", "only one at home",
  ],
}

export const EGO_QUEST_FAMILY_ROLE_MARKERS: Record<FamilyRoleType, readonly string[]> = {
  hero: [
    "family hero", "golden child", "made parents proud", "achiever for the family",
    "held the family together", "success for the family", "parent's pride",
  ],
  scapegoat: [
    "black sheep", "scapegoat", "blamed for everything", "family troublemaker",
    "problem child", "family rebel", "took the blame", "identified patient",
  ],
  lost_child: [
    "lost child", "invisible in the family", "stayed quiet at home", "avoided conflict at home",
    "hid in my room", "nobody noticed me at home", "quiet one in the family",
  ],
  mascot: [
    "family clown", "mascot", "diffused tension", "made everyone laugh at home",
    "comic relief at home", "lightened the mood at home", "family entertainer",
  ],
}

export const EGO_QUEST_DIFFERENTIATION_MARKERS = {
  fused: [
    "chameleon", "absorb their emotions", "enmeshed", "merge with", "can't separate",
    "where i end", "family mood", "take on their feelings", "lose myself in",
    "no boundaries with family", "fused with", "emotional contagion",
  ],
  differentiated: [
    "own opinion despite", "separate identity", "emotional boundaries", "think for myself",
    "differentiation of self", "not defined by family", "maintain my stance",
    "self defined", "independent from family", "clear boundaries",
  ],
} as const

export const EGO_QUEST_SHADOW_MARKERS = [
  "rage", "fury", "lost control", "snapped", "violent", "destroyed", "betrayed them",
  "couldn't stop", "dark side", "something broke", "unrecognizable", "monstrous",
  "cold and cruel", "merciless", "vengeance", "wrath",
] as const

export const EGO_QUEST_MECHANISM_LABELS: Record<string, string> = {
  coreWound: "Core wound language",
  socialMask: "Social mask performance",
  birthOrder: "Birth order narrative",
  familyRole: "Family systems role",
  differentiation: "Differentiation of self",
  shadow: "Shadow activation",
}
