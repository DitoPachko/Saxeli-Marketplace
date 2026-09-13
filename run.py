import re

with open('artifacts/saxeli-marketplace/src/pages/Sell.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add useLanguage import
text = re.sub(
    r'import \{ useCategoryTree \} from "@/hooks/use-categories";',
    r'import { useCategoryTree } from "@/hooks/use-categories";\nimport { useLanguage } from "@/hooks/use-language";',
    text
)

# Add useLanguage inside component
text = re.sub(
    r'export default function Sell\(\) \{\n(.*?)const \[, setLocation\] = useLocation\(\);',
    r'export default function Sell() {\n\1const { t, language, cityName } = useLanguage();\n  const [, setLocation] = useLocation();',
    text
)

def repl(match):
    ka = match.group(1)
    en = match.group(2)
    return f'{{t("{ka}", "{en}")}}'

# We'll just manually replace strings using simple .replace for the most prominent ones
replacements = {
    '"ახალი"': 'language === "en" ? "New" : "ახალი"',
    '"თითქმის ახალი"': 'language === "en" ? "Like new" : "თითქმის ახალი"',
    '"მეორადი"': 'language === "en" ? "Used" : "მეორადი"',
    '"ნაწილებად"': 'language === "en" ? "For parts" : "ნაწილებად"',
    '"თბილისი"': 'language === "en" ? "Tbilisi" : "თბილისი"',
    
    'setError("მთავარი ფოტოს წაკითხვა ვერ მოხერხდა. სცადე თავიდან.");': 'setError(t("მთავარი ფოტოს წაკითხვა ვერ მოხერხდა. სცადე თავიდან.", "Failed to read cover photo. Please try again."));',
    'setError("მაქსიმუმ 5 ფოტოს ატვირთვა შეგიძლია.");': 'setError(t("მაქსიმუმ 5 ფოტოს ატვირთვა შეგიძლია.", "You can upload a maximum of 5 photos."));',
    'setError("გთხოვ, ატვირთე ფოტო JPG, PNG ან WEBP ფორმატში.");': 'setError(t("გთხოვ, ატვირთე ფოტო JPG, PNG ან WEBP ფორმატში.", "Please upload photos in JPG, PNG, or WEBP format."));',
    'setError("მაქსიმუმ 5 ფოტოს ატვირთვა შეგიძლია. ზედმეტი ფოტოები არ დაემატა.");': 'setError(t("მაქსიმუმ 5 ფოტოს ატვირთვა შეგიძლია. ზედმეტი ფოტოები არ დაემატა.", "Maximum 5 photos. Extra photos were ignored."));',
    'setError("გთხოვ, ატვირთე მინიმუმ ერთი ფოტო.");': 'setError(t("გთხოვ, ატვირთე მინიმუმ ერთი ფოტო.", "Please upload at least one photo."));',
    'setError("AI ანალიზი ვერ შესრულდა. მონაცემები შეგიძლია ხელით შეავსო.");': 'setError(t("AI ანალიზი ვერ შესრულდა. მონაცემები შეგიძლია ხელით შეავსო.", "AI analysis failed. You can fill data manually."));',
    'setError("განცხადების გამოსაქვეყნებლად ნივთის ფოტო ატვირთე.");': 'setError(t("განცხადების გამოსაქვეყნებლად ნივთის ფოტო ატვირთე.", "Upload a photo to publish the listing."));',
    'setError(validation.error.issues[0]?.message ?? "შეამოწმე შევსებული ველები.");': 'setError(validation.error.issues[0]?.message ?? t("შეამოწმე შევსებული ველები.", "Please check the filled fields."));',
    'setError("განცხადების გამოქვეყნება ვერ მოხერხდა. გთხოვ, თავიდან სცადო."),': 'setError(t("განცხადების გამოქვეყნება ვერ მოხერხდა. გთხოვ, თავიდან სცადო.", "Failed to publish listing. Please try again.")),',
    'setError("პროექტის შენახვა ვერ მოხერხდა. სცადე თავიდან.");': 'setError(t("პროექტის შენახვა ვერ მოხერხდა. სცადე თავიდან.", "Failed to save draft. Please try again."));',
    
    'title="განცხადების დამატება"': 'title={t("განცხადების დამატება", "Add listing")}',
    'eyebrow="Saxeli / ნივთი"': 'eyebrow={t("Saxeli / ნივთი", "Saxeli / Item")}',
    '> გაუქმება\n': '> {t("გაუქმება", "Cancel")}\n',
    
    '["ფოტო", stage !== "photo"],': '[(language === "ka" ? "ფოტო" : "Photo"), stage !== "photo"],',
    '["არჩევანი", stage === "details"],': '[(language === "ka" ? "არჩევანი" : "Choice"), stage === "details"],',
    '["მონაცემები", stage === "details"],': '[(language === "ka" ? "მონაცემები" : "Details"), stage === "details"],',
    
    '01 / ნივთის ფოტო': '{t("01 / ნივთის ფოტო", "01 / Item photo")}',
    'ჯერ ფოტო, შემდეგ ყველაფერი დანარჩენი.': '{t("ჯერ ფოტო, შემდეგ ყველაფერი დანარჩენი.", "Photo first, everything else after.")}',
    'კარგი ფოტო გვეხმარება განცხადება სწრაფად და ზუსტად მოვამზადოთ.': '{t("კარგი ფოტო გვეხმარება განცხადება სწრაფად და ზუსტად მოვამზადოთ.", "A good photo helps us prepare the listing quickly and accurately.")}',
    'ფოტოები: {photos.length} / {maxPhotos}': '{t("ფოტოები:", "Photos:")} {photos.length} / {maxPhotos}',
    'მთავარია: ფოტო': '{t("მთავარია: ფოტო", "Cover: photo")}',
    'ატვირთე ნივთის ფოტო': '{t("ატვირთე ნივთის ფოტო", "Upload item photo")}',
    'დაამატე კიდევ ფოტო': '{t("დაამატე კიდევ ფოტო", "Add more photos")}',
    'ჩააგდე აქ ან აირჩიე მოწყობილობიდან': '{t("ჩააგდე აქ ან აირჩიე მოწყობილობიდან", "Drop here or choose from device")}',
    'JPG · PNG · WEBP · მაქს. 5 ფოტო': '{t("JPG · PNG · WEBP · მაქს. 5 ფოტო", "JPG · PNG · WEBP · Max 5 photos")}',
    
    'მთავარი ფოტო\n': '{t("მთავარი ფოტო", "Cover photo")}\n',
    
    'ფოტოების დადასტურება': '{t("ფოტოების დადასტურება", "Confirm photos")}',
    
    '02 / სწრაფი დახმარება': '{t("02 / სწრაფი დახმარება", "02 / Quick help")}',
    'როგორ შევავსოთ ნივთი?': '{t("როგორ შევავსოთ ნივთი?", "How to fill in the item?")}',
    'ფოტო ატვირთულია. აირჩიე, გინდა თუ არა ხელოვნური ინტელექტის დახმარება.': '{t("ფოტო ატვირთულია. აირჩიე, გინდა თუ არა ხელოვნური ინტელექტის დახმარება.", "Photo uploaded. Choose if you want AI assistance.")}',
    'ფოტო მზად არის': '{t("ფოტო მზად არის", "Photo is ready")}',
    'სხვა ფოტოს არჩევა': '{t("სხვა ფოტოს არჩევა", "Choose another photo")}',
    
    'დაიხმარე ხელოვნური ინტელექტი': '{t("დაიხმარე ხელოვნური ინტელექტი", "Use Artificial Intelligence")}',
    'ფოტო შეავსებს ძირითად ველებს': '{t("ფოტო შეავსებს ძირითად ველებს", "Photo will fill the main fields")}',
    'ჩაწერე მონაცემები': '{t("ჩაწერე მონაცემები", "Fill in manually")}',
    'ყველაფერი თავად შეავსე': '{t("ყველაფერი თავად შეავსე", "Fill everything yourself")}',
    
    'სურათი ანალიზდება...': '{t("სურათი ანალიზდება...", "Analyzing image...")}',
    'რამდენიმე წამში საწყის მონაცემებს მოგიმზადებთ': '{t("რამდენიმე წამში საწყის მონაცემებს მოგიმზადებთ", "We will prepare initial data in a few seconds")}',
    
    '03 / ნივთის მონაცემები': '{t("03 / ნივთის მონაცემები", "03 / Item data")}',
    'შეამოწმე და გამოაქვეყნე.': '{t("შეამოწმე და გამოაქვეყნე.", "Check and publish.")}',
    'AI-ით შევსებული': '{t("AI-ით შევსებული", "Filled by AI")}',
    'ყველა ველი სრულად რედაქტირებადია — შენ უკეთ იცი შენი ნივთი.': '{t("ყველა ველი სრულად რედაქტირებადია — შენ უკეთ იცი შენი ნივთი.", "All fields are fully editable — you know your item better.")}',
    'არჩევანის შეცვლა': '{t("არჩევანის შეცვლა", "Change choice")}',
    
    'ფოტოს შეცვლა': '{t("ფოტოს შეცვლა", "Change photo")}',
    'სათაური': '{t("სათაური", "Title")}',
    '>\n                        კატეგორია': '>\n                        {t("კატეგორია", "Category")}',
    '>\n                        მდგომარეობა': '>\n                        {t("მდგომარეობა", "Condition")}',
    '>\n                    სავარაუდო ფასი (₾)': '>\n                    {t("სავარაუდო ფასი (₾)", "Estimated price (₾)")}',
    '>ფასისა და გაცვლის პირობები<': '>{t("ფასისა და გაცვლის პირობები", "Price and trade conditions")}<',
    
    '["negotiable", "ფასი შეთანხმებით"]': '["negotiable", language === "ka" ? "ფასი შეთანხმებით" : "Negotiable"]',
    '["tradeAvailable", "გაცვლა"]': '["tradeAvailable", language === "ka" ? "გაცვლა" : "Trade"]',
    
    'ქალაქი\n': '{t("ქალაქი", "City")}\n',
    'უბანი / რაიონი\n': '{t("უბანი / რაიონი", "District / Region")}\n',
    'აღწერა\n': '{t("აღწერა", "Description")}\n',
    
    'მიტანის სერვისი<': '{t("მიტანის სერვისი", "Delivery service")}<',
    'გაქვთ თუ არა ნივთის ადგილზე მიტანის ან ფოსტით გაგზავნის სერვისი?': '{t("გაქვთ თუ არა ნივთის ადგილზე მიტანის ან ფოსტით გაგზავნის სერვისი?", "Do you offer delivery or shipping service?")}',
    
    'ტელეფონის ნომერი\n': '{t("ტელეფონის ნომერი", "Phone number")}\n',
    'მხოლოდ ჩატში მოწერა\n': '{t("მხოლოდ ჩატში მოწერა", "Chat only")}\n',
    'პროექტი შენახულია ამ მოწყობილობაზე.': '{t("პროექტი შენახულია ამ მოწყობილობაზე.", "Draft saved on this device.")}',
    
    'უკან\n': '{t("უკან", "Back")}\n',
    '>\n                  პროექტად შენახვა': '>\n                  {t("პროექტად შენახვა", "Save draft")}',
    '? "იტვირთება..." : "გამოქვეყნება"': '? t("იტვირთება...", "Publishing...") : t("გამოქვეყნება", "Publish")',
    
    'პატარა რჩევა': '{t("პატარა რჩევა", "A little tip")}',
    'ნათელი ფოტო და გულწრფელი აღწერა ნივთს უფრო სწრაფად იპოვის ახალ მფლობელს.': '{t("ნათელი ფოტო და გულწრფელი აღწერა ნივთს უფრო სწრაფად იპოვის ახალ მფლობელს.", "A clear photo and honest description will find a new owner faster.")}',
    'AI-ს მიერ მომზადებული მონაცემები ყოველთვის გადაამოწმე გამოქვეყნებამდე.': '{t("AI-ს მიერ მომზადებული მონაცემები ყოველთვის გადაამოწმე გამოქვეყნებამდე.", "Always verify AI-generated data before publishing.")}',
    '{city}': '{cityName(city)}'
}

for old, new in replacements.items():
    text = text.replace(old, new)

text = text.replace(
    'placeholder="მაგ. iPhone 13 Pro 128GB"', 
    'placeholder={t("მაგ. iPhone 13 Pro 128GB", "e.g. iPhone 13 Pro 128GB")}'
)
text = text.replace(
    'placeholder="მაგ. 850"',
    'placeholder={t("მაგ. 850", "e.g. 850")}'
)
text = text.replace(
    'placeholder="აღწერეთ ნივთის მდგომარეობა და დეტალები..."',
    'placeholder={t("აღწერეთ ნივთის მდგომარეობა და დეტალები...", "Describe item condition and details...")}'
)
text = text.replace(
    'const selected = form.delivery?.includes(value);',
    'const selected = form.delivery?.includes(value);\n                      const translatedValue = language === "en" ? ({ "ადგილზე გატანა": "Pick up", "საკურიერო მომსახურება": "Courier service", "პირისპირ შეხვედრა": "Meet in person" } as Record<string, string>)[value] ?? value : value;\n                      const translatedDetail = language === "en" ? ({ "მყიდველი ნივთს შენგან იღებს": "Buyer picks up the item", "მყიდველი ირჩევს კურიერს": "Buyer chooses a courier", "შეხვედრა თქვენთვის მოსახერხებელ ადგილას": "Meeting at a convenient place" } as Record<string, string>)[detail] ?? detail : detail;'
)
text = text.replace(
    '<span className="block text-sm font-semibold">{value}</span>',
    '<span className="block text-sm font-semibold">{translatedValue}</span>'
)
text = text.replace(
    '<span className="mt-1 block text-xs text-[hsl(var(--muted-foreground))]">\n                              {detail}\n                            </span>',
    '<span className="mt-1 block text-xs text-[hsl(var(--muted-foreground))]">\n                              {translatedDetail}\n                            </span>'
)


with open('artifacts/saxeli-marketplace/src/pages/Sell.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
