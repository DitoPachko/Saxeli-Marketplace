export type CategorySeed = {
  name: string;
  slug: string;
  icon?: string;
  children?: CategorySeed[];
};

const group = (name: string, slug: string, items: [string, string][]): CategorySeed => ({
  name,
  slug,
  children: items.map(([itemName, itemSlug]) => ({ name: itemName, slug: itemSlug })),
});

export const categoryTree: CategorySeed[] = [
  { name: "საოჯახო ტექნიკა", slug: "home-appliances", icon: "WashingMachine", children: [
    group("სამზარეულო", "kitchen-appliances", [["მაცივრები", "refrigerators"], ["ქურები", "cookers"]]),
    group("სახლის მოვლა", "home-care-appliances", [["სარეცხი მანქანები", "washing-machines"], ["მტვერსასრუტები", "vacuum-cleaners"]]),
  ]},
  { name: "ტექნიკა", slug: "electronics", icon: "Laptop", children: [
    group("ტელეფონები", "phones", [["სმარტფონები", "smartphones"], ["აქსესუარები", "phone-accessories"]]),
    group("კომპიუტერები", "computers", [["ლეპტოპები", "laptops"], ["კომპიუტერის ნაწილები", "computer-parts"]]),
    group("აუდიო და ვიდეო", "audio-video", [["ტელევიზორები", "televisions"], ["ყურსასმენები", "headphones"]]),
  ]},
  { name: "ნადირობა და თევზაობა", slug: "hunting-fishing", icon: "Fish", children: [
    group("თევზაობა", "fishing", [["ანკესები", "fishing-rods"], ["სატყუარები", "fishing-bait"]]),
    group("ნადირობა", "hunting", [["ეკიპირება", "hunting-gear"], ["ოპტიკა", "hunting-optics"]]),
  ]},
  { name: "მუსიკა", slug: "music", icon: "Music2", children: [
    group("ინსტრუმენტები", "instruments", [["გიტარები", "guitars"], ["კლავიშიანი", "keyboards"]]),
    group("სტუდია", "studio", [["მიკროფონები", "microphones"], ["აუდიო აპარატურა", "audio-equipment"]]),
  ]},
  { name: "საბავშვო", slug: "kids", icon: "Baby", children: [
    group("სათამაშოები", "toys", [["განმავითარებელი", "educational-toys"], ["გარე სათამაშოები", "outdoor-toys"]]),
    group("ბავშვის ნივთები", "baby-items", [["ეტლები", "strollers"], ["ავეჯი", "kids-furniture"]]),
  ]},
  { name: "სილამაზე და მოდა", slug: "beauty-fashion", icon: "Shirt", children: [
    group("ტანსაცმელი", "clothing", [["ქალის ტანსაცმელი", "womens-clothing"], ["მამაკაცის ტანსაცმელი", "mens-clothing"]]),
    group("სილამაზე", "beauty", [["კოსმეტიკა", "cosmetics"], ["პარფიუმერია", "perfumes"]]),
  ]},
  { name: "მშენებლობა და რემონტი", slug: "construction-repair", icon: "Hammer", children: [
    group("სამშენებლო მასალები", "building-materials", [["ხე და მეტალი", "wood-metal"], ["საღებავები", "paint"]]),
    group("ხელსაწყოები", "tools", [["ელექტრო ხელსაწყოები", "power-tools"], ["ხელის ხელსაწყოები", "hand-tools"]]),
  ]},
  { name: "ცხოველები", slug: "pets-animals", icon: "PawPrint", children: [
    group("შინაური ცხოველები", "pets", [["ძაღლები", "dogs"], ["კატები", "cats"]]),
    group("აქსესუარები", "pet-supplies", [["საკვები", "pet-food"], ["მოვლის ნივთები", "pet-care"]]),
  ]},
  { name: "სპორტი და დასვენება", slug: "sports-leisure", icon: "Dumbbell", children: [
    group("სპორტი", "sports", [["ფიტნესი", "fitness"], ["გუნდური სპორტი", "team-sports"]]),
    group("დასვენება", "leisure", [["კემპინგი", "camping"], ["ველოსიპედები", "bicycles"]]),
  ]},
  { name: "ბიზნესი და დანადგარები", slug: "business-equipment", icon: "Factory", children: [
    group("დანადგარები", "industrial-equipment", [["საწარმოო ტექნიკა", "manufacturing"], ["გენერატორები", "generators"]]),
    group("სავაჭრო ინვენტარი", "retail-equipment", [["ვიტრინები", "showcases"], ["სალარო სისტემები", "pos-systems"]]),
  ]},
  { name: "წიგნები და კანცელარია", slug: "books-stationery", icon: "BookOpen", children: [
    group("წიგნები", "books", [["მხატვრული", "fiction"], ["სასწავლო", "educational-books"]]),
    group("კანცელარია", "stationery", [["საოფისე ნივთები", "office-supplies"], ["სახატავი მასალები", "art-supplies"]]),
  ]},
  { name: "ხელოვნება და საკოლექციო", slug: "art-collectibles", icon: "Palette", children: [
    group("ხელოვნება", "art", [["ფერწერა", "paintings"], ["ხელნაკეთი ნივთები", "handmade"]]),
    group("საკოლექციო", "collectibles", [["მონეტები", "coins"], ["ანტიკვარიატი", "antiques"]]),
  ]},
];

export type FlatCategorySeed = CategorySeed & { parentSlug: string | null; depth: number; sortOrder: number };

export function flattenCategoryTree(): FlatCategorySeed[] {
  const result: FlatCategorySeed[] = [];
  const visit = (nodes: CategorySeed[], parentSlug: string | null, depth: number) => {
    nodes.forEach((node, index) => {
      result.push({ ...node, children: undefined, parentSlug, depth, sortOrder: index });
      visit(node.children ?? [], node.slug, depth + 1);
    });
  };
  visit(categoryTree, null, 0);
  return result;
}