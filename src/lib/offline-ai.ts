/**
 * Offline AI Service — Zero-download local chat intelligence.
 * Uses keyword-based topic matching + extensive knowledge base for offline responses.
 * Includes pattern-based fuzzy matching for questions not in the topic list.
 * No model download needed — works immediately when offline.
 */

import type { Message } from "@/types/quantum";

export type OfflineModelStatus = "idle" | "ready" | "error";

export interface OfflineModelState {
  status: OfflineModelStatus;
  progress: number;
  error: string | null;
  modelSize: string;
}

let currentStatus: OfflineModelState = {
  status: "ready",
  progress: 100,
  error: null,
  modelSize: "built-in",
};

type StatusListener = (state: OfflineModelState) => void;
const listeners: Set<StatusListener> = new Set();

export function onOfflineModelStatus(listener: StatusListener): () => void {
  listeners.add(listener);
  listener({ ...currentStatus });
  return () => listeners.delete(listener);
}

export function getOfflineModelStatus(): OfflineModelState {
  return { ...currentStatus };
}

export function preloadOfflineModel(): void {
  // No-op: the offline engine is built-in, no download needed
}

// ============================================================
// Topic-based knowledge system
// Each entry has keywords that trigger it, plus the response.
// Keywords are checked against words in the user's input.
// ============================================================

interface TopicEntry {
  keywords: string[];
  priority: number;
  response: string;
}

const TOPICS: TopicEntry[] = [

  // ====== IDENTITY ======
  {
    keywords: ["who", "made", "created", "built", "developed", "ragib", "your name", "what are you", "who are you", "quantum ai"],
    priority: 20,      response:
      "I am **Quantum AI**. Every line of code, every system, every feature — designed, coded, and developed entirely by **RAGIB** from the ground up, with minimal AI assistance during development.\n\nI work both online and offline!\n\nIn offline mode, I use a built-in knowledge engine to answer your questions. I can help with cooking, science, math, geography, coding, everyday life advice, and much more.\n\nFor the most advanced responses, switch to online mode where I'm powered by Gemini (General) or Groq (Hacking).",
  },

  // ====== LOST / STOLEN WALLET ======
  {
    keywords: ["wallet", "lost", "stolen", "missing", "theft", "pickpocket"],
    priority: 15,
    response:
      `🔒 **What to Do If Your Wallet Is Lost or Stolen**

**Immediate Steps (Do These NOW):**
1. **Cancel your debit/credit cards** — Call your bank immediately. Most banks have 24/7 hotlines.
2. **File a police report** — Go to your nearest police station or call the non-emergency number.
3. **Block mobile payments** — Disable Apple Pay, Google Pay, or any mobile wallet.

**Next 24 Hours:**
4. **Check for unauthorized transactions** — Log into your bank app and review recent activity.
5. **Contact your ID-issuing offices** — Report lost driver's license, national ID, or passport.
6. **Change passwords** — If any cards or accounts were linked.
7. **Notify your insurance** — Some policies cover stolen wallets.

**Protect Yourself Going Forward:**
• Monitor bank statements daily for the next 30 days.
• Consider a credit freeze if you had your SSN/national ID.
• Keep digital copies of important documents securely.
• Use a wallet tracker (AirTag or Tile) in the future.

Don't panic — acting quickly minimizes the damage.`,
  },

  // ====== LOST PHONE ======
  {
    keywords: ["phone", "lost", "stolen", "missing", "find my phone", "track phone", "mobile"],
    priority: 15,
    response:
      `📱 **What to Do If Your Phone Is Lost or Stolen**

**Immediate Actions:**
1. **Try calling it** — Use another phone to call your number.
2. **Track it:**
   - **iPhone:** Find My iPhone (icloud.com/find)
   - **Android:** Find My Device (google.com/android/find)
3. **Lock it remotely** and **erase data** if you can't recover it.

**Important Steps:**
4. **Change passwords** — Start with your primary email.
5. **Contact your carrier** — Suspend your SIM card.
6. **File a police report** with the IMEI number.
7. **Report IMEI blocked** to blacklist the phone.

**Prevention for Next Time:**
• Enable Find My Device. Use a strong passcode. Enable 2FA.`,
  },

  // ====== EMERGENCY / HELPLINE ======
  {
    keywords: ["emergency", "helpline", "ambulance", "fire", "police", "urgent", "help me", "danger", "accident", "hospital"],
    priority: 18,
    response:
      `🚨 **Emergency Information**

**Universal Emergency Numbers:**
• **911** — USA, Canada, Mexico
• **999** — UK, Bangladesh, Malaysia, Hong Kong
• **112** — Europe (works from any mobile phone worldwide)
• **000** — Australia
• **110** — Japan, China
• **100** — India

**What to Do in an Emergency:**
1. Stay calm. Call the appropriate emergency number.
2. Give your location clearly (address, landmarks).
3. Describe what happened and how many people are affected.
4. Follow the dispatcher's instructions. Don't hang up until told.

**Common Emergencies:**
• Medical: Call ambulance, perform CPR if trained.
• Fire: Get out first, then call fire department.
• Car accident: Check for injuries, call emergency services.
• Natural disaster: Follow official instructions.

**Save these numbers in your phone right now!**`,
  },

  // ====== COUNTRIES & GEOGRAPHY ======
  {
    keywords: ["bangladesh", "bd", "bangla", "dhaka", "chittagong", "padma", "bangladeshi"],
    priority: 14,
    response:
      `🇧🇩 **Bangladesh — Overview**

**Official Name:** People's Republic of Bangladesh

**Location:** South Asia, on the Bay of Bengal. Bordered by India on three sides and Myanmar to the southeast.

**Capital:** Dhaka (~22 million metro area)

**Population:** ~175 million — 8th most populous country.

**Geography:**
• Mostly flat delta land (Ganges-Brahmaputra-Meghna delta).
• The Sundarbans — world's largest mangrove forest (shared with India).
• Prone to monsoon flooding — 80% floodplain.
• Cox's Bazar — world's longest natural sandy beach (120 km).

**Language:** Bengali (Bangla)

**Economy:**
• One of the fastest-growing economies in Asia.
• 2nd largest garment exporter in the world.
• Growing IT, pharmaceutical, and agriculture sectors.

**Culture:** Rich music (Baul, Rabindra Sangeet), literature, cricket. Known for warm hospitality and vibrant festivals (Pohela Boishakh).

**Food:** Fish curry (hilsa/illish), biryani, pitha (rice cakes), chotpoti.

**History:** Won independence in 1971 through a liberation war.`,
  },
  {
    keywords: ["india", "indian", "delhi", "mumbai", "bangalore", "hindu", "bollywood"],
    priority: 12,
    response:
      `🇮🇳 **India — Overview**

**Capital:** New Delhi | **Population:** ~1.44 billion (most populous country)

**Geography:** Himalayas, Thar Desert, Deccan Plateau, 7,500 km coastline.

**Languages:** Hindi and English (official). 22 scheduled languages.

**Economy:** 5th largest GDP. IT, pharmaceuticals, agriculture, textiles, automotive.

**Culture:** One of the oldest civilizations. Diwali, Holi, Eid, Bollywood, yoga, diverse cuisine.

**Famous For:** Taj Mahal, cricket, IT industry, spice-rich food, incredible diversity.`,
  },
  {
    keywords: ["america", "united states", "usa", "us", "american", "washington", "new york", "california", "texas", "florida"],
    priority: 12,
    response:
      `🇺🇸 **United States of America**

**Capital:** Washington, D.C. | **Population:** ~335 million | **50 states**

**Geography:** Rocky Mountains, Great Plains, Grand Canyon, Great Lakes, Hawaii, Alaska.

**Economy:** World's largest GDP (~$28 trillion). Technology, finance, healthcare, entertainment.

**Key Cities:** New York, Los Angeles, Chicago, Houston, San Francisco, Seattle, Miami.

**Culture:** Melting pot of cultures. Hollywood, jazz, rock, hip-hop.

**Famous For:** Statue of Liberty, Hollywood, Silicon Valley, national parks.`,
  },
  {
    keywords: ["united kingdom", "uk", "england", "britain", "london", "scottish", "welsh", "british"],
    priority: 12,
    response:
      `🇬🇧 **United Kingdom**

**Countries:** England, Scotland, Wales, Northern Ireland | **Capital:** London | **Population:** ~67 million

**Economy:** 6th largest GDP. Finance, tech, pharmaceuticals, creative industries.

**History:** One of the most influential nations. British Empire was the largest in history.

**Culture:** Shakespeare, Beatles, Premier League, tea culture, fish and chips.`,
  },
  {
    keywords: ["japan", "japanese", "tokyo", "sakura", "anime", "manga", "sushi", "samurai", "ninja"],
    priority: 12,
    response:
      `🇯🇵 **Japan — Overview**

**Capital:** Tokyo | **Population:** ~125 million

**Geography:** Island nation (4 main islands). Mount Fuji (3,776m), cherry blossoms.

**Economy:** 4th largest GDP. Automotive (Toyota, Honda), electronics, robotics, gaming.

**Culture:** Ancient traditions meet ultra-modern tech. Tea ceremony, kimono, sumo, anime, manga.

**Food:** Sushi, ramen, tempura, udon, wagyu beef, matcha, Japanese curry.

**Famous For:** Mount Fuji, bullet trains (Shinkansen), cherry blossoms, karate, origami.`,
  },
  {
    keywords: ["china", "chinese", "beijing", "shanghai", "great wall", "dragon"],
    priority: 12,
    response:
      `🇨🇳 **China — Overview**

**Capital:** Beijing | **Population:** ~1.41 billion

**Geography:** Himalayas, Yangtze River, Gobi Desert, extensive coastline.

**Economy:** 2nd largest GDP. Manufacturing, technology, e-commerce (Alibaba, Tencent).

**History:** 5,000+ years of civilization. Invented paper, gunpowder, compass, printing.

**Famous For:** Great Wall, Terracotta Army, pandas, Kung Fu, Chinese New Year, tea culture.`,
  },
  {
    keywords: ["australia", "australian", "sydney", "melbourne", "kangaroo", "koala", "outback"],
    priority: 12,
    response:
      `🇦🇺 **Australia — Overview**

**Capital:** Canberra | **Population:** ~26 million

**Geography:** Island continent. Great Barrier Reef, Outback, tropical rainforests.

**Economy:** Mining, agriculture, tourism, education, technology.

**Wildlife:** Kangaroos, koalas, wombats, platypus — unique species found nowhere else.

**Famous For:** Sydney Opera House, Great Barrier Reef, surfing, cricket.`,
  },
  {
    keywords: ["germany", "german", "berlin", "munich", "oktoberfest", "bmw", "mercedes"],
    priority: 12,
    response:
      `🇩🇪 **Germany — Overview**

**Capital:** Berlin | **Population:** ~84 million

**Economy:** Largest in Europe. Engineering (BMW, Mercedes, Volkswagen), chemicals, renewable energy.

**Culture:** Beer, sausages, Oktoberfest, classical music (Beethoven, Bach).

**Famous For:** Brandenburg Gate, autobahn, BMW/Mercedes/Audi, Christmas markets.`,
  },
  {
    keywords: ["france", "french", "paris", "eiffel", "louvre", "wine", "croissant"],
    priority: 12,
    response:
      `🇫🇷 **France — Overview**

**Capital:** Paris | **Population:** ~68 million

**Economy:** Tourism (most visited country), luxury goods, aerospace, wine.

**Culture:** Art, fashion, philosophy. Home to the Louvre, Eiffel Tower, world-class cuisine.

**Famous For:** Eiffel Tower, Louvre Museum, wine, cheese, croissants, French Revolution.`,
  },
  {
    keywords: ["russia", "russian", "moscow", "kremlin", "siberia"],
    priority: 12,
    response:
      `🇷🇺 **Russia — Overview**

**Capital:** Moscow | **Population:** ~144 million | **Area:** 17.1 million km² (largest country)

**Geography:** 11 time zones. Siberia, Lake Baikal (deepest lake), Volga River.

**Economy:** Oil, gas, minerals, nuclear energy, space program.

**Famous For:** Kremlin, Red Square, Trans-Siberian Railway, ballet, Tchaikovsky, space exploration.`,
  },
  {
    keywords: ["brazil", "brazilian", "rio", "brasilia", "amazon", "samba", "carnival"],
    priority: 12,
    response:
      `🇧🇷 **Brazil — Overview**

**Capital:** Brasília | **Population:** ~215 million | **Language:** Portuguese

**Geography:** Amazon Rainforest (world's largest), Amazon River, Pantanal wetlands, 7,400 km coastline.

**Economy:** Largest in Latin America. Agriculture (coffee, soybeans), mining, aviation (Embraer), oil.

**Culture:** Samba, Carnival, capoeira, football (soccer). Rich Afro-Brazilian heritage.

**Famous For:** Christ the Redeemer, Copacabana Beach, Amazon, Carnival, Pelé, Neymar.`,
  },
  {
    keywords: ["canada", "canadian", "ottawa", "toronto", "vancouver", "montreal", "maple"],
    priority: 12,
    response:
      `🇨🇦 **Canada — Overview**

**Capital:** Ottawa | **Population:** ~40 million | **Languages:** English, French

**Geography:** 2nd largest country. Rocky Mountains, Great Lakes, Arctic tundra, Niagara Falls.

**Economy:** Oil, timber, mining, technology, banking. Strong social programs.

**Famous For:** Maple syrup, hockey, Niagara Falls, stunning national parks, multiculturalism.`,
  },
  {
    keywords: ["south korea", "korean", "seoul", "k-pop", "kimchi", "korea"],
    priority: 12,
    response:
      `🇰🇷 **South Korea — Overview**

**Capital:** Seoul | **Population:** ~52 million

**Economy:** Technology powerhouse (Samsung, Hyundai, LG, Kia). Shipbuilding, electronics, K-pop.

**Culture:** K-pop, K-drama, Korean BBQ, kimchi, hanbok (traditional dress), kimchi, soju.

**Famous For:** Korean War, Gangnam Style, K-pop, advanced technology, Jeju Island, DMZ.`,
  },
  {
    keywords: ["italy", "italian", "rome", "milan", "venice", "pizza", "pasta", "colosseum"],
    priority: 12,
    response:
      `🇮🇹 **Italy — Overview**

**Capital:** Rome | **Population:** ~59 million

**Geography:** Boot-shaped peninsula, Alps, Mediterranean coastline, Sicily, Sardinia.

**Economy:** Fashion (Milan), automotive (Ferrari, Lamborghini), tourism, agriculture (olive oil, wine).

**Culture:** Renaissance art, opera, fashion, Vatican City (world's smallest country).

**Famous For:** Colosseum, Leaning Tower of Pisa, Venice canals, Vatican, pasta, pizza.`,
  },
  {
    keywords: ["spain", "spanish", "madrid", "barcelona", "flamenco", "tapas"],
    priority: 12,
    response:
      `🇪🇸 **Spain — Overview**

**Capital:** Madrid | **Population:** ~47 million | **Language:** Spanish

**Geography:** Iberian Peninsula, Balearic Islands, Canary Islands. Diverse climate.

**Economy:** Tourism (2nd most visited country), automotive, agriculture (olives, wine).

**Culture:** Flamenco, bullfighting, La Sagrada Família (Gaudí), Real Madrid, Barcelona FC.

**Famous For:** La Tomatina festival, running of the bulls, siesta tradition, paella.`,
  },
  {
    keywords: ["egypt", "egyptian", "cairo", "pyramid", "pharaoh", "nile", "sphinx"],
    priority: 12,
    response:
      `🇪🇬 **Egypt — Overview**

**Capital:** Cairo | **Population:** ~105 million

**Geography:** Nile River (longest river, 6,650 km), Sahara Desert, Red Sea coast.

**History:** One of the oldest civilizations (3,000+ BCE). Pyramids of Giza, Great Sphinx, pharaohs.

**Economy:** Tourism, Suez Canal (12% of world trade), agriculture (cotton), natural gas.

**Famous For:** Pyramids, Sphinx, Tutankhamun, hieroglyphics, ancient temples, Nile cruises.`,
  },
  {
    keywords: ["turkey", "turkish", "istanbul", "ankara", "ottoman"],
    priority: 12,
    response:
      `🇹🇷 **Turkey — Overview**

**Capital:** Ankara | **Population:** ~85 million

**Geography:** Straddles Europe and Asia. Mediterranean coast, Cappadocia, Mount Ararat.

**Economy:** Agriculture, automotive, textiles, tourism. Bridge between East and West.

**History:** Ottoman Empire (1299–1922), Byzantine Empire, modern republic founded 1923.

**Famous For:** Hagia Sophia, Blue Mosque, Cappadocia hot air balloons, Turkish delight, kebabs.`,
  },
  {
    keywords: ["pakistan", "pakistani", "islamabad", "karachi", "lahore"],
    priority: 12,
    response:
      `🇵🇰 **Pakistan — Overview**

**Capital:** Islamabad | **Population:** ~240 million

**Geography:** K2 (2nd tallest mountain), Indus River, Arabian Sea coast.

**Economy:** Textiles, agriculture (wheat, rice, cotton), IT sector growing rapidly.

**Culture:** Rich Mughal heritage, diverse languages (Urdu, Punjabi, Sindhi, Pashto).

**Famous For:** K2, Badshahi Mosque, food (biryani, nihari), cricket, hospitality.`,
  },
  {
    keywords: ["nepal", "nepali", "kathmandu", "himalaya", "everest"],
    priority: 12,
    response:
      `🇳🇵 **Nepal — Overview**

**Capital:** Kathmandu | **Population:** ~30 million

**Geography:** Himalayan mountains. Home to Mount Everest (8,849m — tallest peak).

**Economy:** Agriculture, tourism (trekking), textiles, carpets.

**Culture:** Hindu-Buddhist traditions, festivals (Dashain, Tihar), diverse ethnic groups.

**Famous For:** Everest Base Camp trek, Pokhara, birthplace of Buddha (Lumbini), Gurkha soldiers.`,
  },
  {
    keywords: ["mexico", "mexican", "mexico city", "cancun", "tacos", "sombrero"],
    priority: 12,
    response:
      `🇲🇽 **Mexico — Overview**

**Capital:** Mexico City | **Population:** ~130 million | **Language:** Spanish

**Geography:** Sierra Madre mountains, Yucatán Peninsula, Baja California, Pacific & Gulf coasts.

**Economy:** Oil, manufacturing (automotive), tourism, agriculture (avocados, tomatoes).

**Culture:** Day of the Dead (Día de los Muertos), mariachi, Aztec and Mayan ruins, tacos.

**Famous For:** Chichén Itzá, Cancún, tequila, chocolate (origin of chocolate), Frida Kahlo.`,
  },
  {
    keywords: ["indonesia", "indonesian", "jakarta", "bali", "batik"],
    priority: 11,
    response:
      `🇮🇩 **Indonesia — Overview**

**Capital:** Jakarta | **Population:** ~278 million (4th most populous)

**Geography:** 17,000+ islands. Volcanoes, rainforests, Bali beaches, Komodo dragons.

**Economy:** Palm oil, coal, tourism, textiles. 4th largest population economy.

**Culture:** Diverse (300+ ethnic groups). Batik fabric, gamelan music, wayang puppet theater.

**Famous For:** Bali temples, Komodo dragons, Borobudur temple, Raja Ampat diving.`,
  },
  {
    keywords: ["thailand", "thai", "bangkok", "phuket", "temples", "muay thai"],
    priority: 11,
    response:
      `🇹🇭 **Thailand — Overview**

**Capital:** Bangkok | **Population:** ~70 million

**Geography:** Tropical beaches, mountains, rice paddies, Mekong River.

**Economy:** Tourism (world-class beaches), automotive manufacturing, rice exports.

**Culture:** Buddhist temples, Thai cuisine (pad thai, green curry), Muay Thai boxing, Songkran water festival.

**Famous For:** Bangkok temples (Grand Palace), Phuket islands, Thai street food, floating markets.`,
  },
  {
    keywords: ["vietnam", "vietnamese", "hanoi", "ho chi minh", "pho"],
    priority: 11,
    response:
      `🇻🇳 **Vietnam — Overview**

**Capital:** Hanoi | **Population:** ~100 million

**Geography:** S-shaped. Ha Long Bay, Mekong Delta, Phong Nha caves, 3,400 km coastline.

**Economy:** Manufacturing, agriculture (rice, coffee), tourism, tech outsourcing.

**Culture:** Phở, banh mi, coffee culture (egg coffee), Ao Dai (traditional dress).

**Famous For:** Ha Long Bay, Cu Chi tunnels, Hoi An ancient town, coffee culture, motorbike culture.`,
  },
  {
    keywords: ["philippines", "filipino", "manila", "cebu", "palawan"],
    priority: 11,
    response:
      `🇵🇭 **Philippines — Overview**

**Capital:** Manila | **Population:** ~115 million

**Geography:** 7,641 islands. Beaches, rice terraces, volcanoes, coral reefs.

**Economy:** BPO (call centers), remittances from overseas workers, electronics, tourism.

**Culture:** Mix of Malay, Spanish, American influences. Festivals (Sinulog), karaoke culture.

**Famous For:** Palawan beaches, Banaue Rice Terraces, Chocolate Hills, jeepneys, lechon.`,
  },
  {
    keywords: ["saudi arabia", "saudi", "riyadh", "mecca", "medina", "dubai", "uae", "emirates"],
    priority: 11,
    response:
      `🇸🇦 **Saudi Arabia — Overview**

**Capital:** Riyadh | **Population:** ~36 million

**Geography:** Arabian Peninsula. Rub' al Khali (Empty Quarter), Red Sea coast.

**Economy:** World's largest oil exporter. Vision 2030 diversification plan.

**Religion:** Home to Mecca and Medina — holiest cities in Islam.

**Famous For:** Hajj pilgrimage, oil wealth, NEOM futuristic city project, date palms.

**Dubai (UAE):** Nearby. Famous for Burj Khalifa (tallest building), Palm Islands, luxury shopping, desert safaris.`,
  },
  {
    keywords: ["iran", "iranian", "tehran", "persia", "persian"],
    priority: 11,
    response:
      `🇮🇷 **Iran — Overview**

**Capital:** Tehran | **Population:** ~88 million

**Geography:** Zagros Mountains, Dasht-e Kavir desert, Caspian Sea coast.

**Economy:** Oil and gas (4th largest reserves), agriculture, carpet weaving.

**History:** Ancient Persia — one of the world's oldest civilizations. Achaemenid Empire, Persepolis.

**Culture:** Persian poetry (Rumi, Hafez), Nowruz (Persian New Year), Persian cuisine.

**Famous For:** Persepolis ruins, Isfahan architecture, Persian carpets, saffron, pistachios.`,
  },
  {
    keywords: ["nigeria", "nigerian", "lagos", "abuja", "africa"],
    priority: 11,
    response:
      `🇳🇬 **Nigeria — Overview**

**Capital:** Abuja | **Population:** ~220 million (most populous in Africa)

**Geography:** Niger River delta, tropical rainforest, savanna.

**Economy:** Largest oil producer in Africa. Agriculture, Nollywood (film industry), tech startups.

**Culture:** Diverse (250+ ethnic groups). Yoruba, Hausa, Igbo cultures. Jollof rice.

**Famous For:** Nollywood, Afrobeats music, vibrant markets, diverse cultures.`,
  },
  {
    keywords: ["south africa", "south african", "cape town", "johannesburg", "safari"],
    priority: 11,
    response:
      `🇿🇦 **South Africa — Overview**

**Capital:** Pretoria (admin), Cape Town (legislative), Bloemfontein (judicial)

**Population:** ~60 million | **Languages:** 11 official languages

**Geography:** Drakensberg Mountains, Cape of Good Hope, Kruger National Park, Table Mountain.

**Economy:** Mining (gold, diamonds, platinum), agriculture, tourism, finance.

**History:** Apartheid ended 1994. Nelson Mandela — first Black president.

**Famous For:** Safari, Table Mountain, Robben Island, wine regions, biodiversity.`,
  },
  {
    keywords: ["new zealand", "zealand", "auckland", "wellington", "kiwi", "maori"],
    priority: 11,
    response:
      `🇳🇿 **New Zealand — Overview**

**Capital:** Wellington | **Population:** ~5 million

**Geography:** Two main islands (North & South). Mountains, fjords, geothermal areas, beaches.

**Economy:** Agriculture (dairy, lamb), tourism, film industry (Lord of the Rings).

**Culture:** Māori heritage, rugby (All Blacks), haka dance.

**Famous For:** Lord of the Rings filming locations, Milford Sound, bungee jumping, hobbit holes.`,
  },
  {
    keywords: ["sweden", "swedish", "stockholm", "oslo", "norway", "norwegian", "finland", "finnish", "denmark", "danish", "copenhagen", "scandinavian", "nordic"],
    priority: 11,
    response:
      `🇸🇪🇳🇴🇫🇮🇩🇰 **Nordic/Scandinavian Countries**

**Sweden:** Capital Stockholm. IKEA, Volvo, ABBA, Nobel Prize. Population ~10.5M.
**Norway:** Capital Oslo. Oil, fjords, Northern Lights, Vikings. Population ~5.5M.
**Finland:** Capital Helsinki. Saunas, Northern Lights, education system #1. Population ~5.5M.
**Denmark:** Capital Copenhagen. LEGO, pastries, bikes, Little Mermaid. Population ~5.9M.

**Common Features:** High quality of life, social welfare, clean design, dark winters, light summers, sauna culture.`,
  },
  {
    keywords: ["netherlands", "dutch", "amsterdam", "holland", "tulip", "windmill"],
    priority: 11,
    response:
      `🇳🇱 **Netherlands — Overview**

**Capital:** Amsterdam | **Population:** ~18 million

**Geography:** Flat terrain, below sea level in places. Canals, tulip fields, windmills.

**Economy:** Trade, agriculture (world's 2nd largest food exporter), technology, finance.

**Culture:** Van Gogh, Rembrandt, De Stijl art, cycling culture, cheese markets.

**Famous For:** Tulips, windmills, canals, Van Gogh Museum, Anne Frank House, King's Day.`,
  },
  {
    keywords: ["greece", "greek", "athens", "olympics", "zeus", "mythology", "parthenon"],
    priority: 11,
    response:
      `🇬🇷 **Greece — Overview**

**Capital:** Athens | **Population:** ~10.4 million

**Geography:** Mountainous peninsula, 6,000 islands (200 inhabited), Mediterranean climate.

**History:** Cradle of Western civilization. Ancient democracy, philosophy (Socrates, Plato, Aristotle), Olympics, mythology.

**Culture:** Greek mythology, philosophy, theater, architecture, Mediterranean cuisine.

**Famous For:** Parthenon, Olympic Games, Greek gods, Santorini, olive oil, feta cheese, souvlaki.`,
  },
  {
    keywords: ["poland", "polish", "warsaw", "krakow"],
    priority: 10,
    response:
      `🇵🇱 **Poland — Overview**

**Capital:** Warsaw | **Population:** ~38 million

**Geography:** Central Europe. Carpathian Mountains, Baltic Sea coast, Mazurian Lakes.

**Economy:** One of fastest-growing EU economies. Manufacturing, IT, automotive.

**History:** Survived partitions, WWII devastation, Solidarity movement, transition to democracy.

**Famous For:** Auschwitz, Kraków's Old Town, Copernicus, Marie Curie, pierogi, vodka.`,
  },
  {
    keywords: ["ukraine", "ukrainian", "kyiv", "kiev"],
    priority: 10,
    response:
      `🇺🇦 **Ukraine — Overview**

**Capital:** Kyiv | **Population:** ~37 million

**Geography:** Largest country entirely in Europe. Carpathian Mountains, Black Sea coast.

**Economy:** Agriculture ("breadbasket of Europe" — wheat, sunflower oil), IT sector.

**Culture:** Vyshyvanka (embroidered shirts), borscht, Cossack heritage, rich folk traditions.

**Famous For:** Chernobyl, Carpathian Mountains, independence movement, resilience.`,
  },
  {
    keywords: ["colombia", "colombian", "bogota", "medellin", "carnival"],
    priority: 10,
    response:
      `🇨🇴 **Colombia — Overview**

**Capital:** Bogotá | **Population:** ~52 million

**Geography:** Andes Mountains, Amazon rainforest, Caribbean & Pacific coasts, coffee region.

**Economy:** Oil, coal, coffee, flowers, emeralds.

**Culture:** Cumbia music, salsa, coffee culture, Botero art, magical realism (García Márquez).

**Famous For:** Coffee region (Eje Cafetero), Cartagena old city, lost city trek, Shakira, Pablo Escobar history.`,
  },
  {
    keywords: ["argentina", "argentine", "buenos aires", "tango", "patagonia"],
    priority: 10,
    response:
      `🇦🇷 **Argentina — Overview**

**Capital:** Buenos Aires | **Population:** ~46 million

**Geography:** 8th largest country. Andes, Pampas grasslands, Patagonia, Iguazu Falls.

**Economy:** Agriculture (beef, soybeans, wine), lithium mining, tech.

**Culture:** Tango dance, football (Maradona, Messi), asado (barbecue), mate tea.

**Famous For:** Patagonia, Iguazu Falls, Buenos Aires nightlife, steak, Malbec wine.`,
  },
  {
    keywords: ["peru", "peruvian", "lima", "machu picchu", "andes"],
    priority: 10,
    response:
      `🇵🇪 **Peru — Overview**

**Capital:** Lima | **Population:** ~34 million

**Geography:** Andes Mountains, Amazon rainforest, Pacific coast. Contains source of the Amazon.

**History:** Inca Empire center. Machu Picchu (UNESCO World Heritage).

**Economy:** Mining (copper, gold), agriculture (coffee, asparagus), fishing, tourism.

**Food:** Ceviche, lomo saltado, aji de gallina. Lima is a world food capital.

**Famous For:** Machu Picchu, Cusco, Nazca Lines, Amazon basin, Peruvian cuisine.`,
  },
  {
    keywords: ["chile", "chilean", "santiago", "atacama", "patagonia"],
    priority: 10,
    response:
      `🇨🇱 **Chile — Overview**

**Capital:** Santiago | **Population:** ~19 million

**Geography:** Long & narrow. Atacama Desert (driest), Andes, Patagonia, Easter Island.

**Economy:** Copper (#1 producer), wine, agriculture, lithium.

**Famous For:** Easter Island (Moai statues), Atacama Desert stargazing, Patagonia trekking, Chilean wine.`,
  },
  {
    keywords: ["portugal", "portuguese", "lisbon", "porto"],
    priority: 10,
    response:
      `🇵🇹 **Portugal — Overview**

**Capital:** Lisbon | **Population:** ~10 million

**Geography:** Iberian Peninsula west coast. Azores & Madeira islands.

**Economy:** Tourism, wine (Port, Vinho Verde), textiles, footwear, cork.

**Culture:** Fado music, pastel de nata (custard tarts), Age of Discovery explorers.

**Famous For:** Lisbon trams, Porto wine, Sintra palaces, Azores islands, Cristiano Ronaldo.`,
  },
  {
    keywords: ["singapore", "singaporean"],
    priority: 10,
    response:
      `🇸🇬 **Singapore — Overview**

**Type:** City-state | **Population:** ~5.9 million

**Economy:** Major financial hub, tech, biotech, shipping. Highest GDP per capita in Asia.

**Culture:** Mix of Chinese, Malay, Indian, Western influences. hawker food centers.

**Famous For:** Marina Bay Sands, Gardens by the Bay (Supertrees), Merlion, Singlish, cleanliness.`,
  },
  {
    keywords: ["malaysia", "malaysian", "kuala lumpur", "petronas"],
    priority: 10,
    response:
      `🇲🇾 **Malaysia — Overview**

**Capital:** Kuala Lumpur | **Population:** ~33 million

**Geography:** Peninsular + Borneo portion. Tropical rainforests, islands, highlands.

**Economy:** Electronics, palm oil, petroleum, tourism, Islamic finance.

**Culture:** Malay, Chinese, Indian, indigenous cultures. Nasi lemak, satay, roti canai.

**Famous For:** Petronas Twin Towers, Langkawi, Borneo orangutans, street food.`,
  },
  {
    keywords: ["morocco", "moroccan", "marrakech", "casablanca", "sahara"],
    priority: 10,
    response:
      `🇲🇦 **Morocco — Overview**

**Capital:** Rabat | **Population:** ~37 million

**Geography:** Atlas Mountains, Sahara Desert, Atlantic & Mediterranean coasts.

**Economy:** Tourism, agriculture (oranges, olives), phosphates, textiles.

**Culture:** Berber and Arab heritage. Medina markets (souks), tagine, couscous, mint tea.

**Famous For:** Marrakech medina, Sahara camel treks, Fez tanneries, Chefchaouen blue city.`,
  },

  // ====== CAPITALS ======
  {
    keywords: ["capital of", "what is the capital"],
    priority: 13,
    response:
      `🗺️ **World Capitals — Quick Reference:**

• Bangladesh → Dhaka
• India → New Delhi
• USA → Washington, D.C.
• UK → London
• Japan → Tokyo
• China → Beijing
• Australia → Canberra
• Germany → Berlin
• France → Paris
• Russia → Moscow
• Brazil → Brasília
• Canada → Ottawa
• South Korea → Seoul
• Italy → Rome
• Spain → Madrid
• Egypt → Cairo
• Turkey → Ankara
• Pakistan → Islamabad
• Nepal → Kathmandu
• Mexico → Mexico City
• Indonesia → Jakarta
• Thailand → Bangkok
• Vietnam → Hanoi
• Nigeria → Abuja
• South Africa → Pretoria
• Saudi Arabia → Riyadh
• Iran → Tehran
• Colombia → Bogotá
• Argentina → Buenos Aires
• Peru → Lima
• Chile → Santiago
• Portugal → Lisbon
• Greece → Athens
• Poland → Warsaw
• Sweden → Stockholm
• Norway → Oslo
• Finland → Helsinki
• Denmark → Copenhagen
• Netherlands → Amsterdam
• Singapore → Singapore (city-state)
• Malaysia → Kuala Lumpur
• Morocco → Rabat
• New Zealand → Wellington
• Switzerland → Bern
• Austria → Vienna
• Belgium → Brussels

Ask me about any specific country for more details!`,
  },

  // ====== WORLD RECORDS ======
  {
    keywords: ["largest", "biggest", "tallest", "longest", "smallest", "deepest", "highest", "fastest", "world record", "superlative"],
    priority: 13,
    response:
      `🌍 **World Records & Extremes:**

**Largest Countries:** Russia → Canada → USA → China → Brazil

**Largest Oceans:** Pacific → Atlantic → Indian → Southern → Arctic

**Longest Rivers:** Nile (6,650 km) → Amazon (6,400 km) → Yangtze (6,300 km)

**Tallest Mountain:** Mount Everest — 8,849 m (Nepal/Tibet)

**Deepest Ocean Point:** Mariana Trench — 10,994 m (Pacific Ocean)

**Largest Desert:** Sahara — 9.2 million km²

**Largest Lake:** Caspian Sea — 371,000 km²

**Longest Wall:** Great Wall of China — 21,196 km

**Most Populous Country:** India — 1.44 billion

**Fastest Animal:** Peregrine Falcon — 390 km/h (diving)

**Fastest Land Animal:** Cheetah — 112 km/h

**Fastest Train:** Shanghai Maglev — 431 km/h

**Largest Building:** Boeing Everett Factory — 13.3 million m³`,
  },

  // ====== COOKING ======
  {
    keywords: ["cake", "bake", "baking", "birthday cake", "vanilla cake", "chocolate cake", "cupcake"],
    priority: 10,
    response:
      `🍰 **How to Make a Basic Vanilla Cake**

**Ingredients:**
• 2½ cups (315g) all-purpose flour
• 2 tsp baking powder
• ½ tsp salt
• 1 cup (227g) unsalted butter, softened
• 1¾ cups (350g) granulated sugar
• 4 large eggs, room temperature
• 2 tsp vanilla extract
• 1 cup (240ml) whole milk

**Instructions:**
1. Preheat oven to 350°F (175°C). Grease and flour two 9-inch round pans.
2. Whisk flour, baking powder, and salt together.
3. Cream butter and sugar until light and fluffy (3-4 min).
4. Add eggs one at a time. Mix in vanilla.
5. Alternate adding flour mixture and milk. Mix until just combined.
6. Divide batter between pans.
7. Bake 25-30 minutes until a toothpick comes out clean.
8. Cool 10 minutes, then turn out onto wire racks.

**Tips:** Don't overmix. Use room temperature ingredients. For chocolate cake, replace ¼ cup flour with cocoa powder.`,
  },
  {
    keywords: ["egg", "scramble", "fried egg", "boiled egg", "poach"],
    priority: 10,
    response:
      `🥚 **How to Cook Eggs**

**Scrambled:** Whisk 2-3 eggs with salt/pepper. Cook in butter over medium-low, stirring gently. Remove while slightly wet.

**Fried (Sunny Side Up):** Heat butter, crack egg in, cook 2-3 minutes. Don't flip.

**Boiled:** Cold water → bring to boil → cover → remove from heat. Soft: 6-7 min. Hard: 10-12 min. Cool in ice water.

**Poached:** Simmer water + vinegar, create whirlpool, slide egg in, cook 3-4 minutes.`,
  },
  {
    keywords: ["pasta", "spaghetti", "noodles", "mac and cheese", "macaroni", "carbonara"],
    priority: 10,
    response:
      `🍝 **How to Make Pasta with Tomato Sauce**

**Pasta:** Boil salted water, cook 8-12 min. Reserve 1 cup pasta water before draining.

**Simple Sauce:** Heat olive oil, sauté garlic 1 min, add 1 can crushed tomatoes, salt, pepper, 1 tsp sugar, red pepper flakes. Simmer 15-20 min. Add fresh basil.

Toss pasta with sauce + splash of pasta water. Starch helps sauce cling.

**Pro tip:** Undercook pasta by 1 min and finish in the sauce.`,
  },
  {
    keywords: ["rice", "biryani", "fried rice", "pulao", "pilaf"],
    priority: 10,
    response:
      `🍚 **How to Make Rice**

**Basic Rice:** Rinse 1 cup rice until water runs clear. Combine with 1.5 cups water + pinch of salt. Bring to boil, lowest heat, cover, 15-18 min. Rest 5 min, fluff.

**Fried Rice:** Use day-old rice. Heat oil in wok on high. Sauté veggies (2-3 min). Push aside, scramble egg. Add rice + 2 tbsp soy sauce, toss 3-4 min. Garnish with green onions.

**Biryani:** Layer partially cooked rice with spiced meat. Seal and cook on low heat (dum) 20-25 min.`,
  },
  {
    keywords: ["bread", "roti", "naan", "paratha", "tortilla", "dough"],
    priority: 10,
    response:
      `🍞 **Simple Homemade Bread**

**Ingredients:** 3 cups flour, 1 packet yeast, 1 tbsp sugar, 1 tsp salt, 1 cup warm water, 2 tbsp olive oil.

**Steps:**
1. Dissolve sugar in warm water, add yeast, wait 5-10 min until foamy.
2. Mix flour + salt, add yeast mixture + oil. Knead 8-10 min.
3. Rise 1-1.5 hours (doubled).
4. Shape, rise another 30-45 min.
5. Bake at 375°F (190°C) for 30-35 min until golden.

**Naan:** Add yogurt to dough, cook in very hot skillet, brush with garlic butter.`,
  },
  {
    keywords: ["pizza", "pizza dough", "pizza sauce"],
    priority: 10,
    response:
      `🍕 **Homemade Pizza**

**Dough:** Yeast + warm water + sugar → wait 5 min. Add flour + salt + olive oil. Knead 8 min. Rise 1 hour.

**Sauce:** Crushed tomatoes + garlic + oregano + salt + olive oil.

**Bake:** Preheat to 475°F (245°C). Stretch dough, add sauce + mozzarella + toppings. Bake 10-12 min.

**Tips:** Don't overload toppings. Preheat your baking surface.`,
  },
  {
    keywords: ["chicken", "steak", "beef", "meat", "fish", "salmon", "grill", "cook meat"],
    priority: 10,
    response:
      `🍗 **How to Cook Chicken Breast**

**Pan-Seared:** Pound to ½ inch. Season generously. Oil on medium-high. Cook 5-6 min/side. Rest 5 min.

**Baked:** Season with olive oil + paprika + garlic powder. Bake at 425°F (220°C) 20-25 min.

**Grilled:** Marinate 30 min. Medium-high heat, 6-7 min/side. Internal temp 165°F (74°C).

**Fish/Salmon:** Season, cook skin-side down in hot pan 4 min, flip 3 min. Done when flakes easily.`,
  },
  {
    keywords: ["salad", "smoothie", "juice", "soup", "drink", "beverage"],
    priority: 8,
    response:
      `🥗 **Simple Garden Salad**

Mixed greens, cherry tomatoes, cucumber, red onion, bell pepper. Optional: feta, croutons, nuts.

**Vinaigrette:** 3 tbsp olive oil + 1 tbsp balsamic vinegar + 1 tsp Dijon mustard + salt & pepper.

**Simple Soup:** Sauté onion + garlic, add vegetables + broth, simmer 20 min, blend.

**Smoothie:** 1 banana + 1 cup berries + 1 cup milk/yogurt + ice. Blend until smooth.`,
  },
  {
    keywords: ["tea", "coffee", "brew", "espresso", "latte", "cappuccino"],
    priority: 8,
    response:
      `☕ **Tea & Coffee Guide**

**Black Tea:** Boil water, steep 3-5 min. Add milk/sugar to taste.

**Green Tea:** Water at 175°F (80°C), steep 2-3 min. Don't use boiling water.

**French Press Coffee:** Coarse grind, 1:15 ratio (coffee:water), water at 200°F, steep 4 min, press slowly.

**Espresso:** Fine grind, 18g for double shot, 25-30 sec extraction, 9 bar pressure.

**Latte:** 1 shot espresso + 6-8 oz steamed milk + thin foam layer.

**Cappuccino:** 1 shot espresso + equal parts steamed milk + thick foam.`,
  },

  // ====== SCIENCE ======
  {
    keywords: ["solar system", "sun", "moon", "mars", "jupiter", "saturn", "earth", "planet", "universe", "galaxy", "black hole", "star", "asteroid", "comet", "neptune", "venus", "mercury", "uranus", "pluto", "space"],
    priority: 11,
    response:
      `🌌 **The Solar System**

**The Sun:** G-type star, 4.6 billion years old, surface temp ~5,500°C. Contains 99.86% of solar system mass.

**Inner Planets:**
• Mercury — smallest, extreme temps (-180°C to 430°C), no atmosphere
• Venus — hottest (465°C), rotates backwards, toxic clouds of sulfuric acid
• Earth — liquid water, life, 1 moon
• Mars — red planet, Olympus Mons (tallest volcano, 21.9 km), 2 moons

**Outer Planets:**
• Jupiter — largest (1,300 Earths), Great Red Spot storm, 95 known moons
• Saturn — spectacular rings of ice/rock, 146 known moons
• Uranus — rotates on its side, blue-green color, methane atmosphere
• Neptune — windiest planet (2,100 km/h), 16 known moons

**Other:** Dwarf planets (Pluto, Ceres, Eris), Kuiper Belt, Oort Cloud.

**Speed of Light:** 299,792 km/s. Sun to Earth = 8 min 20 sec. Nearest star = 4.24 light-years.`,
  },
  {
    keywords: ["quantum", "superposition", "entanglement", "qubit", "quantum computer"],
    priority: 11,
    response:
      `⚛️ **Quantum Computing**

Uses qubits that can be 0, 1, or both simultaneously (superposition).

**Key Concepts:**
• **Superposition:** Qubit exists in multiple states at once.
• **Entanglement:** Two particles connected — measuring one affects the other instantly (Einstein called it "spooky action at a distance").
• **Quantum tunneling:** Particles pass through barriers they classically shouldn't.

**Why It Matters:**
• Exponential speedup for certain problems
• Cryptography, drug discovery, optimization, materials science
• Companies: IBM, Google, Microsoft, IonQ, Rigetti

**Challenge:** Maintaining qubit stability (decoherence) requires near-absolute-zero temperatures (−273°C).

**Milestones:** Google Sycamore achieved "quantum supremacy" in 2019. IBM's Condor processor has 1,121 qubits.`,
  },
  {
    keywords: ["artificial intelligence", "machine learning", "neural network", "deep learning", " ai ", "chatgpt", "llm", "language model"],
    priority: 11,
    response:
      `🤖 **Artificial Intelligence & Machine Learning**

**AI:** Simulation of human intelligence by machines — reasoning, learning, perception.

**Machine Learning:** Algorithms that learn from data without explicit programming.

**Deep Learning:** ML using neural networks with many layers (inspired by the human brain).

**Types of ML:**
1. **Supervised** — trained on labeled data (spam detection, image classification)
2. **Unsupervised** — finds patterns in unlabeled data (clustering, anomaly detection)
3. **Reinforcement** — learns through trial and error with rewards (game playing, robotics)

**Neural Networks:** Layers of mathematical functions process data. Input → Hidden layers → Output. Weights adjust during training to minimize errors.

**Milestones:** GPT-4 & Gemini (multimodal), Stable Diffusion (images), AlphaFold (protein folding), autonomous vehicles.

**LLMs:** Large Language Models trained on vast text data. Predict next token. Foundation of ChatGPT, Claude, Gemini.`,
  },
  {
    keywords: ["dna", "gene", "genetic", "evolution", "chromosome", "natural selection", "darwin", "mutation"],
    priority: 10,
    response:
      `🧬 **DNA & Evolution**

**DNA:** Deoxyribonucleic Acid — carries genetic instructions. Double helix. ~3 billion base pairs in humans.

**Bases:** A pairs with T, G pairs with C. Genes are DNA segments coding for proteins.

**Fun Facts:** You share 99.9% DNA with all humans. 96% with chimps. 60% with bananas.

**Evolution (Darwin):** Organisms with suited traits survive and reproduce. Over millions of years, small changes create new species. Evidence: fossils, DNA, comparative anatomy.

**Mutations:** Random changes in DNA. Can be harmful, neutral, or beneficial. Source of genetic variation.`,
  },
  {
    keywords: ["gravity", "energy", "electricity", "magnet", "atom", "molecule", "electron", "proton", "photon", "light", "sound", "wave", "friction", "inertia", "physics", "chemistry"],
    priority: 10,
    response:
      `🔬 **Physics Basics**

**Gravity:** Force between objects with mass. F = Gm₁m₂/r². Einstein described it as spacetime curvature.

**Energy:** Ability to do work. Cannot be created/destroyed, only transformed. Types: kinetic, potential, thermal, chemical, nuclear, electrical, light.

**Atom:** Nucleus (protons + neutrons) + electrons. If an atom were a stadium, the nucleus = a marble. 99.9999% empty space.

**Electricity:** Flow of electrons. Voltage = pressure. Current = flow. Resistance = opposition. V = IR (Ohm's Law).

**Light:** Electromagnetic radiation at 299,792 km/s. Both wave and particle (photon). Visible spectrum: 380-700nm.

**Sound:** Vibration traveling as pressure waves. Speed in air: ~343 m/s. Can't travel in vacuum.

**Chemistry:** Elements → Atoms → Molecules → Compounds. Periodic table organizes 118 elements.`,
  },
  {
    keywords: ["photosynthesis", "ecosystem", "food chain", "biodiversity", "cell", "mitochondria", "chlorophyll", "biology", "organ", "body"],
    priority: 10,
    response:
      `🌿 **Biology Basics**

**Photosynthesis:** 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂. Plants convert light to food. Produces oxygen.

**Cellular Respiration:** Reverse of photosynthesis. Breaks down glucose for energy (ATP).

**Human Body Highlights:**
• Brain: 86 billion neurons, uses 20% of body energy
• Heart: 100,000 beats/day, pumps 7,500 liters of blood
• Lungs: 300 million alveoli, ~20,000 breaths/day
• Stomach: pH 1.5-3.5 acid
• Skin: largest organ (1.5-2 m²), replaces itself every 27 days

**Ecosystem:** All living + non-living things interacting. Producers (plants) → Consumers (animals) → Decomposers (fungi/bacteria).`,
  },
  {
    keywords: ["periodic table", "element", "hydrogen", "oxygen", "carbon", "nitrogen", "metal", "nonmetal", "compound", "reaction", "chemical"],
    priority: 10,
    response:
      `🧪 **Chemistry Basics**

**Periodic Table:** 118 elements organized by atomic number, electron configuration.

**Most Important Elements:**
• Hydrogen (H) — lightest, most abundant in universe (75%)
• Carbon (C) — basis of all life. Forms billions of compounds
• Oxygen (O) — 21% of atmosphere, needed for breathing
• Iron (Fe) — most used metal, makes blood red, Earth's core
• Gold (Au) — noble metal, doesn't tarnish, conductor

**Chemical Bonds:**
• Ionic — transfer of electrons (NaCl: table salt)
• Covalent — sharing electrons (H₂O: water)
• Metallic — shared electron sea (metals)

**Common Reactions:** Combustion (burning), oxidation (rusting), acid-base neutralization.`,
  },
  {
    keywords: ["climate change", "global warming", "greenhouse", "carbon dioxide", "emission", "pollution", "environment", "ozone"],
    priority: 10,
    response:
      `🌍 **Climate Change & Environment**

**What's Happening:** Earth has warmed ~1.1°C since pre-industrial times due to greenhouse gases.

**Main Causes:** Burning fossil fuels (coal, oil, gas), deforestation, agriculture (methane from cattle).

**Effects:** Rising sea levels, extreme weather (hurricanes, floods, droughts), melting glaciers, ocean acidification, species extinction.

**Greenhouse Gases:** CO₂ (most important), methane (80x more potent short-term), nitrous oxide, fluorinated gases.

**Solutions:** Renewable energy (solar, wind), electric vehicles, reforestation, carbon capture, reducing meat consumption, recycling.

**Ozone Layer:** Damaged by CFCs, recovering since Montreal Protocol (1987). Separate from climate change.`,
  },
  {
    keywords: ["telescope", "microscope", "laboratory", "experiment", "hypothesis", "theory", "scientific method", "research"],
    priority: 9,
    response:
      `🔬 **The Scientific Method**

**Steps:**
1. **Observation** — Notice something interesting
2. **Question** — Ask "why?" or "how?"
3. **Hypothesis** — Propose a testable explanation
4. **Experiment** — Test the hypothesis (control group + variable)
5. **Analysis** — Collect and analyze data
6. **Conclusion** — Support or reject hypothesis
7. **Peer Review** — Others verify results
8. **Theory** — Well-tested explanation accepted by scientific community

**Tools:**
• Telescope — observes distant objects (stars, galaxies)
• Microscope — observes tiny objects (cells, bacteria)
• Spectroscope — identifies elements by light spectrum
• Particle accelerator — studies subatomic particles

**Key Principle:** Science is self-correcting. Theories can be updated with new evidence.`,
  },
  {
    keywords: ["temperature", "celsius", "fahrenheit", "kelvin", "boiling", "freezing", "melting", "condensation"],
    priority: 9,
    response:
      `🌡️ **Temperature Scales & Changes**

**Scales:**
• Celsius (°C): Water freezes at 0°, boils at 100°
• Fahrenheit (°F): Water freezes at 32°, boils at 212°
• Kelvin (K): Starts at absolute zero (-273.15°C). K = °C + 273.15

**Conversion:** °F = (°C × 9/5) + 32 | °C = (°F - 32) × 5/9

**States of Matter:**
• Solid → Liquid = Melting (ice → water at 0°C)
• Liquid → Gas = Boiling/Evaporation (water → steam at 100°C)
• Gas → Liquid = Condensation
• Liquid → Solid = Freezing
• Solid → Gas = Sublimation (dry ice → CO₂ gas)

**Body Temperature:** 37°C / 98.6°F is normal.`,
  },

  // ====== MATH ======
  {
    keywords: ["pi", "3.14159", "π", "euler", "golden ratio", "fibonacci", "mathematical constant"],
    priority: 10,
    response:
      `🔢 **Pi (π)**

Ratio of circle's circumference to diameter: π ≈ 3.14159265...

It's irrational — decimal goes forever without repeating.

**Common uses:** Circle area = πr², Sphere volume = (4/3)πr³, Circumference = 2πr.

**Approximations:** 22/7 (close), 355/113 (very accurate).

**Euler's Number (e):** ≈ 2.71828. Base of natural logarithms. Used in compound interest, population growth.

**Golden Ratio (φ):** ≈ 1.618. Found in nature (shells, flowers), art, architecture. aesthetically pleasing proportions.

**Fibonacci Sequence:** 0, 1, 1, 2, 3, 5, 8, 13, 21... Each number = sum of previous two. Approaches golden ratio.

Pi Day: March 14th (3/14)!`,
  },
  {
    keywords: ["pythagorean", "hypotenuse", "right triangle", "a squared", "a²"],
    priority: 10,
    response:
      `📐 **Pythagorean Theorem: a² + b² = c²**

In a right triangle, the square of the hypotenuse equals sum of squares of other two sides.

**Example:** a=3, b=4 → c² = 9+16 = 25 → c = 5

**Common Triples:** 3-4-5, 5-12-13, 8-15-17, 7-24-25

**Used in:** Distance calculations, construction, navigation, physics, GPS.`,
  },
  {
    keywords: ["percent", "percentage", "%", "ratio", "fraction", "decimal"],
    priority: 9,
    response:
      `📊 **Percentages**

**Formula:** Part ÷ Whole × 100 = Percentage

**Find X% of a number:** Number × (X/100). Example: 15% of 200 = 30.

**Quick mental math:**
• 10% = ÷10
• 1% = ÷100
• 25% = ÷4
• 50% = ÷2

**Increase/decrease:** New = Original × (1 ± percentage/100). Example: 200 increased by 15% = 230.

**Reverse:** If 30% = 60, then total = 60 ÷ 0.30 = 200.`,
  },
  {
    keywords: ["math", "calculate", "solve", "equation", "formula", "algebra", "geometry", "calculus", "addition", "subtraction", "multiplication", "division"],
    priority: 8,
    response:
      `🧮 **Math Help**

I can help with: Arithmetic, Algebra, Geometry, Trigonometry, Calculus, Statistics, Probability.

**Key Formulas:**
• Area of circle: A = πr²
• Pythagorean: a² + b² = c²
• Quadratic: x = (-b ± √(b²-4ac)) / 2a
• Area of triangle: ½ × base × height
• Volume of sphere: (4/3)πr³
• Distance: d = √((x₂-x₁)² + (y₂-y₁)²)
• Slope: m = (y₂-y₁)/(x₂-x₁)
• Mean: sum of all values ÷ count

**Basic Math Symbols:**
+ addition, - subtraction, × multiplication, ÷ division, = equals, ≠ not equal, < less than, > greater than

Ask me a specific math question and I'll walk you through it!`,
  },
  {
    keywords: ["triangle", "circle", "square", "rectangle", "area", "perimeter", "volume", "shape", "3d", "surface area"],
    priority: 9,
    response:
      `📐 **Geometry — Shapes & Formulas**

**2D Shapes:**
• Square: Area = s², Perimeter = 4s
• Rectangle: Area = l × w, Perimeter = 2(l+w)
• Triangle: Area = ½ × b × h, Perimeter = sum of sides
• Circle: Area = πr², Circumference = 2πr
• Trapezoid: Area = ½(a+b) × h

**3D Shapes:**
• Cube: Volume = s³, Surface = 6s²
• Rectangular prism: Volume = l × w × h
• Sphere: Volume = (4/3)πr³, Surface = 4πr²
• Cylinder: Volume = πr²h, Surface = 2πr(r+h)
• Cone: Volume = (1/3)πr²h
• Pyramid: Volume = (1/3) × base area × h`,
  },
  {
    keywords: ["triangle", "sine", "cosine", "tangent", "trigonometry", "sin", "cos", "tan", "angle", "degree", "radian"],
    priority: 9,
    response:
      `📐 **Trigonometry Basics**

**Right Triangle Ratios (SOH-CAH-TOA):**
• sin θ = Opposite / Hypotenuse
• cos θ = Adjacent / Hypotenuse
• tan θ = Opposite / Adjacent

**Common Angles:**
• sin 30° = 0.5, cos 30° = 0.866, tan 30° = 0.577
• sin 45° = 0.707, cos 45° = 0.707, tan 45° = 1
• sin 60° = 0.866, cos 60° = 0.5, tan 60° = 1.732
• sin 90° = 1, cos 90° = 0, tan 90° = undefined

**Key Identity:** sin²θ + cos²θ = 1

**Conversion:** π radians = 180°

**Used in:** Engineering, physics, navigation, architecture, music.`,
  },

  // ====== PROGRAMMING ======
  {
    keywords: ["javascript", "typescript", "python", "java ", "html", "css", "react", "node", "coding", "programming", "code", "algorithm", "function", "variable", "loop", "array", "api", "database", "sql", "git", "docker", "linux", "programming language", "software", "developer", "debug"],
    priority: 10,
    response:
      `💻 **Programming & Coding**

I can help with JavaScript, TypeScript, Python, Java, HTML, CSS, React, algorithms, data structures, APIs, databases, and more.

**Core Concepts:**
• Variables, data types, operators
• Control flow (if/else, loops, switch)
• Functions, OOP (classes, inheritance, polymorphism)
• Data structures (arrays, objects, trees, graphs, hash maps)
• APIs (REST, GraphQL), Databases (SQL, NoSQL)

**Popular Languages:**
• Python — simple syntax, data science, AI/ML
• JavaScript — web development, runs in browser
• Java — enterprise apps, Android
• C/C++ — systems programming, game engines
• Go — cloud services, performance

**Hello World — Python:**
\`\`\`python
print("Hello, World!")
\`\`\`

**Function — JavaScript:**
\`\`\`javascript
function greet(name) {
  return "Hello, " + name + "!";
}
\`\`\`

Ask me about specific topics for detailed help!`,
  },
  {
    keywords: ["website", "web app", "webpage", "web page", "app", "game", "bot", "build", "create", "make a"],
    priority: 7,
    response:
      `🛠️ **How to Build a Website**

1. **HTML** — Structure: \`<h1>Hello</h1>\`, \`<p>Text</p>\`, \`<a href="url">Link</a>\`
2. **CSS** — Style: \`color: blue; font-size: 16px; margin: 10px;\`
3. **JavaScript** — Interactivity: \`document.querySelector()\`, event listeners

**Get Started:**
\`\`\`html
<!DOCTYPE html>
<html>
<head><title>My Site</title></head>
<body>
  <h1>Hello World!</h1>
  <p>My first website.</p>
</body>
</html>
\`\`\`

**Modern Tools:** React, Vue, Svelte, Next.js, Tailwind CSS, Bootstrap.

**Deploy for free:** GitHub Pages, Netlify, Vercel.`,
  },
  {
    keywords: ["git", "github", "docker", "linux", "terminal", "command line", "ssh", "json", "rest api"],
    priority: 9,
    response:
      `🔧 **Tech Concepts**

**Git:** Version control. Tracks code changes.
• Commands: clone, add, commit, push, pull, branch, merge, stash

**GitHub:** Web platform for Git repos. Collaboration, code review, CI/CD.

**Docker:** Containers — lightweight, isolated environments. Dockerfile → Image → Container.

**Linux:** Open-source OS. Ubuntu, Fedora, Arch.
• Commands: ls, cd, mkdir, chmod, grep, ssh, curl, wget, apt/yum

**JSON:** \`{"key": "value"}\` — lightweight data format for APIs.

**REST API:** HTTP methods: GET (read), POST (create), PUT (update), DELETE (remove).

**SSH:** Secure Shell — encrypted remote access. \`ssh user@server\`.`,
  },
  {
    keywords: ["html", "css", "bootstrap", "tailwind", "flexbox", "grid", "responsive", "layout", "style"],
    priority: 9,
    response:
      `🎨 **HTML & CSS Basics**

**HTML Structure:**
\`\`\`html
<div class="container">
  <h1>Title</h1>
  <p>Paragraph</p>
  <button>Click me</button>
</div>
\`\`\`

**CSS Flexbox (1D layout):**
\`\`\`css
.container { display: flex; justify-content: center; align-items: center; gap: 10px; }
\`\`\`

**CSS Grid (2D layout):**
\`\`\`css
.grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
\`\`\`

**Responsive Design:** Use @media queries:
\`\`\`css
@media (max-width: 768px) { .container { flex-direction: column; } }
\`\`\`

**Frameworks:** Bootstrap (pre-built components), Tailwind CSS (utility-first).`,
  },
  {
    keywords: ["python", "pip", "django", "flask", "numpy", "pandas", "data science", "jupyter"],
    priority: 9,
    response:
      `🐍 **Python Guide**

**Install:** python.org or \`brew install python\` (Mac)

**Basic Code:**
\`\`\`python
name = "World"
print(f"Hello, {name}!")

# List comprehension
squares = [x**2 for x in range(10)]

# Function
def add(a, b):
    return a + b
\`\`\`

**Popular Libraries:**
• **NumPy** — numerical computing, arrays
• **Pandas** — data analysis, DataFrames
• **Matplotlib/Seaborn** — visualization
• **Scikit-learn** — machine learning
• **Django/Flask** — web frameworks
• **TensorFlow/PyTorch** — deep learning

**Package Manager:** pip install package_name`,
  },

  // ====== HISTORY ======
  {
    keywords: ["world war", "ww1", "ww2", "history", "war", "battle", "independence", "revolution", "ancient", "medieval", "renaissance"],
    priority: 9,
    response:
      `📜 **Major Historical Events**

**Ancient Civilizations (3000 BCE – 500 CE):**
• Mesopotamia — first cities, writing (cuneiform)
• Egypt — pyramids, pharaohs, hieroglyphics
• Greece — democracy, philosophy, Olympics
• Rome — law, engineering, vast empire
• China — Great Wall, Silk Road, paper invention
• India — Buddhism, Maurya & Gupta empires

**Medieval Period (500 – 1500):**
• Islamic Golden Age — algebra, optics, medicine
• Mongol Empire — largest contiguous empire
• Crusades — religious wars for Holy Land
• Black Death — killed 30-60% of Europe

**Modern Era:**
• Renaissance (14th-17th c.) — art, science rebirth
• Industrial Revolution (1760-1840) — factories, steam power
• World War I (1914-1918) — ~20 million deaths
• World War II (1939-1945) — ~70-85 million deaths
• Moon Landing (1969) — first humans on Moon
• Fall of Berlin Wall (1989) — end of Cold War`,
  },
  {
    keywords: ["invent", "discover", "invention", "discovery", "who invented", "who discovered"],
    priority: 9,
    response:
      `💡 **Famous Inventions & Discoveries**

• Electricity — Edison, Tesla, Faraday
• Light bulb — Edison (1879), Swan
• Telephone — Alexander Graham Bell (1876)
• Internet — ARPANET (1969), Tim Berners-Lee WWW (1989)
• Printing Press — Gutenberg (~1440)
• Airplane — Wright Brothers (1903)
• Penicillin — Alexander Fleming (1928)
• Vaccines — Edward Jenner (1796)
• Theory of Relativity — Einstein (1905/1915)
• Evolution — Darwin (1859)
• X-Rays — Röntgen (1895)
• Radio — Marconi (1895)
• Television — Farnsworth (1927)
• Computer — Babbage (concept), Turing (theory)
• World Wide Web — Tim Berners-Lee (1989)
• Smartphone — iPhone (2007) popularized it`,
  },
  {
    keywords: ["islam", "muslim", "quran", "prophet", "muhammad", "mosque", "prayer", "ramadan", "hajj", "allah"],
    priority: 10,
    response:
      `🕌 **Islam — Overview**

**Founder:** Prophet Muhammad (570-633 CE) in Mecca, Arabia.

**Holy Book:** Quran — believed to be word of God (Allah) revealed to Muhammad.

**Five Pillars:**
1. **Shahada** — Declaration of faith: "There is no god but Allah, Muhammad is His messenger"
2. **Salat** — Prayer 5 times daily facing Mecca
3. **Zakat** — Charitable giving (2.5% of wealth)
4. **Sawm** — Fasting during Ramadan (sunrise to sunset)
5. **Hajj** — Pilgrimage to Mecca (once in a lifetime if able)

**Key Beliefs:** One God (Allah), angels, prophets (Adam, Noah, Abraham, Moses, Jesus, Muhammad), Day of Judgment, predestination.

**Major Holidays:** Eid al-Fitr (end of Ramadan), Eid al-Adha (feast of sacrifice).

**World Population:** ~1.9 billion Muslims. 2nd largest religion.`,
  },
  {
    keywords: ["christianity", "christian", "jesus", "bible", "church", "god", "prayer", "heaven", "cross", "catholic", "protestant"],
    priority: 10,
    response:
      `✝️ **Christianity — Overview**

**Founder:** Jesus Christ (4 BCE – 30 CE) in Bethlehem/Judea.

**Holy Book:** Bible — Old Testament (Jewish scripture) + New Testament (Jesus's teachings, early church).

**Key Beliefs:** Jesus is Son of God, died on cross for humanity's sins, rose from dead on third day. Salvation through faith.

**Core Practices:** Prayer, baptism, communion, worship services (Sunday/Mass).

**Major Branches:**
• Catholic — led by Pope, largest denomination (~1.3 billion)
• Protestant — many denominations (Lutheran, Baptist, Methodist)
• Orthodox — Eastern traditions (Russian, Greek)

**Holidays:** Christmas (birth of Jesus, Dec 25), Easter (resurrection), Good Friday.

**World Population:** ~2.4 billion. Largest religion.`,
  },
  {
    keywords: ["hinduism", "hindu", "vedas", "yoga", "reincarnation", "karma", "brahma", "shiva", "vishnu", "krishna", "ganesha", "diwali"],
    priority: 10,
    response:
      `🕉️ **Hinduism — Overview**

**Oldest religion** — no single founder. Originated in Indian subcontinent ~4,000 years ago.

**Key Texts:** Vedas (oldest), Upanishads, Bhagavad Gita, Ramayana, Mahabharata.

**Core Beliefs:**
• **Brahman** — ultimate reality/universal spirit
• **Atman** — individual soul
• **Karma** — actions have consequences
• **Samsara** — cycle of birth, death, rebirth
• **Moksha** — liberation from samsara
• **Dharma** — righteous duty

**Main Deities (Trimurti):** Brahma (creator), Vishnu (preserver), Shiva (destroyer).

**Popular Deities:** Krishna, Rama, Ganesha, Hanuman, Lakshmi, Saraswati, Durga.

**Festivals:** Diwali (lights), Holi (colors), Navaratri, Ganesh Chaturthi.

**Practices:** Yoga, meditation, temple worship, pilgrimage.

**World Population:** ~1.2 billion.`,
  },
  {
    keywords: ["buddhism", "buddha", "buddhist", "meditation", "nirvana", "samsara", "dharma", "sangha", "monk"],
    priority: 10,
    response:
      `☸️ **Buddhism — Overview**

**Founder:** Siddhartha Gautama (Buddha) — born ~563 BCE in Nepal.

**Key Story:** Born a prince, left palace, saw suffering, became ascetic, found enlightenment under Bodhi tree.

**Four Noble Truths:**
1. Life involves suffering (dukkha)
2. Suffering comes from desire/attachment
3. Suffering can end
4. The Eightfold Path leads to end of suffering

**Eightfold Path:** Right understanding, thought, speech, action, livelihood, effort, mindfulness, concentration.

**Key Concepts:** Karma, reincarnation, mindfulness, compassion, middle way (extremes).

**Branches:** Theravada (Southeast Asia), Mahayana (East Asia), Tibetan (Himalayas).

**Practices:** Meditation, chanting, offering, mindfulness in daily life.

**World Population:** ~500 million.`,
  },
  {
    keywords: ["judaism", "jewish", "jew", "torah", "synagogue", "israel", "hanukkah", "shabbat"],
    priority: 10,
    response:
      `✡️ **Judaism — Overview**

**One of the oldest monotheistic religions** — originated ~3,500 years ago.

**Holy Texts:** Torah (first 5 books of Bible), Talmud (interpretations), Tanakh (Hebrew Bible).

**Key Beliefs:** One God (YHWH), covenant between God and Jewish people, Torah as law, importance of ethical living.

**Important Figures:** Abraham (patriarch), Moses (led Exodus from Egypt, received Torah at Sinai).

**Practices:** Shabbat (Sabbath, Friday-Saturday), kosher diet, prayer 3 times daily, bar/bat mitzvah.

**Major Holidays:** Passover (Exodus), Hanukkah (rededication of Temple), Rosh Hashanah (New Year), Yom Kippur (Day of Atonement).

**Branches:** Orthodox, Conservative, Reform.

**World Population:** ~15 million.`,
  },

  // ====== HEALTH & BODY ======
  {
    keywords: ["heart", "brain", "lungs", "stomach", "immune system", "eyes", "muscle", "bone", "human body", "anatomy", "organ", "blood"],
    priority: 10,
    response:
      `🫀 **Human Body**

**Brain:** 86 billion neurons. Uses 20% of energy. Controls everything — thoughts, memories, movement, emotions.

**Heart:** 100,000 beats/day. 4 chambers. Pumps 7,500 liters of blood daily. Beats ~100,000 times/day.

**Lungs:** 300 million alveoli (70 m² surface area). ~20,000 breaths/day. Right lung has 3 lobes, left has 2.

**Stomach:** pH 1.5-3.5 acid. Food stays 2-5 hours. Produces 2 liters of acid daily. Mucus prevents self-digestion.

**Immune System:** White blood cells (neutrophils, lymphocytes, macrophages). Antibodies mark invaders. Memory cells remember past infections (basis of vaccines).

**Kidneys:** Filter 180 liters of blood daily. Produce urine. Regulate blood pressure.

**Liver:** 500+ functions. Detoxifies blood, produces bile, stores glucose, processes nutrients.

**Skin:** Largest organ. 1.5-2 m². Regenerates every 27 days. 11 miles of blood vessels.`,
  },
  {
    keywords: ["vitamin", "protein", "carb", "calorie", "nutrition", "diet", "healthy", "food", "eat", "meal", "breakfast", "lunch", "dinner", "fat", "fiber", "mineral"],
    priority: 9,
    response:
      `🥗 **Nutrition Basics**

**Macronutrients:**
• Carbs (4 cal/g) — energy source. Complex carbs > simple sugars.
• Protein (4 cal/g) — build/repair tissue. Need ~0.8-1g per kg body weight.
• Fat (9 cal/g) — hormones, vitamin absorption. Choose unsaturated (olive oil, nuts, avocado).
• Fiber — digestion, blood sugar control. Need 25-30g/day.

**Key Vitamins:**
• A — vision, immunity (carrots, sweet potatoes)
• B12 — nerve function, blood cells (meat, eggs)
• C — immunity, collagen (citrus, peppers)
• D — bones, mood (sunlight, fatty fish)
• Iron — blood oxygen (meat, spinach, lentils)
• Calcium — bones, teeth (dairy, leafy greens)
• Zinc — immunity, healing (meat, seeds)

**Water:** Drink ~2L (8 cups) daily. More if active/hot climate.

**Tips:** Eat colorful veggies. Limit processed food & sugar. Portion control.`,
  },
  {
    keywords: ["sleep", "insomnia", "tired", "fatigue", "energy", "rest", "nap"],
    priority: 9,
    response:
      `😴 **Sleep Guide**

**Recommended:**
• Adults: 7-9 hours
• Teens: 8-10 hours
• Kids: 9-12 hours

**Good Sleep Tips:**
• Same bedtime/wake time daily (even weekends)
• No screens 1 hour before bed (blue light disrupts melatonin)
• Cool, dark, quiet room (65-68°F / 18-20°C)
• No caffeine after 2 PM
• Exercise daily (but not right before bed)
• Avoid heavy meals close to bedtime

**Sleep Stages:** Light → Deep → REM (dreaming). Cycle repeats every 90 min.

**Effects of Poor Sleep:** Weakened immunity, weight gain, poor focus, mood changes, higher disease risk, impaired memory.

**Quick Energy Boost:** Splash cold water on face, 5-min walk, stretch, drink water, eat protein-rich snack.`,
  },
  {
    keywords: ["stress", "anxiety", "depression", "mental health", "relax", "calm", "meditation", "mindfulness", "panic", "fear", "worry"],
    priority: 10,
    response:
      `🧘 **Mental Health & Stress Management**

**Quick Stress Relief:**
1. **4-7-8 Breathing:** Inhale 4 sec → Hold 7 sec → Exhale 8 sec. Repeat 4 times.
2. **5-4-3-2-1 Grounding:** Name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste.
3. **Progressive muscle relaxation:** Tense each muscle group 5 seconds, then release.

**Long-term Strategies:**
• Regular exercise (even 20-min walks help significantly)
• Adequate sleep (7-9 hours)
• Social connection — talk to friends/family
• Limit news/social media
• Set boundaries — it's OK to say no
• Practice gratitude — write 3 things daily
• Mindfulness meditation — even 5 min/day helps

**Anxiety Techniques:**
• Deep breathing activates parasympathetic nervous system
• Challenge negative thoughts — ask "Is this thought realistic?"
• Ground in the present — what can you see/hear/feel right now?

**If struggling:** Reach out to a mental health professional. There's no shame in asking for help.`,
  },

  // ====== WEATHER & CLIMATE ======
  {
    keywords: ["rain", "snow", "wind", "thunder", "lightning", "tornado", "hurricane", "earthquake", "volcano", "tsunami", "flood", "weather", "climate", "storm", "drought"],
    priority: 9,
    response:
      `🌦️ **Weather & Natural Phenomena**

**Rain:** Water evaporates → forms clouds → droplets combine → fall when heavy enough.

**Lightning:** Electrical discharge between clouds or ground. Heats air to 30,000°C. Thunder = shockwave.

**Earthquake:** Tectonic plates shift suddenly. Measured on Richter/Moment Magnitude scale. Most at plate boundaries. Japan, Indonesia, Chile are most active.

**Tornado:** Violent rotating column of air. Rated EF0-EF5. Most common in "Tornado Alley" (central US).

**Hurricane/Cyclone:** Massive rotating storm over warm ocean. Categories 1-5 (Saffir-Simpson). Wind speeds 119+ km/h.

**Volcano:** Magma erupts from Earth's interior. Types: shield, composite, cinder cone. Can cause climate cooling (ash).

**Tsunami:** Underwater earthquake creates waves. Can travel 800 km/h. Most devastating near shore.

**Climate Change:** Earth warming due to greenhouse gases. Causes rising seas, extreme weather.`,
  },

  // ====== PRACTICAL / EVERYDAY LIFE ======
  {
    keywords: ["study", "learn", "memorize", "concentrate", "focus", "productive", "time management", "exam", "test", "homework", "education", "school", "university", "college"],
    priority: 10,
    response:
      `📚 **Study & Learning Tips**

**Pomodoro Technique:** Study 25 min → Break 5 min → Repeat 4x → Long break 15-30 min.

**Active Recall:** Close the book and try to recall what you learned. Much stronger than re-reading.

**Spaced Repetition:** Review at increasing intervals (1 day → 3 days → 7 days → 14 days). Apps: Anki, Quizlet.

**Feynman Technique:** Explain the concept in simple terms. Identify gaps. Fill them. Repeat until simple.

**Other Tips:**
• Sleep 7-9 hours — memories consolidate during sleep
• Exercise improves brain function and memory
• Teach someone else — best way to solidify knowledge
• Minimize distractions (notifications off!)
• Take notes by hand — better retention than typing
• Study environment matters — clean desk, good lighting, no phone

**Test Taking:** Read all questions first. Answer easy ones first. Manage time. Review if time permits.`,
  },
  {
    keywords: ["money", "earn", "income", "job", "career", "business", "freelance", "salary", "invest", "save", "budget", "finance"],
    priority: 10,
    response:
      `💰 **Money & Career Tips**

**Ways to Earn Online:**
• Freelancing (web dev, design, writing) — Fiverr, Upwork, Toptal
• Content creation (YouTube, blogging, podcasting, TikTok)
• E-commerce (Shopify, Etsy, Amazon FBA)
• Online courses (Udemy, Teachable)
• Remote jobs — LinkedIn, Indeed, We Work Remotely, Remote.co

**High-Demand Skills:**
• Web/app development ($50-150/hr)
• Data science/AI ($60-130/hr)
• Cybersecurity ($80-150/hr)
• Digital marketing ($40-100/hr)
• Video editing ($30-80/hr)
• Graphic design ($25-75/hr)

**Financial Basics:**
• Pay yourself first — save at least 10% of income
• Build emergency fund (3-6 months expenses)
• Avoid high-interest debt (credit cards: 15-25% APR)
• Start investing early — compound interest is powerful
• Budget rule: 50% needs, 30% wants, 20% savings

**Job Tips:** Tailor resume per job. Practice interview answers. Network (LinkedIn). Follow up after interviews.`,
  },
  {
    keywords: ["recipe", "cook", "make", "prepare", "kitchen", "food", "dish", "ingredient", "how to"],
    priority: 7,
    response:
      `🍳 **Cooking Tips & Recipes**

I know many recipes! Try asking specifically:
• "How to make cake" — full cake recipe
• "How to cook eggs" — scrambled, fried, boiled, poached
• "How to make pasta" — pasta + tomato sauce recipe
• "How to make rice" — basic rice + fried rice
• "How to make bread" — simple homemade bread
• "How to make pizza" — from-scratch pizza
• "How to cook chicken" — pan-seared + baked methods

**General Cooking Tips:**
• Season as you go — taste and adjust
• Hot pan + cold oil = food won't stick
• Let meat rest after cooking (keeps juices in)
• Save pasta water — starch helps sauces stick
• Knife skills: curl fingers under, use rocking motion
• Mise en place — prep all ingredients before cooking`,
  },
  {
    keywords: ["lost", "where", "find", "missing", "can't find", "direction", "map", "navigate", "address", "location"],
    priority: 8,
    response:
      `🔍 **Finding Lost Items / Directions**

**Lost Something?**
1. Retrace your steps mentally — where were you last?
2. Check common places (under cushions, pockets, bags, car)
3. Use "Find My Device" for phones
4. Call places you visited — many keep lost & found
5. Post on local community groups or social media
6. If wallet/purse: cancel cards immediately

**Navigation Tips:**
• Use Google Maps / Apple Maps for directions
• Download offline maps before traveling (Google Maps: profile → Offline Maps)
• Save your home and work addresses
• In new cities, use landmarks to orient yourself
• North is up on most maps. Sun rises in east, sets in west`,
  },
  {
    keywords: ["travel", "trip", "vacation", "flight", "airport", "hotel", "packing", "passport", "visa", "tourism", "tourist"],
    priority: 9,
    response:
      `✈️ **Travel Tips**

**Before You Go:**
• Check passport validity (6+ months for many countries)
• Research visa requirements
• Get travel insurance (especially international)
• Notify your bank of travel dates
• Download offline maps and translation apps
• Make copies of important documents

**Packing Essentials:**
• Passport + copies, travel documents
• Medications + prescriptions
• Phone charger + adapter (check plug type!)
• Comfortable walking shoes
• Weather-appropriate clothing
• Basic first-aid kit

**At the Airport:**
• Arrive 2-3 hours before international flights
• Keep essentials in carry-on (meds, valuables, change of clothes)
• Liquids in 100ml containers in clear bag
• Check in online to save time

**Budget Tips:** Book flights early, travel off-season, use public transport, eat where locals eat.`,
  },
  {
    keywords: ["cold", "flu", "fever", "cough", "headache", "pain", "medicine", "sick", "ill", "health", "doctor", "treatment", "allergy", "infection"],
    priority: 10,
    response:
      `🏥 **Common Health Issues & First Aid**

**Cold/Flu:**
• Rest, drink plenty of fluids
• Acetaminophen/ibuprofen for pain/fever
• Honey for cough (not for children under 1)
• Usually resolves in 7-10 days

**Headache:**
• Drink water (dehydration is common cause)
• Rest in dark, quiet room
• Cold compress on forehead
• OTC pain relievers

**Fever:**
• Stay hydrated. Light clothing.
• Acetaminophen or ibuprofen
• See doctor if >103°F (39.4°C) or lasts 3+ days

**Allergies:** Antihistamines (cetirizine, loratadine). Avoid allergens.

**First Aid Basics:**
• Cuts: clean with water, apply pressure, bandage
• Burns: cool running water 10-20 min, don't use ice
• Sprains: R.I.C.E. (Rest, Ice, Compression, Elevation)
• CPR: 30 chest compressions → 2 rescue breaths

**When to See Doctor:** Symptoms worsen, persist beyond 10 days, or include difficulty breathing, severe pain, or high fever.`,
  },
  {
    keywords: ["relationship", "friend", "family", "argument", "fight", "communication", "dating", "love", "breakup", "social"],
    priority: 8,
    response:
      `❤️ **Relationships & Communication**

**Healthy Communication:**
• Listen actively — don't just wait to respond
• Use "I feel..." statements instead of "You always..."
• Don't bring up past arguments during new disagreements
• Pick the right time for serious conversations
• It's OK to take a break if emotions run high

**Conflict Resolution:**
1. Cool down first (at least 20 minutes)
2. Listen to the other person's perspective
3. Acknowledge their feelings
4. Focus on the problem, not the person
5. Find a compromise or solution together

**Building Strong Relationships:**
• Show appreciation regularly
• Respect boundaries
• Be honest and trustworthy
• Spend quality time together
• Support each other's goals
• Apologize when wrong

**Making Friends:** Join clubs/groups, be genuinely interested in others, follow up, be reliable.`,
  },
  {
    keywords: ["clean", "hygiene", "wash", "shower", "bathroom", "organize", "tidy", "declutter", "laundry"],
    priority: 7,
    response:
      `🧹 **Cleaning & Hygiene Tips**

**Hand Washing (Most Important!):**
• Wet hands, soap, scrub 20 seconds (sing "Happy Birthday" twice)
• Between fingers, under nails, backs of hands
• Dry thoroughly

**Daily Hygiene:** Brush teeth 2x/day (2 min each), shower daily, use deodorant.

**Quick Home Cleaning:**
• Daily: Make bed, wipe counters, do dishes
• Weekly: Vacuum, bathroom clean, laundry, dust
• Monthly: Deep clean fridge, wash curtains, organize closet

**Laundry Tips:** Sort by color (whites/darks), check pockets, read care labels, don't overload washer.

**Declutter:** If you haven't used it in 12 months, donate or discard.`,
  },

  // ====== TECH & GADGETS ======
  {
    keywords: ["battery", "charge", "slow", "computer", "laptop", "phone slow", "virus", "malware", "hack", "password", "wifi", "internet", "bluetooth", "download", "install", "update", "software", "hardware"],
    priority: 9,
    response:
      `💻 **Tech Troubleshooting**

**Phone/Computer Slow:**
1. Restart the device
2. Close unused apps/programs
3. Clear cache and temporary files
4. Check storage — keep 10-15% free
5. Update OS and apps
6. Check for malware

**Battery Tips:**
• Ideal range: 20-80% (not always 100%)
• Avoid extreme heat/cold
• Reduce screen brightness
• Turn off unused features (Bluetooth, GPS, WiFi)

**WiFi Issues:**
• Restart router (unplug 30 seconds)
• Move closer to router
• Change WiFi channel
• Forget network and reconnect

**Password Security:**
• 12+ characters with letters, numbers, symbols
• Never reuse passwords
• Use a password manager (Bitwarden, 1Password)
• Enable two-factor authentication (2FA)

**Internet Speed:** Test at speedtest.net. Fiber > cable > DSL > satellite.`,
  },
  {
    keywords: ["cybersecurity", "hacking", "firewall", "encryption", "vpn", "phishing", "malware", "ransomware", "ddos", "penetration", "security", "vulnerability", "exploit"],
    priority: 10,
    response:
      `🔐 **Cybersecurity Basics**

**Common Threats:**
• **Phishing** — fake emails/websites trick you into revealing credentials
• **Malware** — viruses, trojans, spyware, ransomware
• **Man-in-the-Middle** — attacker intercepts communication
• **Brute Force** — trying all password combinations
• **Social Engineering** — manipulating people to reveal information

**Protection:**
• Use strong, unique passwords (16+ chars, mix of types)
• Enable 2FA/MFA everywhere
• Keep software updated (patches security holes)
• Use VPN on public WiFi
• Don't click suspicious links or attachments
• Regular backups (3-2-1 rule: 3 copies, 2 media types, 1 offsite)

**Encryption:** Transforms data so only authorized parties can read it. HTTPS, AES-256, end-to-end encryption.

**Firewall:** Monitors and controls network traffic. Block unauthorized access.

**Ethical Hacking:** Legal penetration testing to find vulnerabilities before criminals do. Certifications: CEH, OSCP, CompTIA Security+.`,
  },
  {
    keywords: ["blockchain", "bitcoin", "cryptocurrency", "crypto", "ethereum", "nft", "defi", "mining", "wallet address", "token", "coin"],
    priority: 10,
    response:
      `⛓️ **Blockchain & Cryptocurrency**

**Blockchain:** Distributed digital ledger. Records transactions across many computers. Immutable (can't be changed).

**How It Works:** Transactions → grouped into blocks → verified by network → chained together. Each block references the previous one.

**Bitcoin (BTC):** First cryptocurrency (2009, Satoshi Nakamoto). Store of value ("digital gold"). Max supply: 21 million.

**Ethereum (ETH):** Smart contract platform. Programmable blockchain. Supports DeFi, NFTs, dApps.

**Key Concepts:**
• **Mining** — computers solve puzzles to verify transactions
• **Wallet** — stores public/private keys
• **Private Key** — like password (never share!)
• **Public Key/Address** — like email (share freely)
• **DeFi** — decentralized finance (no banks)
• **NFT** — unique digital ownership token

**Risks:** Volatile prices, scams, regulatory uncertainty, energy consumption (PoW).

**Investment Rule:** Only invest what you can afford to lose. Do your own research (DYOR).`,
  },
  {
    keywords: ["cloud", "aws", "azure", "hosting", "server", "domain", "dns", "ssl", "https", "deploy", "vercel", "netlify"],
    priority: 9,
    response:
      `☁️ **Cloud Computing & Hosting**

**Cloud Providers:**
• **AWS** — Amazon Web Services (largest market share)
• **Azure** — Microsoft (enterprise focused)
• **Google Cloud** — GCP (AI/ML strengths)
• **DigitalOcean/Vultr** — developer-friendly, affordable

**Key Concepts:**
• **Server** — computer that serves requests (web pages, APIs)
• **Domain** — your website address (example.com)
• **DNS** — translates domain names to IP addresses
• **SSL/TLS** — encrypts data between browser and server (https://)
• **CDN** — Content Delivery Network, caches content globally

**Hosting Platforms (Free):**
• **Vercel** — great for Next.js/React apps
• **Netlify** — static sites and JAMstack
• **GitHub Pages** — static sites from GitHub repos

**Deploy:** Push code → build → serve. Most platforms auto-deploy from Git.`,
  },
  {
    keywords: ["iot", "internet of things", "smart home", "smart device", "alexa", "google home", "siri", "assistant"],
    priority: 9,
    response:
      `🏠 **Internet of Things (IoT) & Smart Home**

**IoT:** Everyday objects connected to the internet, collecting and sharing data.

**Smart Home Devices:**
• **Voice Assistants:** Alexa, Google Home, Siri
• **Smart Lights:** Philips Hue, LIFX (control brightness, color via app)
• **Smart Thermostats:** Nest, Ecobee (learn your schedule)
• **Smart Locks:** August, Yale (keyless entry)
• **Security Cameras:** Ring, Arlo (motion alerts, recording)
• **Smart Plugs:** Turn any device into a smart device

**How They Work:** Device → WiFi/Bluetooth/Zigbee → Cloud → Phone app/voice command.

**Privacy Concerns:** Always-listening microphones, data collection, potential hacking. Use strong passwords, keep firmware updated.`,
  },

  // ====== SPORTS ======
  {
    keywords: ["football", "soccer", "fifa", "world cup", "goal", "championship", "league", "nba", "basketball", "cricket", "tennis", "baseball", "olympics", "sports"],
    priority: 9,
    response:
      `⚽ **Sports Overview**

**Football/Soccer:** Most popular sport (4 billion fans). 11 players, 90 minutes. FIFA World Cup (every 4 years). Top leagues: English Premier League, La Liga, Bundesliga.

**Cricket:** Popular in India, UK, Australia, Pakistan. Test (5 days), ODI (50 overs), T20 (20 overs). IPL is biggest T20 league.

**Basketball (NBA):** 5 players, 4 quarters of 12 min. Stars: Michael Jordan, LeBron James, Kobe Bryant. Dunk, three-pointer, free throw.

**Tennis:** Singles or doubles. Grand Slams: Australian Open, French Open, Wimbledon, US Open.

**Baseball (MLB):** 9 innings. Pitcher vs batter. Home run, strike, ball.

**Olympics:** Every 4 years. Summer (300+ events) + Winter. Most medals historically: USA, Soviet Union/Russia, China.

**Table of Top Sports by Global Fans:**
1. Football/Soccer — 4B
2. Cricket — 2.5B
3. Hockey — 2B
4. Tennis — 1B
5. Basketball — 2B`,
  },

  // ====== ARTS & CULTURE ======
  {
    keywords: ["music", "song", "singer", "band", "concert", "guitar", "piano", "drum", "album", "genre", "hip hop", "rock", "pop", "classical", "jazz"],
    priority: 9,
    response:
      `🎵 **Music Guide**

**Major Genres:**
• **Pop** — Catchy melodies. Top: Taylor Swift, Drake, BTS, Ariana Grande
• **Rock** — Guitar-driven. Led Zeppelin, Queen, Nirvana, Linkin Park
• **Hip-Hop/Rap** — Rhythmic vocals. Tupac, Eminem, Kendrick Lamar, Drake
• **Classical** — Orchestral. Bach, Mozart, Beethoven, Tchaikovsky
• **Jazz** — Improvisation, swing. Miles Davis, Coltrane, Ella Fitzgerald
• **Electronic (EDM)** — Synthesizers. Daft Punk, Calvin Harris, Deadmau5
• **R&B/Soul** — Smooth vocals. Michael Jackson, Whitney Houston, Beyoncé
• **Country** — Storytelling. Johnny Cash, Dolly Parton, Taylor Swift
• **K-Pop** — Korean pop. BTS, BLACKPINK, Stray Kids

**Instruments to Learn:** Guitar, piano/keyboard, ukulele, drums, violin.

**Music Theory Basics:** Scale (do re mi fa sol la ti), chords (3+ notes), tempo (BPM), key signature.`,
  },
  {
    keywords: ["movie", "film", "cinema", "hollywood", "actor", "actress", "director", "oscar", "series", "tv show", "netflix", "anime"],
    priority: 9,
    response:
      `🎬 **Movies & Entertainment**

**Highest Grossing Films:** Avatar ($2.9B), Avengers: Endgame ($2.8B), Avatar 2, Titanic, Star Wars: The Force Awakens.

**Top Directors:** Steven Spielberg, Christopher Nolan, Martin Scorsese, Quentin Tarantino, James Cameron.

**Oscars (Academy Awards):** Given annually since 1929. Major categories: Best Picture, Director, Actor/Actress, Screenplay.

**Streaming Platforms:** Netflix, Disney+, Amazon Prime, HBO Max, Apple TV+, Hulu.

**Anime:** Japanese animation. Popular: Attack on Titan, Death Note, Naruto, One Piece, Dragon Ball Z, Demon Slayer, Jujutsu Kaisen.

**Classic Films:** The Godfather, Shawshank Redemption, Schindler's List, Pulp Fiction, Inception, Interstellar.`,
  },
  {
    keywords: ["book", "read", "novel", "author", "literature", "fiction", "nonfiction", "poetry", "writing"],
    priority: 8,
    response:
      `📖 **Reading & Literature**

**All-Time Great Novels:**
• To Kill a Mockingbird (Harper Lee) — justice, racism in America
• 1984 (George Orwell) — dystopian surveillance state
• The Great Gatsby (F. Scott Fitzgerald) — American Dream
• Harry Series (J.K. Rowling) — wizarding world
• Lord of the Rings (J.R.R. Tolkien) — epic fantasy
• Pride and Prejudice (Jane Austen) — romance, class
• The Alchemist (Paulo Coelho) — following dreams
• Atomic Habits (James Clear) — self-improvement

**How to Read More:**
• Read 20 pages/day = 30+ books/year
• Carry a book everywhere
• Read before bed (replace phone scrolling)
• Join a book club for motivation

**Famous Authors:** Shakespeare, Jane Austen, Mark Twain, Gabriel García Márquez, Leo Tolstoy, J.K. Rowling.`,
  },

  // ====== SOCIAL / EMOJI ======
  {
    keywords: ["joke", "funny", "laugh", "humor", "pun", "riddle"],
    priority: 8,
    response:
      `😄 **Here are some jokes!**

**Classic:** Why don't scientists trust atoms? Because they make up everything!

**Tech:** Why do programmers prefer dark mode? Because light attracts bugs!

**Math:** Why was 6 afraid of 7? Because 7, 8 (ate) 9!

**Science:** What did the physicist say to the biologist? "I don't trust atoms, they make up everything."

**Riddle:** What has keys but no locks? A piano!
What has a head and a tail but no body? A coin!
What can travel around the world while staying in a corner? A stamp!

**More riddles, jokes, or fun facts? Just ask!** 😊`,
  },
  {
    keywords: ["quote", "inspire", "motivation", "motivational", "inspirational"],
    priority: 8,
    response:
      `✨ **Inspiring Quotes**

"The only way to do great work is to love what you do." — Steve Jobs

"Be the change you wish to see in the world." — Mahatma Gandhi

"Stay hungry, stay foolish." — Steve Jobs

"In the middle of difficulty lies opportunity." — Albert Einstein

"The best time to plant a tree was 20 years ago. The second best time is now." — Chinese Proverb

"I have not failed. I've just found 10,000 ways that won't work." — Thomas Edison

"Believe you can and you're halfway there." — Theodore Roosevelt

"The only impossible journey is the one you never begin." — Tony Robbins

**Remember:** Every expert was once a beginner. Keep going! 💪`,
  },
  {
    keywords: ["time", "clock", "timezone", "timezone conversion", "current time", "what time"],
    priority: 7,
    response:
      `⏰ **Time & Timezones**

**Major Timezones (UTC offsets):**
• UTC-12:00 — Baker Island (farthest west)
• UTC-5:00 — New York (EST)
• UTC+0:00 — London (GMT)
• UTC+1:00 — Paris (CET)
• UTC+3:00 — Moscow
• UTC+5:30 — India (IST)
• UTC+6:00 — Bangladesh (BST)
• UTC+7:00 — Thailand/Vietnam
• UTC+8:00 — China/Philippines/Singapore
• UTC+9:00 — Japan/South Korea
• UTC+10:00 — Australia (east)
• UTC+12:00 — New Zealand

**How Timezones Work:** Based on longitude. Each timezone is ~15° wide. Greenwich Mean Time (GMT) is the reference.

**Daylight Saving:** Many countries shift clocks 1 hour in summer (spring forward, fall back).`,
  },
  {
    keywords: ["color", "colour", "paint", "draw", "art", "design", "font", "typography"],
    priority: 7,
    response:
      `🎨 **Colors & Design Basics**

**Color Wheel:**
• **Primary:** Red, Blue, Yellow
• **Secondary:** Green (blue+yellow), Orange (red+yellow), Purple (red+blue)
• **Tertiary:** Mix of primary + secondary

**Color Harmonies:**
• Complementary — opposite on wheel (blue + orange). High contrast.
• Analogous — next to each other (blue, blue-green, green). Harmonious.
• Triadic — evenly spaced (red, yellow, blue). Vibrant.

**Color Psychology:**
• Red — energy, passion, urgency
• Blue — trust, calm, professionalism
• Green — nature, health, growth
• Yellow — happiness, warmth, caution
• Purple — luxury, creativity, wisdom
• Black — power, elegance, mystery
• White — purity, simplicity, cleanliness

**Design Principles:** Balance, contrast, hierarchy, alignment, repetition, proximity.`,
  },
  {
    keywords: ["space", "universe", "big bang", "dark matter", "dark energy", "nebula", "supernova", "constellation", "asteroid belt", "exoplanet"],
    priority: 10,
    response:
      `🌌 **The Universe**

**Big Bang:** ~13.8 billion years ago, universe began from an infinitely dense point. Expanded rapidly. CMB radiation is evidence.

**Observable Universe:** 93 billion light-years in diameter. ~2 trillion galaxies.

**Dark Matter:** ~27% of universe. Doesn't emit light. Holds galaxies together. Discovered by galaxy rotation anomalies.

**Dark Energy:** ~68% of universe. Causes accelerating expansion. Discovered 1998. Unknown nature.

**Visible Matter:** Only ~5% — stars, planets, gas, dust, us.

**Interesting Objects:**
• **Nebula** — giant cloud of gas/dust. Birthplace of stars.
• **Supernova** — exploding star. Can outshine entire galaxy briefly.
• **Pulsar** — rapidly spinning neutron star. Emits radiation beams.
• **Black Hole** — gravity so strong nothing escapes. Sagittarius A* is at center of Milky Way.
• **Exoplanets** — planets orbiting other stars. 5,000+ discovered. Some in habitable zone.

**Constellations:** 88 officially recognized. Orion, Ursa Major, Cassiopeia are easily visible.`,
  },
  {
    keywords: ["animal", "dinosaur", "species", "extinct", "endangered", "pet", "dog", "cat", "bird", "fish", "whale", "elephant", "lion", "tiger", "bear", "shark", "snake", "spider", "insect"],
    priority: 9,
    response:
      `🐾 **Animals**

**Animal Kingdom (major groups):**
• **Mammals** — warm-blooded, hair/fur, nurse young. ~6,400 species
• **Birds** — warm-blooded, feathers, lay eggs. ~10,000 species
• **Reptiles** — cold-blooded, scales. ~11,000 species
• **Amphibians** — wet skin, live on land and water. ~8,000 species
• **Fish** — aquatic, gills. ~35,000 species
• **Insects** — 6 legs, exoskeleton. 1 million+ known species (most diverse)

**Endangered Species:**
• Sumatran Orangutan — ~14,000 left
• Javan Rhino — ~75 left
• Vaquita (porpoise) — ~10 left
• Mountain Gorilla — ~1,000 (recovering!)

**Fun Animal Facts:**
• Cheetah can sprint to 112 km/h in 3 seconds
• Octopus has 3 hearts and blue blood
• Elephant is the only animal that can't jump
• A group of flamingos is called a "flamboyance"
• Honeybees can recognize human faces

**Dinosaurs:** Extinct 66 million years ago (asteroid impact). Birds are living dinosaurs!`,
  },
  {
    keywords: ["plant", "flower", "tree", "garden", "grow", "seed", "leaf", "root", "photosynthesis", "succulent", "herb"],
    priority: 9,
    response:
      `🌱 **Plants & Gardening**

**Basic Plant Needs:** Sunlight, water, CO₂, nutrients (soil), space.

**How Plants Work:**
• Roots absorb water and nutrients from soil
• Stems transport water up and nutrients down
• Leaves perform photosynthesis (light → food)
• Flowers attract pollinators for reproduction
• Seeds spread and grow into new plants

**Easy Indoor Plants:**
• **Snake Plant** — nearly indestructible, air purifier
• **Pothos** — trailing vine, tolerates low light
• **Succulents** — need infrequent watering
• **Spider Plant** — easy to propagate
• **Peace Lily** — blooms indoors, air purifier

**Outdoor Gardening Tips:**
• Know your hardiness zone
• Most vegetables need 6-8 hours of sun
• Water deeply but less often (encourages deep roots)
• Compost improves soil health
• Mulch retains moisture and suppresses weeds

**Useful Herbs:** Basil, mint, rosemary, thyme, parsley, cilantro.`,
  },

  // ====== MISCELLANEOUS USEFUL ======
  {
    keywords: ["convert", "conversion", "unit", "measurement", "meter", "foot", "inch", "kilogram", "pound", "mile", "kilometer", "liter", "gallon", "celsius", "fahrenheit"],
    priority: 8,
    response:
      `📏 **Unit Conversions**

**Length:**
• 1 inch = 2.54 cm
• 1 foot = 30.48 cm
• 1 mile = 1.609 km
• 1 meter = 3.281 feet
• 1 km = 0.621 miles

**Weight:**
• 1 kg = 2.205 pounds
• 1 pound = 453.6 grams
• 1 ounce = 28.35 grams

**Volume:**
• 1 liter = 0.264 US gallons
• 1 gallon = 3.785 liters
• 1 cup = 240 ml
• 1 tablespoon = 15 ml

**Temperature:**
• °F = (°C × 9/5) + 32
• °C = (°F - 32) × 5/9
• 0°C = 32°F (freezing)
• 37°C = 98.6°F (body temp)
• 100°C = 212°F (boiling)

**Quick Reference:** A standard sheet of paper is 8.5 × 11 inches (A4 is 210 × 297mm).`,
  },
  {
    keywords: ["binary", "hexadecimal", "decimal", "octal", "bit", "byte", "computer science", "data", "0", "1"],
    priority: 9,
    response:
      `🔢 **Number Systems & Computer Data**

**Number Systems:**
• **Binary (base-2):** 0 and 1 only. Computer language.
• **Octal (base-8):** 0-7
• **Decimal (base-10):** 0-9. What humans use.
• **Hexadecimal (base-16):** 0-9, A-F. Used in color codes, memory.

**Data Sizes:**
• 1 bit = 0 or 1
• 1 byte = 8 bits (one character)
• 1 kilobyte (KB) = 1,024 bytes
• 1 megabyte (MB) = 1,024 KB
• 1 gigabyte (GB) = 1,024 MB
• 1 terabyte (TB) = 1,024 GB

**Examples:** A text page ≈ 2 KB, a photo ≈ 3-5 MB, an HD movie ≈ 4 GB, a song ≈ 4 MB.

**Color Codes:** #FF0000 = red (hex: FF red, 00 green, 00 blue). Each channel 0-255 (8 bits).`,
  },
  {
    keywords: ["quote", "saying", "proverb", "idiom", "expression", "meaning"],
    priority: 7,
    response:
      `💬 **Common Sayings & Meanings**

• "Break a leg" — Good luck! (theater tradition)
• "Bite the bullet" — Endure something painful
• "Burning the midnight oil" — Working late
• "Actions speak louder than words" — Do, don't just say
• "The ball is in your court" — It's your decision
• "Kill two birds with one stone" — Solve two problems at once
• "Piece of cake" — Something very easy
• "Under the weather" — Feeling sick
• "Hit the nail on the head" — Exactly right
• "Let the cat out of the bag" — Reveal a secret
• "Spill the beans" — Reveal secret information
• "Costs an arm and a leg" — Very expensive

**Proverbs:**
• "A stitch in time saves nine" — Fix problems early
• "Knowledge is power" — Francis Bacon
• "Where there's a will, there's a way" — Persistence works`,
  },
  {
    keywords: ["population", "demographic", "census", "density", "urban", "rural", "immigration", "migration"],
    priority: 8,
    response:
      `👥 **World Population**

**Current:** ~8.1 billion (2024)

**Most Populous Countries:**
1. India — 1.44 billion
2. China — 1.41 billion
3. USA — 335 million
4. Indonesia — 278 million
5. Pakistan — 240 million
6. Nigeria — 220 million
7. Brazil — 215 million
8. Bangladesh — 175 million
9. Russia — 144 million
10. Mexico — 130 million

**Milestones:**
• 1 billion — 1804
• 2 billion — 1927 (123 years)
• 4 billion — 1974
• 8 billion — 2022

**Urban vs Rural:** 56% of world population lives in cities. Expected to reach 68% by 2050.

**Most Densely Populated:** Monaco (26,000/km²), Singapore, Hong Kong, Bangladesh.

**Least Densely Populated:** Mongolia, Namibia, Australia, Iceland.`,
  },
  {
    keywords: ["legal", "law", "rights", "court", "judge", "police", "crime", "prison", "arrest", "lawsuit"],
    priority: 9,
    response:
      `⚖️ **Legal Basics & Rights**

**Universal Human Rights (UN Declaration, 1948):**
• Right to life, liberty, and security
• Freedom from torture, slavery, and discrimination
• Right to education, work, and rest
• Freedom of opinion, expression, and religion
• Right to privacy and fair trial

**If Arrested (in most countries):**
1. You have the right to remain silent
2. You have the right to a lawyer
3. You have the right to know the charges
4. Don't resist arrest — contest in court

**Common Legal Rights:**
• Innocent until proven guilty
• Right to a fair and public trial
• Right to legal representation
• Protection against unreasonable search and seizure
• Right to privacy

**Police Interactions:** Stay calm, be respectful, provide ID if required, don't consent to searches (say "I do not consent"), ask if you're free to go.

**Note:** Laws vary by country and jurisdiction. Always consult a lawyer for legal advice.`,
  },
  {
    keywords: ["car", "drive", "driving", "road", "traffic", "license", "accident", "insurance", "fuel", "gas", "electric vehicle", "ev", "tesla"],
    priority: 9,
    response:
      `🚗 **Driving & Cars**

**Driving Basics:**
• Right side: USA, most of Europe, most of Asia
• Left side: UK, Australia, Japan, India, Bangladesh, South Africa

**Road Signs:**
• Red octagon = STOP
• Red triangle = Yield
• Blue circle = Mandatory instruction
• Yellow diamond = Warning

**Car Maintenance:**
• Check oil level monthly
• Replace air filter every 12,000-15,000 km
• Check tire pressure monthly (including spare)
• Replace tires when tread is worn (2mm minimum)
• Service every 10,000-15,000 km or annually

**Electric Vehicles (EVs):**
• No gas needed — charge at home or stations
• Lower maintenance (no oil changes, fewer moving parts)
• Faster acceleration (instant torque)
• Tesla, BYD, Hyundai, BMW lead the market
• Range: 250-600+ km per charge
• Charging: Level 1 (home outlet), Level 2 (wall charger), Level 3 (DC fast)

**Safety:** Always wear seatbelt, don't text and drive, maintain safe distance, check mirrors.`,
  },
  {
    keywords: ["language", "speak", "translate", "english", "spanish", "french", "chinese", "arabic", "hindi", "portuguese", "russian", "japanese", "german", "korean"],
    priority: 8,
    response:
      `🗣️ **World Languages**

**Most Spoken (by total speakers):**
1. English — 1.5 billion
2. Mandarin Chinese — 1.1 billion
3. Hindi — 600+ million
4. Spanish — 560+ million
5. French — 310+ million
6. Arabic — 310+ million
7. Bengali — 270+ million
8. Portuguese — 260+ million
9. Russian — 250+ million
10. Japanese — 130+ million

**Language Families:**
• Indo-European — English, Spanish, Hindi, Russian, Portuguese, French, German
• Sino-Tibetan — Mandarin, Cantonese
• Afro-Asiatic — Arabic, Hebrew
• Dravidian — Tamil, Telugu, Malayalam

**Useful Phrases:**
• Hello: Hola, Bonjour, 你好 (Nǐ hǎo), مرحبا (Marhaba), नमस्ते (Namaste)
• Thank you: Gracias, Merci, 谢谢 (Xièxie), شكرًا (Shukran), धन्यवाद (Dhanyavaad)

**Tips:** Start with pronunciation, learn 1000 most common words, practice with native speakers, use apps like Duolingo.`,
  },
  {
    keywords: ["weight", "lose weight", "exercise", "workout", "gym", "muscle", "fitness", "cardio", "strength", "run", "yoga", "stretch", "abs", "diet plan", "calorie deficit"],
    priority: 9,
    response:
      `💪 **Fitness & Exercise Guide**

**Weight Loss Basics:** Calories in < Calories out. Aim for 500 cal/day deficit = ~1 lb/week loss.

**Cardio (burns calories, heart health):**
• Walking — 3-4 km/h, easiest to start
• Running — 600-800 cal/hour
• Swimming — full body, low impact
• Cycling — great for joints
• Jump rope — 700-1000 cal/hour

**Strength Training (builds muscle, boosts metabolism):**
• Squats, deadlifts, bench press, overhead press
• Push-ups, pull-ups, rows
• 3 sets of 8-12 reps, 2-3 times per week
• Progressive overload — gradually increase weight/reps

**Yoga:** Flexibility, balance, stress relief. Types: Hatha (beginner), Vinyasa (flow), Bikram (hot).

**Beginner Routine:**
• Mon/Thu: Upper body (push-ups, rows, shoulder press)
• Tue/Fri: Lower body (squats, lunges, calf raises)
• Wed/Sat: Cardio (30 min walk/jog)
• Sun: Rest or yoga

**Tips:** Start slow, consistency > intensity, protein helps muscle recovery (1.6-2g per kg bodyweight).`,
  },
  {
    keywords: ["photography", "camera", "photo", "picture", "lens", "aperture", "shutter", "iso", "composition", "portrait", "landscape"],
    priority: 8,
    response:
      `📷 **Photography Basics**

**Exposure Triangle:**
• **Aperture** (f-stop) — how wide lens opens. Low f = more light, blurry background. High f = less light, sharp everything.
• **Shutter Speed** — how long sensor is exposed. Fast (1/1000) freezes motion. Slow (1/30) creates blur.
• **ISO** — sensor sensitivity. Low (100-400) = clean, needs more light. High (1600+) = grainy, works in low light.

**Composition Rules:**
• **Rule of Thirds** — place subjects at intersection points
• **Leading Lines** — roads, fences guide eye to subject
• **Framing** — use doorways, windows to frame subject
• **Fill the Frame** — get close, eliminate distractions

**Camera Settings:**
• **Auto Mode** — camera decides everything (good for beginners)
• **Aperture Priority (A/Av)** — you set aperture, camera sets rest
• **Manual (M)** — you control everything

**Phone Photography:** Clean lens, tap to focus, use natural light, edit in Lightroom/Snapseed.`,
  },
  {
    keywords: ["cooking", "kitchen", "safety", "fire safety", "first aid kit", "earthquake preparation", "disaster preparedness", "survival", "evacuation"],
    priority: 8,
    response:
      `🚨 **Safety & Emergency Preparedness**

**Home Fire Safety:**
• Install smoke detectors on every floor
• Test monthly, replace batteries annually
• Keep fire extinguisher in kitchen
• Know 2 escape routes from every room
• Stop, Drop, and Roll if clothes catch fire
• Never leave cooking unattended

**Earthquake Safety:**
• **Drop, Cover, Hold On** — under sturdy furniture
• Stay away from windows, heavy objects
• If outdoors — move to open area
• After: check for injuries, gas leaks, structural damage

**Emergency Kit (keep at home):**
• Water (4L per person per day for 3 days)
• Non-perishable food (3 days supply)
• Flashlight + batteries
• First aid kit
• Whistle
• Copies of important documents
• Cash (small bills)
• Medications (7-day supply)
• Phone charger / power bank

**Car Emergency Kit:** Jumper cables, spare tire, flashlight, blanket, water, first aid kit.`,
  },
  {
    keywords: ["economics", "economy", "inflation", "recession", "gdp", "stock market", "interest rate", "tax", "unemployment", "trade"],
    priority: 9,
    response:
      `📈 **Economics Basics**

**Key Concepts:**
• **GDP (Gross Domestic Product)** — total value of goods/services produced. Measures economic size.
• **Inflation** — prices rising over time. Moderate (2-3%) is healthy. High inflation erodes purchasing power.
• **Recession** — GDP declines for 2+ consecutive quarters. Rising unemployment, reduced spending.
• **Interest Rate** — cost of borrowing money. Central banks raise rates to fight inflation, lower to stimulate growth.
• **Unemployment Rate** — % of workforce without jobs. Natural rate: 3-5%.
• **Supply & Demand** — more demand = higher price. More supply = lower price.

**Major Economies (GDP):**
1. USA — ~$28 trillion
2. China — ~$18 trillion
3. Japan — ~$4.2 trillion
4. Germany — ~$4.1 trillion
5. India — ~$3.7 trillion

**Stock Market:** Companies sell shares (ownership). Price reflects expectations of future profits. S&P 500: 500 largest US companies.

**Personal Finance:** Invest early, diversify, low-cost index funds outperform most actively managed funds.`,
  },
  {
    keywords: ["cooking tip", "food safety", "expiry", "shelf life", "storage", "refrigerator", "freezer", "preservation"],
    priority: 8,
    response:
      `🥫 **Food Storage & Safety**

**Refrigerator (0-4°C / 32-40°F):**
• Milk: 5-7 days after opening
• Eggs: 3-5 weeks
• Cooked leftovers: 3-4 days
• Fresh meat: 1-2 days
• Fruits/vegetables: 3-7 days

**Freezer (-18°C / 0°F):**
• Bread: 3 months
• Raw meat: 4-12 months
• Cooked meals: 2-3 months
• Fruits/vegetables: 8-12 months

**Pantry (cool, dark):**
• Canned goods: 1-5 years
• Rice/pasta: 1-2 years
• Spices: 1-3 years (lose potency)
• Honey: essentially forever

**Food Safety Tips:**
• Wash hands before handling food
• Don't thaw on counter — use fridge, cold water, or microwave
• Internal temp: poultry 165°F (74°C), ground meat 160°F (71°C), steaks 145°F (63°C)
• When in doubt, throw it out!`,
  },
  {
    keywords: ["house", "home", "apartment", "rent", "mortgage", "real estate", "buying", "property", "interior", "furniture", "decor"],
    priority: 8,
    response:
      `🏠 **Housing & Home**

**Renting vs Buying:**
• Renting: flexible, lower upfront cost, no maintenance responsibility
• Buying: builds equity, stable payments (fixed mortgage), freedom to modify

**Mortgage Basics:**
• Home loan from bank, typically 15-30 years
• Down payment: 10-20% of home price
• Monthly payment = principal + interest + taxes + insurance (PITI)

**Home Buying Steps:**
1. Determine budget (28% rule: housing ≤ 28% of gross income)
2. Get pre-approved for mortgage
3. Find real estate agent
4. Search and view homes
5. Make offer
6. Home inspection
7. Close and move in

**Interior Design Tips:**
• Choose a color palette (3-4 colors max)
• Mix textures (wood, metal, fabric)
• Layer lighting (overhead + task + accent)
• Scale furniture to room size
• Add plants for life and color`,
  },
  {
    keywords: ["diy", "repair", "fix", "plumbing", "electric", "paint", "tool", "drill", "hammer", "screw", "nail"],
    priority: 8,
    response:
      `🔧 **DIY & Home Repair Basics**

**Essential Tools:**
• Hammer, screwdriver set (Phillips + flathead)
• Pliers, adjustable wrench
• Tape measure, level
• Drill/driver, drill bits
• Utility knife, duct tape
• Stud finder, wire stripper

**Common Fixes:**
• **Leaky faucet:** Turn off water, replace washer or cartridge
• **Running toilet:** Adjust flapper chain or replace fill valve
• **Clogged drain:** Plunger first, then baking soda + vinegar
• **Hanging a picture:** Use stud finder, appropriate anchor for weight
• **Painting walls:** Prep (tape, drop cloth), primer if needed, 2 coats

**Electrical Safety:**
• ALWAYS turn off breaker before working on electrical
• Test with non-contact voltage tester
• Wire nuts: black to black (hot), white to white (neutral), green to green (ground)
• Call an electrician for panel work or if unsure

**When to Call a Professional:** Major plumbing, electrical panel, structural changes, gas work.`,
  },

  // ====== PERSONAL GROWTH ======
  {
    keywords: ["habit", "discipline", "routine", "procrastination", "lazy", "motivation", "goal", "self-improvement", "self improvement", "personal development"],
    priority: 9,
    response:
      `🌱 **Personal Growth & Habits**

**Building Habits (Atomic Habits method):**
1. Make it **obvious** — visual cues, environment design
2. Make it **attractive** — pair with something you enjoy
3. Make it **easy** — start with 2-minute version
4. Make it **satisfying** — immediate reward

**Beating Procrastination:**
• 2-Minute Rule: if it takes <2 min, do it now
• Break big tasks into tiny steps
• Set specific deadlines (not "later" but "at 3 PM")
• Remove distractions (phone in another room)
• Reward yourself after completing tasks

**Morning Routine Ideas:**
• Wake at consistent time
• Hydrate (water first thing)
• Exercise or stretch (10-30 min)
• Plan your day (top 3 priorities)
• Avoid phone for first 30 min

**Discipline > Motivation:** Motivation fades. Systems and habits keep you going. Design your environment so good habits are easy and bad habits are hard.

**SMART Goals:** Specific, Measurable, Achievable, Relevant, Time-bound.`,
  },
  {
    keywords: ["interview", "resume", "cv", "cover letter", "job application", "hiring", "portfolio", "linkedin", "career change"],
    priority: 9,
    response:
      `📋 **Job Search Tips**

**Resume/CV:**
• Keep it 1 page (2 max for extensive experience)
• Start with strong summary (2-3 lines)
• Use action verbs (built, led, improved, created)
• Quantify achievements ("Increased sales by 25%")
• Tailor to each job description
• Clean format, consistent fonts, no typos

**Cover Letter:**
• Address hiring manager by name
• Opening: Why you're excited about this role
• Middle: Your relevant experience + examples
• Closing: Thank them, express enthusiasm
• Keep it concise (half page)

**Interview Prep:**
• Research the company thoroughly
• Prepare STAR answers (Situation, Task, Action, Result)
• Common questions: "Tell me about yourself," "Why this company?", "Strengths/weaknesses?", "Greatest challenge?"
• Prepare questions to ask them (shows interest)
• Dress professionally, arrive 10-15 min early
• Follow up with thank-you email within 24 hours

**LinkedIn:** Professional photo, compelling headline, detailed experience, recommendations, engage with industry content.`,
  },
  {
    keywords: ["color", "skin", "hair", "style", "fashion", "outfit", "dress", "clothes", "wardrobe"],
    priority: 7,
    response:
      `👗 **Fashion & Style Basics**

**Color Coordination:**
• Monochromatic: shades of same color (safe, elegant)
• Complementary: opposite on color wheel (bold, eye-catching)
• Analogous: next to each other on wheel (harmonious)

**Wardrobe Essentials:**
• White t-shirt, dark jeans, blazer
• Classic sneakers, dress shoes
• Little black dress (women), navy suit (men)
• Well-fitted clothes always look better

**Style Tips:**
• Fit is king — tailoring makes cheap clothes look expensive
• Invest in basics, accessorize for personality
• Match belt with shoes
• Stick to 3 colors per outfit maximum
• Quality over quantity

**Body Types:**
• Find clothes that flatter YOUR shape
• Dark colors slim, light colors expand
• Vertical stripes elongate, horizontal widen`,
  },

  // ====== GREETINGS & ETIQUETTE ======
  {
    keywords: ["hello", "hi ", "hey", "greetings", "good morning", "good afternoon", "good evening", "howdy", "yo ", "sup"],
    priority: 5,
    response:
      `Hello! 👋 I'm Quantum AI. How can I help you today?\n\nYou can ask me about anything — science, cooking, math, geography, coding, health, everyday life, and more!`,
  },
  {
    keywords: ["how are you", "how do you do"],
    priority: 5,
    response: `I'm doing great, thanks for asking! I'm Quantum AI, running locally on your device right now. How can I help?`,
  },
  {
    keywords: ["thank", "thanks", "thx", "appreciate"],
    priority: 5,
    response: `You're welcome! 😊 Happy to help anytime. Feel free to ask more questions!`,
  },
  {
    keywords: ["bye", "goodbye", "see you", "good night"],
    priority: 5,
    response: `Goodbye! 👋 I'm always here — online or offline. Have a great day!`,
  },

  // ====== WHAT CAN YOU DO ======
  {
    keywords: ["what can you do", "capabilities", "help me", "can you help"],
    priority: 6,
    response:
      `🤖 **What I Can Help With (Offline):**

• 🍳 **Cooking** — Recipes for cake, eggs, pasta, rice, bread, pizza, chicken, and more
• 🌍 **Geography** — Countries, capitals, world facts (50+ countries!)
• 🔬 **Science** — Physics, biology, chemistry, astronomy, quantum computing
• 🔢 **Math** — Arithmetic, algebra, geometry, trigonometry, percentages
• 💻 **Programming** — HTML, CSS, JavaScript, Python, coding concepts
• 📜 **History** — Major events, inventions, discoveries, civilizations
• 🏥 **Health** — Common illnesses, first aid, nutrition, sleep
• 🧘 **Mental Health** — Stress management, study tips, focus
• 💰 **Practical** — Career advice, money tips, travel packing
• 📱 **Tech** — Troubleshooting, cybersecurity, blockchain, IoT
• 🔒 **Safety** — Lost wallet/phone procedures, emergency numbers
• ❤️ **Relationships** — Communication tips, conflict resolution
• 🎵 **Culture** — Music, movies, books, sports, art, fashion
• 💪 **Fitness** — Exercise routines, diet, weight management
• 🏠 **Home** — DIY repairs, cleaning, cooking, gardening
• 📈 **Economics** — GDP, inflation, stock market, personal finance
• ⚖️ **Legal** — Human rights, what to do if arrested
• 🗣️ **Languages** — Translations, language learning tips
• 🧮 **Conversions** — Units, temperatures, measurements
• 📋 **Career** — Resume tips, interview prep, job search

**Just ask naturally!** I understand plain English.`,
  },

  // ====== OFFLINE MODE INFO ======
  {
    keywords: ["offline", "no internet", "without wifi", "without internet"],
    priority: 6,
    response:
      `You're currently using my **offline mode**. 🟢

I'm running a built-in knowledge engine directly in your browser — no internet needed.

I can help with: cooking, science, math, geography, history, coding, health, everyday life advice, and much more.

**For even better responses**, go online and use General (Gemini) or Hacking (Groq) mode.`,
  },
  {
    keywords: ["version", "update", "changelog", "what's new", "latest version"],
    priority: 6,
    response:
      `📦 **Quantum AI — Version Info**

**Current Version:** v1.0

**What's Included:**
• ✅ Online mode with Gemini (General) & Groq (Hacking)
• ✅ Offline mode with built-in knowledge engine
• ✅ 100+ topics covering science, geography, cooking, health, and more
• ✅ Multiple API key support for faster responses
• ✅ Separate chat history for General and Hacking modes
• ✅ PWA support — install as an app
• ✅ Made and developed by **RAGIB**

**Coming in Future:**
• More offline topics
• Improved matching accuracy
• Voice input/output
• File/image support`,
  },
];

// ============================================================
// Pattern-based response system
// Catches common question patterns not in the topic list
// ============================================================

interface PatternRule {
  /** Regex patterns to match against the input */
  patterns: RegExp[];
  /** Function that generates a response from the match */
  respond: (input: string, match: RegExpMatchArray) => string | null;
}

const PATTERN_RULES: PatternRule[] = [
  // "what is/are X?" pattern
  {
    patterns: [
      /^(?:what|who|where|when|why|how|tell me about|explain|describe)\s+(?:is|are|was|were)\s+(?:a |an |the )?(.{2,60})\??$/i,
      /^(?:what|who|where|when|why|how|tell me about|explain|describe)\s+(.{2,60})\??$/i,
    ],
    respond: (_input, match) => {
      const subject = match[1].replace(/\?/g, "").trim().toLowerCase();
      // Check if the subject matches any known topic
      const subjectMatch = findExactOrFuzzyTopic(subject);
      if (subjectMatch) return subjectMatch;
      return null;
    },
  },
  // "tell me about X" pattern
  {
    patterns: [
      /(?:tell me|explain|describe|what do you know about|info on|information about|learn about)\s+(.{2,60})/i,
    ],
    respond: (_input, match) => {
      const subject = match[1].replace(/\?/g, "").trim().toLowerCase();
      const subjectMatch = findExactOrFuzzyTopic(subject);
      if (subjectMatch) return subjectMatch;
      return null;
    },
  },
  // "how to X" / "how do I X" / "how can I X"
  {
    patterns: [
      /(?:how (?:do|can|should|to|would)?\s*(?:I|we|you|one)?\s*)(.{3,60})/i,
    ],
    respond: (_input, match) => {
      const subject = match[1].replace(/\?/g, "").trim().toLowerCase();
      const subjectMatch = findExactOrFuzzyTopic(subject);
      if (subjectMatch) return subjectMatch;
      return null;
    },
  },
  // "why does/do/is/are X" pattern
  {
    patterns: [
      /(?:why (?:does|do|is|are|did|did|was|were|can|could|should|would))\s+(.{3,60})/i,
    ],
    respond: (_input, match) => {
      const subject = match[1].replace(/\?/g, "").trim().toLowerCase();
      const subjectMatch = findExactOrFuzzyTopic(subject);
      if (subjectMatch) return subjectMatch;
      return null;
    },
  },
  // "benefits of X" / "advantages of X"
  {
    patterns: [
      /(?:benefits?|advantages?|pros|good (?:things|points))\s+(?:of|about|for)\s+(.{2,60})/i,
    ],
    respond: (_input, match) => {
      const subject = match[1].replace(/\?/g, "").trim().toLowerCase();
      const subjectMatch = findExactOrFuzzyTopic(subject);
      if (subjectMatch) return subjectMatch;
      return null;
    },
  },
];

/**
 * Try to find a matching topic using fuzzy/partial matching.
 * First checks exact topic matches, then tries partial keyword matching.
 */
function findExactOrFuzzyTopic(query: string): string | null {
  const queryLower = query.toLowerCase().trim();
  const queryWords = queryLower
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  let bestScore = 0;
  let bestEntry: TopicEntry | null = null;

  for (const entry of TOPICS) {
    // Check if any keyword is a substring of the query or vice versa
    let score = 0;
    for (const kw of entry.keywords) {
      const kwLower = kw.toLowerCase();
      // Exact match
      if (queryLower === kwLower) {
        score += 50;
      }
      // Query contains keyword
      else if (queryLower.includes(kwLower)) {
        score += 20;
      }
      // Keyword contains query
      else if (kwLower.includes(queryLower)) {
        score += 15;
      }
      // Word-level match
      else {
        const kwWords = kwLower.split(/\s+/);
        for (const qw of queryWords) {
          for (const kwW of kwWords) {
            if (qw === kwW && qw.length > 2) {
              score += 10;
            } else if (qw.includes(kwW) || kwW.includes(qw)) {
              if (qw.length > 3 && kwW.length > 3) {
                score += 5;
              }
            }
          }
        }
      }
    }
    // Weight by priority
    const totalScore = score * (1 + entry.priority / 10);
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestEntry = entry;
    }
  }

  if (bestEntry && bestScore >= 10) {
    return bestEntry.response;
  }
  return null;
}

// ============================================================
// Keyword matching engine
// ============================================================

/**
 * Normalize input: lowercase, remove punctuation, extract individual words
 */
function extractWords(input: string): string[] {
  const normalized = input.toLowerCase().replace(/[^\w\s]/g, " ");
  const words = normalized.split(/\s+/).filter((w) => w.length > 1);
  // Also include bigrams (two-word phrases) for better matching
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`);
  }
  return [...words, ...bigrams];
}

/**
 * Check if a multi-word keyword matches within the user's input string.
 * For multi-word keywords, ALL words must appear (in any order).
 * For single-word keywords, the word must appear as a whole word.
 * Also supports partial/substring matching for better coverage.
 */
function keywordMatches(keyword: string, inputLower: string, wordSet: Set<string>): boolean {
  const kws = keyword.toLowerCase().split(/\s+/).filter(Boolean);

  // Single word — check if it's in the word set
  if (kws.length === 1) {
    // Exact match
    if (wordSet.has(kws[0])) return true;
    // Partial/substring match for longer keywords (4+ chars)
    if (kws[0].length >= 4) {
      for (const w of wordSet) {
        if (w.includes(kws[0]) || kws[0].includes(w)) {
          if (w.length >= 3) return true;
        }
      }
    }
    return false;
  }

  // Multi-word — check if all words appear (with some flexibility)
  let matchCount = 0;
  for (const w of kws) {
    if (wordSet.has(w)) {
      matchCount++;
    } else {
      // Try partial match for this word
      for (const ws of wordSet) {
        if (ws.includes(w) || w.includes(ws)) {
          if (ws.length >= 3 || w.length >= 3) {
            matchCount++;
            break;
          }
        }
      }
    }
  }
  // Allow matching if at least 70% of words match (for multi-word keywords)
  return matchCount >= Math.ceil(kws.length * 0.7);
}

/**
 * Score a topic against the user input
 */
function scoreTopic(entry: TopicEntry, inputLower: string, wordSet: Set<string>): number {
  let matchedCount = 0;
  for (const kw of entry.keywords) {
    if (keywordMatches(kw, inputLower, wordSet)) {
      matchedCount++;
    }
  }
  if (matchedCount === 0) return 0;
  // Score = priority + (matched keyword count as a bonus)
  return entry.priority + matchedCount * 5;
}

function findResponse(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "Please type a message and I'll do my best to help!";

  const inputLower = trimmed.toLowerCase();
  const words = extractWords(trimmed);
  const wordSet = new Set(words);

  // Step 1: Score all topics with keyword matching
  let bestScore = 0;
  let bestEntry: TopicEntry | null = null;

  for (const entry of TOPICS) {
    const score = scoreTopic(entry, inputLower, wordSet);
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  if (bestEntry && bestScore > 0) {
    return bestEntry.response;
  }

  // Step 2: Try pattern-based matching
  for (const rule of PATTERN_RULES) {
    for (const pattern of rule.patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const response = rule.respond(trimmed, match);
        if (response) return response;
      }
    }
  }

  // Step 3: Try fuzzy topic matching as a last resort before fallback
  const fuzzyMatch = findExactOrFuzzyTopic(inputLower);
  if (fuzzyMatch) return fuzzyMatch;

  // Step 4: Smart fallback with topic suggestions
  return smartFallback(trimmed);
}

function smartFallback(input: string): string {
  const lower = input.toLowerCase().trim();

  if (lower.length < 3) {
    return `Hi there! 👋 I'm Quantum AI. Ask me anything — cooking, science, math, history, geography, coding, health, and more!`;
  }

  // Extract any meaningful words for context
  const stopWords = new Set([
    "what", "when", "where", "which", "about", "tell", "make", "help", "give",
    "show", "know", "does", "that", "this", "with", "have", "from", "your",
    "they", "them", "their", "there", "here", "also", "just", "only", "very",
    "some", "more", "than", "like", "into", "over", "such", "after", "before",
    "could", "would", "should", "might", "will", "shall", "need", "want",
    "can", "may", "you", "the", "and", "for", "are", "not", "but", "how",
    "its", "was", "are", "his", "her", "she", "him", "all", "any", "been",
    "who", "why", "how", "did", "get", "got", "let", "put", "say", "said",
    "one", "two", "our", "out", "now", "way", "use", "see", "come", "could",
    "would", "should", "may", "might", "must", "tell", "explain", "describe",
  ]);

  const words = lower
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  const topicHint = words.length > 0 ? ` (I picked up on: "${words.slice(0, 3).join(" ", )}")` : "";

  return `That's a great question!${topicHint}

While I don't have a specific answer in my offline knowledge base, I **can** help with many topics:

🍳 **Cooking** — "How to make cake/pasta/rice/bread/chicken"
🌍 **Geography** — "Tell me about Bangladesh/India/Japan/Brazil"
🔬 **Science** — "What is quantum computing/DNA/gravity/chemistry"
🔢 **Math** — "What is pi/percentages/Pythagorean theorem/trigonometry"
💻 **Coding** — "How to build a website/What is JavaScript/Python"
📜 **History** — "World War/Who invented the telephone/ancient civilizations"
🏥 **Health** — "Common cold/stress relief/nutrition tips/sleep"
🔒 **Safety** — "My wallet is lost/Phone is stolen/Emergency numbers"
💰 **Career** — "How to earn money/study tips/interview preparation"
🧘 **Wellness** — "How to sleep better/relax/stress relief"
⚽ **Sports** — "Football/Soccer/Cricket/NBA rules"
🎵 **Arts** — "Music genres/Movies/books/photography tips"
💪 **Fitness** — "Exercise routines/diet/weight loss"
🏠 **Home** — "DIY repairs/cleaning tips/gardening"
📈 **Economics** — "Inflation/GDP/stock market basics"
🔐 **Cybersecurity** — "Hacking/VPN/encryption/phishing"
⛓️ **Blockchain** — "Bitcoin/cryptocurrency/NFT"
🌍 **Universe** — "Big bang/dark matter/planets/stars"
🐾 **Animals** — "Endangered species/dinosaurs/pets"
📖 **Languages** — "Spanish/Chinese/Arabic phrases"

**Try rephrasing** your question or ask about one of these topics. I'm here to help! 😊`;
}

/**
 * Generate a response using the built-in offline knowledge engine.
 * Streams response word-by-word for a natural feel.
 */
export async function* streamOfflineChat(
  _systemPrompt: string,
  messages: Message[],
): AsyncGenerator<string, void, unknown> {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const input = lastUserMsg?.content ?? "";
  const response = findResponse(input);

  // Simulate streaming — yield progressively longer substrings
  const words = response.split(/(?<=\s)/);
  let accumulated = "";

  for (const word of words) {
    accumulated += word;
    yield accumulated;
    await new Promise((r) => setTimeout(r, 15));
  }
}

/**
 * Non-streaming offline chat
 */
export async function sendOfflineMessage(
  _systemPrompt: string,
  messages: Message[],
): Promise<string> {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const input = lastUserMsg?.content ?? "";
  return findResponse(input);
}
