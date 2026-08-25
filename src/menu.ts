import type { Category, MenuItem } from "./types";

export const categoryLabels: Record<Category, string> = {
  bento: "炭火便當",
  extra: "加料",
  soup: "湯與小菜",
  drink: "飲料",
};

export const menu: MenuItem[] = [
  {
    id: "pork-loin",
    category: "bento",
    name: "炭烤里肌飯",
    desc: "薄切里肌肉兩面上炭，刷宜蘭醬油膏，蓋在剛盛的熱白飯上。無骨、好入口，外帶最常點。",
    price: 95,
    popular: true,
    tags: ["招牌"],
  },
  {
    id: "pork-belly",
    category: "bento",
    name: "炭烤五花飯",
    desc: "五花帶脂，炭火逼出焦香。肥瘦交疊，飯粒會沾到醬。",
    price: 105,
    popular: true,
    tags: ["肥瘦"],
  },
  {
    id: "pork-rib",
    category: "bento",
    name: "炭烤排骨飯",
    desc: "帶骨大片排骨，厚度剛好有咬勁。刷醬偏鹹香，配辣菜脯最對。",
    price: 110,
    popular: true,
    tags: ["帶骨"],
  },
  {
    id: "chicken",
    category: "bento",
    name: "炭烤雞腿飯",
    desc: "去骨雞腿排炭烤至皮面微焦，肉汁還在。想換豬肉就點這個。",
    price: 115,
    tags: ["雞肉"],
  },
  {
    id: "combo",
    category: "bento",
    name: "雙拼烤肉飯",
    desc: "里肌加五花各半。一餐要兩種口感、又不想點兩份時。",
    price: 130,
    tags: ["雙拼"],
  },
  {
    id: "extra-pork",
    category: "extra",
    name: "加烤肉",
    desc: "再加一份當日炭烤肉片，飯量不夠或想吃肉的人。",
    price: 45,
    tags: [],
  },
  {
    id: "tea-egg",
    category: "extra",
    name: "滷蛋",
    desc: "茶香滷蛋，切開是深色入味。",
    price: 15,
    tags: [],
  },
  {
    id: "fried-egg",
    category: "extra",
    name: "荷包蛋",
    desc: "半熟蛋黃，戳開拌飯。",
    price: 20,
    tags: [],
  },
  {
    id: "cabbage",
    category: "extra",
    name: "加高麗菜",
    desc: "清炒高麗菜一份。便當已有配菜，真的還想多菜再加。",
    price: 15,
    tags: [],
  },
  {
    id: "soup-takeout",
    category: "soup",
    name: "外帶當日熱湯",
    desc: "內用熱湯自取不用錢。外帶另外盛裝，湯品看當天。",
    price: 25,
    tags: ["外帶"],
  },
  {
    id: "soup-meatball",
    category: "soup",
    name: "貢丸玉米湯",
    desc: "想指定湯品時點這個。內用也可單點。",
    price: 30,
    tags: [],
  },
  {
    id: "chili-radish",
    category: "soup",
    name: "辣菜脯（外帶）",
    desc: "小魚乾辣菜脯。內用自取；外帶可加一小包。",
    price: 10,
    tags: ["下飯"],
  },
  {
    id: "barley-tea",
    category: "drink",
    name: "麥茶",
    desc: "冰熱依現場。去油、配烤肉。",
    price: 20,
    tags: [],
  },
  {
    id: "black-tea",
    category: "drink",
    name: "古早味紅茶",
    desc: "微糖、有麥香。",
    price: 25,
    tags: [],
  },
  {
    id: "green-tea",
    category: "drink",
    name: "無糖綠茶",
    desc: "焙香綠茶，不另外加糖。",
    price: 25,
    tags: [],
  },
];

export const categories: Category[] = ["bento", "extra", "soup", "drink"];

export function itemById(id: string): MenuItem | undefined {
  return menu.find((item) => item.id === id);
}

export function itemsByCategory(category: Category): MenuItem[] {
  return menu.filter((item) => item.category === category);
}

export function popularItems(): MenuItem[] {
  return menu.filter((item) => item.popular);
}
