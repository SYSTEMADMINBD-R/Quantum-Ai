/**
 * Offline AI Service — Zero-download local chat intelligence.
 * Uses keyword-based topic matching + extensive knowledge base for offline responses.
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
  /** Keywords — if ANY of these appear in the user's input (case-insensitive, word-boundary), this entry is triggered */
  keywords: string[];
  /** Priority — higher = preferred when multiple topics match */
  priority: number;
  /** The response */
  response: string;
}

const TOPICS: TopicEntry[] = [

  // ====== IDENTITY ======
  {
    keywords: ["who", "made", "created", "built", "developed", "ragib", "your name", "what are you", "who are you", "quantum ai"],
    priority: 20,
    response:
      "I am **Quantum AI**, made and developed by **RAGIB**. I work both online and offline!\n\nIn offline mode, I use a built-in knowledge engine to answer your questions. I can help with cooking, science, math, geography, coding, everyday life advice, and much more.\n\nFor the most advanced responses, switch to online mode where I'm powered by Gemini (General) or Groq (Hacking).",
  },

  // ====== LOST / STOLEN WALLET ======
  {
    keywords: ["wallet", "lost", "stolen", "missing", "theft", "pickpocket"],
    priority: 15,
    response:
      `🔒 **What to Do If Your Wallet Is Lost or Stolen**

**Immediate Steps (Do These NOW):**
1. **Cancel your debit/credit cards** — Call your bank immediately. Most banks have 24/7 hotlines. This prevents unauthorized transactions.
2. **File a police report** — Go to your nearest police station or call the non-emergency number. Get a copy of the report — you'll need it for insurance and bank claims.
3. **Block mobile payments** — If you had Apple Pay, Google Pay, or any mobile wallet, disable it from your phone or account settings.

**Next 24 Hours:**
4. **Check for unauthorized transactions** — Log into your bank app and review recent activity. Report any fraud immediately.
5. **Contact your ID-issuing offices** — If your driver's license, national ID, or passport was in the wallet, report them lost. You may need to visit the issuing office for a replacement.
6. **Change passwords** — If any cards or accounts were linked, change your PINs and passwords.
7. **Notify your insurance** — Some home/renters insurance covers stolen wallets. Check your policy.

**Protect Yourself Going Forward:**
• Monitor your bank statements daily for the next 30 days.
• Consider a credit freeze if you had your SSN/national ID in the wallet.
• Keep digital copies of important documents in a secure cloud service.
• Use a wallet tracker (like AirTag or Tile) in the future.

**Important Phone Numbers to Have:**
• Bank fraud hotline (save this in your phone)
• Local police non-emergency number
• Credit monitoring service (if you have one)

Don't panic — acting quickly minimizes the damage. Most banks have strong fraud protection and will refund unauthorized charges if reported promptly.`,
  },

  // ====== LOST PHONE ======
  {
    keywords: ["phone", "lost", "stolen", "missing", "find my phone", "track phone", "mobile"],
    priority: 15,
    response:
      `📱 **What to Do If Your Phone Is Lost or Stolen**

**Immediate Actions:**
1. **Try calling it** — Use another phone to call your number. If someone answers, they may return it.
2. **Track it:**
   - **iPhone:** Use Find My iPhone (icloud.com/find) or another Apple device
   - **Android:** Use Find My Device (google.com/android/find)
3. **Lock it remotely:**
   - iPhone: iCloud → Find My → Mark as Lost
   - Android: Google Find My Device → Secure Device
4. **Erase data remotely** if you can't recover it (last resort — you lose access to tracking).

**Important Steps:**
5. **Change passwords** — Especially email, banking, and social media. Start with your primary email (it's the key to everything).
6. **Contact your carrier** — Report it stolen and ask them to suspend your SIM card. This prevents someone from receiving your SMS codes.
7. **File a police report** — Especially if stolen. You'll need the IMEI number (check your carrier account or original phone box).
8. **Report IMEI blocked** — In many countries, you can get the phone's IMEI blacklisted so it can't be used on any network.

**Prevention for Next Time:**
• Enable Find My iPhone / Find My Device
• Use a strong passcode (not just a 4-digit PIN)
• Keep your IMEI number saved somewhere safe
• Enable two-factor authentication on important accounts
• Use a phone case with a wrist strap or lanyard`,
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
• **112** — India (also works)

**What to Do in an Emergency:**
1. Stay calm and assess the situation.
2. Call the appropriate emergency number.
3. Give your location clearly (address, landmarks, nearby intersections).
4. Describe what happened and how many people are affected.
5. Follow the dispatcher's instructions.
6. Don't hang up until told to do so.

**Common Emergencies:**
• **Medical emergency:** Call ambulance, perform CPR if trained, don't move the person unless they're in danger.
• **Fire:** Get out first, then call fire department. Don't go back inside.
• **Car accident:** Check for injuries, call emergency services, move to safety if possible.
• **Crime in progress:** Call police, stay safe, don't confront the attacker.
• **Natural disaster:** Follow official instructions, move to higher ground (floods), get under sturdy furniture (earthquake).

**Save these numbers in your phone right now — you never know when you'll need them.**`,
  },

  // ====== COUNTRIES & GEOGRAPHY ======
  {
    keywords: ["bangladesh", "bd", "bangla", "dhaka", "chittagong", "padma", "bangladeshi"],
    priority: 14,
    response:
      `🇧🇩 **Bangladesh — Overview**

**Official Name:** People's Republic of Bangladesh (গণপ্রজাতন্ত্রী বাংলাদেশ)

**Location:** South Asia, on the Bay of Bengal. Bordered by India on three sides and Myanmar to the southeast.

**Capital:** Dhaka (population ~22 million in metro area)

**Population:** ~175 million — 8th most populous country in the world.

**Geography:**
• Mostly flat and fertile delta land (Ganges-Brahmaputra-Meghna delta).
• The Sundarbans, the world's largest mangrove forest, is shared with India.
• Prone to monsoon flooding — roughly 80% of the land is floodplain.
• Cox's Bazar has the world's longest natural sandy beach (120 km).

**Language:** Bengali (Bangla)

**Economy:**
• One of the fastest-growing economies in Asia.
• Major garment/textile exporter — 2nd largest in the world.
• Growing IT and pharmaceutical sectors.
• Agriculture: rice, jute, tea, fish.

**Culture:**
• Rich tradition of music (Baul, Rabindra Sangeet), literature, and film.
• Cricket is the most popular sport.
• Known for warm hospitality, vibrant festivals (Pohela Boishakh), and delicious cuisine.

**Food:** Famous for fish curry (hilsa/illish), biryani, pitha (rice cakes), and chotpoti.

**History:**
• Won independence in 1971 through a liberation war.
• Has made remarkable progress in poverty reduction and development.`,
  },
  {
    keywords: ["india", "indian", "delhi", "mumbai", "bangalore", "hindu", "bollywood"],
    priority: 12,
    response:
      `🇮🇳 **India — Overview**

**Official Name:** Republic of India

**Capital:** New Delhi | **Population:** ~1.44 billion (most populous country)

**Geography:** Himalayan mountains in the north, fertile plains, Thar Desert, Deccan Plateau, 7,500 km coastline.

**Languages:** Hindi and English (official). 22 scheduled languages.

**Economy:** 5th largest GDP. IT, pharmaceuticals, agriculture, textiles, automotive.

**Culture:** One of the oldest civilizations. Diwali, Holi, Eid, Bollywood, yoga, diverse cuisine.

**Famous For:** Taj Mahal, cricket, IT industry, spice-rich food, diversity.`,
  },
  {
    keywords: ["america", "united states", "usa", "us", "american", "washington", "new york", "california", "texas", "florida"],
    priority: 12,
    response:
      `🇺🇸 **United States of America**

**Capital:** Washington, D.C. | **Population:** ~335 million | **50 states**

**Geography:** Rocky Mountains, Great Plains, Grand Canyon, Great Lakes, Appalachian Mountains, Hawaii, Alaska.

**Economy:** World's largest GDP (~$28 trillion). Technology, finance, healthcare, entertainment, agriculture.

**Key Cities:** New York, Los Angeles, Chicago, Houston, San Francisco, Seattle, Miami, Las Vegas.

**Culture:** Melting pot of cultures. Hollywood, jazz, rock, hip-hop. Strong tradition of innovation.

**Famous For:** Statue of Liberty, Hollywood, Silicon Valley, national parks, football, fast food.`,
  },
  {
    keywords: ["united kingdom", "uk", "england", "britain", "london", "scottish", "welsh", "british"],
    priority: 12,
    response:
      `🇬🇧 **United Kingdom**

**Countries:** England, Scotland, Wales, Northern Ireland | **Capital:** London | **Population:** ~67 million

**Economy:** 6th largest GDP. Finance, technology, pharmaceuticals, creative industries.

**Language:** English (originated here!)

**History:** One of the most influential nations. British Empire was the largest in history.

**Culture:** Shakespeare, Beatles, Rolling Stones, Premier League football, tea culture, fish and chips.`,
  },
  {
    keywords: ["japan", "japanese", "tokyo", "sakura", "anime", "manga", "sushi", "samurai", "ninja"],
    priority: 12,
    response:
      `🇯🇵 **Japan — Overview**

**Capital:** Tokyo | **Population:** ~125 million

**Geography:** Island nation (4 main islands). Mount Fuji (3,776m), hot springs, cherry blossoms.

**Economy:** 4th largest GDP. Automotive (Toyota, Honda), electronics, robotics, gaming.

**Culture:** Ancient traditions meet ultra-modern technology. Tea ceremony, kimono, sumo, anime, manga, video games.

**Food:** Sushi, ramen, tempura, udon, wagyu beef, matcha, Japanese curry.

**Famous For:** Mount Fuji, bullet trains (Shinkansen), cherry blossoms, anime/manga, technology, karate, origami.`,
  },
  {
    keywords: ["china", "chinese", "beijing", "shanghai", "great wall", "dragon"],
    priority: 12,
    response:
      `🇨🇳 **China — Overview**

**Capital:** Beijing | **Population:** ~1.41 billion | **Area:** 9.6 million km² (4th largest)

**Geography:** Himalayas, Yangtze River (3rd longest), Gobi Desert, extensive coastline.

**Economy:** 2nd largest GDP. Manufacturing hub, technology, e-commerce (Alibaba, Tencent), AI.

**Language:** Mandarin Chinese (most spoken language in the world by native speakers).

**History:** 5,000+ years of continuous civilization. Invented paper, gunpowder, compass, printing.

**Famous For:** Great Wall, Terracotta Army, pandas, Kung Fu, Chinese New Year, tea culture.`,
  },
  {
    keywords: ["australia", "australian", "sydney", "melbourne", "kangaroo", "koala", "outback"],
    priority: 12,
    response:
      `🇦🇺 **Australia — Overview**

**Capital:** Canberra | **Population:** ~26 million

**Geography:** Island continent. Great Barrier Reef, Outback desert, tropical rainforests, unique wildlife.

**Economy:** Mining, agriculture, tourism, education, technology.

**Wildlife:** Kangaroos, koalas, wombats, platypus — many species found nowhere else.

**Famous For:** Sydney Opera House, Great Barrier Reef, kangaroos, Vegemite, surfing, cricket.`,
  },
  {
    keywords: ["germany", "german", "berlin", "munich", "oktoberfest", "bmw", "mercedes"],
    priority: 12,
    response:
      `🇩🇪 **Germany — Overview**

**Capital:** Berlin | **Population:** ~84 million

**Economy:** Largest in Europe. Engineering (BMW, Mercedes, Volkswagen), chemicals, machinery, renewable energy.

**Culture:** Beer, sausages, Oktoberfest, classical music (Beethoven, Bach), efficiency, punctuality.

**Famous For:** Brandenburg Gate, Oktoberfest, autobahn, BMW/Mercedes/Audi, Christmas markets, pretzels.`,
  },
  {
    keywords: ["france", "french", "paris", "eiffel", "louvre", "wine", "croissant"],
    priority: 12,
    response:
      `🇫🇷 **France — Overview**

**Capital:** Paris | **Population:** ~68 million

**Economy:** Tourism (most visited country), luxury goods, aerospace, agriculture, wine.

**Culture:** Art, fashion, philosophy. Home to the Louvre, Eiffel Tower, and world-class cuisine.

**Famous For:** Eiffel Tower, Louvre Museum, wine, cheese, croissants, French Revolution, haute couture.`,
  },
  {
    keywords: ["russia", "russian", "moscow", "kremlin", "siberia"],
    priority: 12,
    response:
      `🇷🇺 **Russia — Overview**

**Capital:** Moscow | **Population:** ~144 million | **Area:** 17.1 million km² (largest country)

**Geography:** Spans 11 time zones. Siberia, Ural Mountains, Lake Baikal (deepest lake), Volga River.

**Economy:** Oil, gas, minerals, nuclear energy, space program.

**Famous For:** Kremlin, Red Square, Trans-Siberian Railway, ballet, Tchaikovsky, space exploration (first satellite, first human in space).`,
  },
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
• Sri Lanka → Sri Jayawardenepura Kotte

Ask me about any specific country for more details!`,
  },
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

**Fastest Land Animal:** Cheetah — 112 km/h`,
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

**Scrambled:** Whisk 2-3 eggs with salt/pepper. Cook in butter over medium-low, stirring gently. Remove while slightly wet — residual heat finishes them.

**Fried (Sunny Side Up):** Heat butter in pan, crack egg in, cook 2-3 minutes. Don't flip.

**Boiled:** Place eggs in cold water, bring to boil, cover, remove from heat. Soft: 6-7 min. Hard: 10-12 min. Cool in ice water.

**Poached:** Simmer water + vinegar, create whirlpool, slide egg in, cook 3-4 minutes.`,
  },
  {
    keywords: ["pasta", "spaghetti", "noodles", "mac and cheese", "macaroni", "carbonara"],
    priority: 10,
    response:
      `🍝 **How to Make Pasta with Tomato Sauce**

**Pasta:** Boil salted water, cook pasta 8-12 min. Reserve 1 cup pasta water before draining.

**Simple Sauce:** Heat olive oil, sauté garlic 1 min, add 1 can crushed tomatoes, salt, pepper, 1 tsp sugar, red pepper flakes. Simmer 15-20 min. Add fresh basil.

Toss pasta with sauce + splash of pasta water. The starch helps sauce cling to pasta.

**Pro tip:** Undercook pasta by 1 min and finish in the sauce for best texture.`,
  },
  {
    keywords: ["rice", "biryani", "fried rice", "pulao", "pilaf"],
    priority: 10,
    response:
      `🍚 **How to Make Rice**

**Basic Rice:** Rinse 1 cup rice until water runs clear. Combine with 1.5 cups water + pinch of salt. Bring to boil, lowest heat, cover, 15-18 min. Rest 5 min, fluff with fork.

**Fried Rice:** Use day-old rice. Heat oil in wok on high. Sauté veggies (2-3 min). Push aside, scramble egg. Add rice + 2 tbsp soy sauce, toss 3-4 min until slightly crispy. Garnish with green onions.`,
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
3. Rise 1-1.5 hours (doubled in size).
4. Shape into loaf, rise another 30-45 min.
5. Bake at 375°F (190°C) for 30-35 min until golden.`,
  },
  {
    keywords: ["pizza", "pizza dough", "pizza sauce"],
    priority: 10,
    response:
      `🍕 **Homemade Pizza**

**Dough:** Yeast + warm water + sugar → wait 5 min. Add flour + salt + olive oil. Knead 8 min. Rise 1 hour.

**Sauce:** Crushed tomatoes + garlic + oregano + salt + olive oil.

**Bake:** Preheat oven to 475°F (245°C). Stretch dough by hand. Add sauce + mozzarella + toppings. Bake 10-12 min.

**Tips:** Don't overload toppings. Less cheese = crispier. Preheat your baking surface.`,
  },
  {
    keywords: ["chicken", "steak", "beef", "meat", "fish", "salmon", "grill", "cook meat"],
    priority: 10,
    response:
      `🍗 **How to Cook Chicken Breast**

**Pan-Seared:** Pound to even ½ inch. Season generously. Heat oil on medium-high. Cook 5-6 min per side. Rest 5 min before slicing.

**Baked:** Season with olive oil + paprika + garlic powder. Bake at 425°F (220°C) for 20-25 min.

**Key:** Internal temp must reach 165°F (74°C). Brine in salt water 30 min beforehand for extra juicy chicken. Always let meat rest after cooking.`,
  },
  {
    keywords: ["salad", "smoothie", "juice", "soup", "drink", "beverage"],
    priority: 8,
    response:
      `🥗 **Simple Garden Salad**

Mixed greens, cherry tomatoes, cucumber, red onion, bell pepper. Optional: feta, croutons, nuts.

**Vinaigrette:** 3 tbsp olive oil + 1 tbsp balsamic vinegar + 1 tsp Dijon mustard + salt & pepper. Whisk together. Toss just before serving.`,
  },

  // ====== SCIENCE ======
  {
    keywords: ["solar system", "sun", "moon", "mars", "jupiter", "saturn", "earth", "planet", "universe", "galaxy", "black hole", "star", "asteroid", "comet", "neptune", "venus", "mercury", "uranus", "pluto", "space"],
    priority: 11,
    response:
      `🌌 **The Solar System**

**The Sun:** A G-type star, 4.6 billion years old, surface temp ~5,500°C.

**Inner Planets:** Mercury (smallest, extreme temps), Venus (hottest at 465°C, rotates backwards), Earth (liquid water, life), Mars (red planet, Olympus Mons volcano 21.9 km tall).

**Outer Planets:** Jupiter (largest, Great Red Spot), Saturn (rings of ice/rock), Uranus (rotates on its side, blue-green), Neptune (windiest, 2,100 km/h winds).

**Other Objects:** Dwarf planets (Pluto, Ceres), asteroids, comets, Kuiper Belt, Oort Cloud.

**Speed of Light:** 299,792 km/s. Sun to Earth = 8 min 20 sec. Nearest star = 4.24 light-years.`,
  },
  {
    keywords: ["quantum", "superposition", "entanglement", "qubit", "quantum computer"],
    priority: 11,
    response:
      `⚛️ **Quantum Computing**

Uses qubits that can be 0, 1, or both simultaneously (superposition). Enables massive parallelism.

**Key Concepts:**
• **Superposition:** Qubit exists in multiple states at once.
• **Entanglement:** Two particles connected — measuring one affects the other instantly.
• **Quantum tunneling:** Particles pass through barriers they classically shouldn't.

**Applications:** Cryptography, drug discovery, optimization, AI. Companies: IBM, Google, Microsoft, IonQ.

**Challenge:** Maintaining qubit stability (decoherence) requires near-absolute-zero temperatures.`,
  },
  {
    keywords: ["artificial intelligence", "machine learning", "neural network", "deep learning", " ai ", "chatgpt", "llm", "language model"],
    priority: 11,
    response:
      `🤖 **Artificial Intelligence & Machine Learning**

**AI:** Simulation of human intelligence by machines.

**Machine Learning:** Algorithms that learn from data without explicit programming.

**Deep Learning:** ML using neural networks with many layers (inspired by the brain).

**Types of ML:**
1. Supervised — trained on labeled data (spam detection, image classification)
2. Unsupervised — finds patterns in unlabeled data (clustering)
3. Reinforcement — learns through trial and error with rewards (game playing)

**How Neural Networks Work:** Layers of mathematical functions process data. Input → Hidden layers → Output. During training, weights adjust to minimize errors.

**Milestones:** GPT/BERT (language), AlphaGo (games), Stable Diffusion (images), GPT-4/Gemini (multimodal).`,
  },
  {
    keywords: ["dna", "gene", "genetic", "evolution", "chromosome", "natural selection", "darwin", "mutation"],
    priority: 10,
    response:
      `🧬 **DNA & Evolution**

**DNA:** Deoxyribonucleic Acid — carries genetic instructions. Double helix shape. ~3 billion base pairs in humans.

**Bases:** A pairs with T, G pairs with C. Genes are DNA segments that code for proteins.

**Fun Facts:** You share 99.9% DNA with all humans. 96% with chimps. 60% with bananas.

**Evolution (Darwin):** Organisms with traits suited to their environment survive and reproduce. Over millions of years, small changes create new species. Evidence: fossils, DNA, anatomy.`,
  },
  {
    keywords: ["gravity", "energy", "electricity", "magnet", "atom", "molecule", "electron", "proton", "photon", "light", "sound", "wave", "friction", "inertia", "physics", "chemistry"],
    priority: 10,
    response:
      `🔬 **Physics Basics**

**Gravity:** Force between objects with mass. Einstein described it as spacetime curvature.

**Energy:** Ability to do work. Cannot be created/destroyed, only transformed. Types: kinetic, potential, thermal, chemical, nuclear, electrical, light.

**Atom:** Nucleus (protons + neutrons) + electrons. If an atom were a stadium, the nucleus = a marble.

**Light:** Electromagnetic radiation at 299,792 km/s. Both wave and particle (photon).

**Sound:** Vibration traveling as pressure waves. Can't travel in vacuum. Speed in air: ~343 m/s.`,
  },
  {
    keywords: ["photosynthesis", "ecosystem", "food chain", "biodiversity", "cell", "mitochondria", "chlorophyll", "biology", "organ", "body"],
    priority: 10,
    response:
      `🌿 **Biology Basics**

**Photosynthesis:** 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂. Plants convert light to food. Produces oxygen we breathe.

**Cellular Respiration:** Reverse of photosynthesis. Breaks down glucose for energy (ATP).

**Human Body Highlights:**
• Brain: 86 billion neurons, uses 20% of body energy
• Heart: 100,000 beats/day, pumps 7,500 liters of blood
• Lungs: 300 million alveoli, ~20,000 breaths/day
• Stomach: Produces acid strong enough to dissolve metal`,
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

Pi Day: March 14th (3/14)!`,
  },
  {
    keywords: ["pythagorean", "hypotenuse", "right triangle", "a squared", "a²"],
    priority: 10,
    response:
      `📐 **Pythagorean Theorem: a² + b² = c²**

In a right triangle, the square of the hypotenuse (longest side) equals the sum of squares of the other two sides.

**Example:** a=3, b=4 → c² = 9+16 = 25 → c = 5

**Common Triples:** 3-4-5, 5-12-13, 8-15-17, 7-24-25

**Used in:** Distance calculations, construction, navigation, physics.`,
  },
  {
    keywords: ["percent", "percentage", "%", "ratio", "fraction", "decimal"],
    priority: 9,
    response:
      `📊 **Percentages**

**Formula:** Part ÷ Whole × 100 = Percentage

**Find X% of a number:** Number × (X/100). Example: 15% of 200 = 30.

**Quick mental math:** 10% = ÷10, 1% = ÷100, 25% = ÷4, 50% = ÷2

**Increase/decrease:** New = Original × (1 ± percentage). Example: 200 increased by 15% = 230.`,
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

Ask me a specific math question and I'll walk you through it!`,
  },

  // ====== PROGRAMMING ======
  {
    keywords: ["javascript", "typescript", "python", "java ", "html", "css", "react", "node", "coding", "programming", "code", "algorithm", "function", "variable", "loop", "array", "api", "database", "sql", "git", "docker", "linux", "programming language", "software", "developer", "debug"],
    priority: 10,
    response:
      `💻 **Programming & Coding**

I can help with: JavaScript, TypeScript, Python, Java, HTML, CSS, React, algorithms, data structures, APIs, databases, and more.

**Core Concepts:**
• Variables, data types, operators
• Control flow (if/else, loops)
• Functions, OOP (classes, inheritance)
• Data structures (arrays, objects, trees, graphs)
• APIs (REST, GraphQL), Databases (SQL, NoSQL)

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

**Deploy for free:** GitHub Pages, Netlify, Vercel.`,
  },
  {
    keywords: ["git", "github", "docker", "linux", "terminal", "command line", "ssh", "json", "rest api"],
    priority: 9,
    response:
      `🔧 **Tech Concepts:**

**Git:** Version control. Tracks code changes. Commands: clone, add, commit, push, pull, branch.

**GitHub:** Web platform for Git repos. Collaboration, code review, CI/CD.

**Docker:** Containers — lightweight, isolated environments. "Works on my machine" solved.

**Linux:** Open-source OS. Ubuntu, Fedora, Arch. Commands: ls, cd, mkdir, chmod, grep, ssh.

**JSON:** \`{"key": "value"}\` — lightweight data format for APIs.

**REST API:** HTTP methods: GET (read), POST (create), PUT (update), DELETE (remove).`,
  },

  // ====== HISTORY ======
  {
    keywords: ["world war", "ww1", "ww2", "history", "war", "battle", "independence", "revolution", "ancient", "medieval", "renaissance"],
    priority: 9,
    response:
      `📜 **Major Historical Events**

**World War I (1914-1918):** Assassination of Archduke Franz Ferdinand triggered it. Allied vs Central Powers. ~20 million deaths.

**World War II (1939-1945):** Germany invaded Poland. Holocaust killed 6 million Jews. Atomic bombs on Hiroshima/Nagasaki. ~70-85 million deaths.

**Other Milestones:**
• Fall of Rome (476 AD)
• Renaissance (14th-17th century)
• Industrial Revolution (1760-1840)
• Moon Landing (1969)
• Fall of Berlin Wall (1989)`,
  },
  {
    keywords: ["invent", "discover", "invention", "discovery", "who invented", "who discovered"],
    priority: 9,
    response:
      `💡 **Famous Inventions & Discoveries**

• Electricity (Edison, Tesla), Light bulb (Edison, 1879)
• Telephone (Alexander Graham Bell, 1876)
• Internet/WWW (ARPANET 1969, Tim Berners-Lee 1989)
• Printing Press (Gutenberg, ~1440)
• Airplane (Wright Brothers, 1903)
• Penicillin (Alexander Fleming, 1928)
• Vaccines (Edward Jenner, 1796)
• Theory of Relativity (Einstein, 1905/1915)
• Evolution (Darwin, 1859)
• X-Rays (Röntgen, 1895)`,
  },

  // ====== HEALTH & BODY ======
  {
    keywords: ["heart", "brain", "lungs", "stomach", "immune system", "eyes", "muscle", "bone", "human body", "anatomy", "organ", "blood"],
    priority: 10,
    response:
      `🫀 **Human Body**

**Brain:** 86 billion neurons. Uses 20% of energy. Controls everything.

**Heart:** 100,000 beats/day. 4 chambers. Blood: body → right side → lungs → left side → body.

**Lungs:** 300 million alveoli (70 m² surface). ~20,000 breaths/day.

**Stomach:** pH 1.5-3.5 acid. Food stays 2-5 hours. Mucus prevents self-digestion.

**Immune System:** White blood cells attack pathogens. Antibodies mark invaders. Memory cells remember past infections (basis of vaccines).`,
  },
  {
    keywords: ["vitamin", "protein", "carb", "calorie", "nutrition", "diet", "healthy", "food", "eat", "meal", "breakfast", "lunch", "dinner", "fat", "fiber", "mineral"],
    priority: 9,
    response:
      `🥗 **Nutrition Basics**

**Macronutrients:**
• Carbs (4 cal/g) — energy. Complex carbs > simple sugars.
• Protein (4 cal/g) — build/repair. Need ~0.8-1g per kg body weight.
• Fat (9 cal/g) — hormones, absorption. Choose unsaturated (olive oil, nuts).

**Key Vitamins:**
• C — immunity (citrus, peppers)
• D — bones (sunlight, fish)
• Iron — blood oxygen (meat, spinach)
• Calcium — bones (dairy, greens)

**Tips:** Eat colorful veggies. Drink ~2L water daily. Limit processed food & sugar.`,
  },
  {
    keywords: ["sleep", "insomnia", "tired", "fatigue", "energy", "rest", "nap"],
    priority: 9,
    response:
      `😴 **Sleep Guide**

**Recommended:** Adults need 7-9 hours. Teens: 8-10. Kids: 9-12.

**Good Sleep Tips:**
• Same bedtime/wake time daily (even weekends)
• No screens 1 hour before bed (blue light disrupts melatonin)
• Cool, dark, quiet room (65-68°F / 18-20°C)
• No caffeine after 2 PM
• Exercise daily (but not right before bed)
• Avoid heavy meals close to bedtime

**Effects of Poor Sleep:** Weakened immunity, weight gain, poor focus, mood changes, higher disease risk.

**Quick Energy Boost (No Nap):** Splash cold water on face, 5-min walk, stretch, drink water, eat a small snack with protein.`,
  },
  {
    keywords: ["stress", "anxiety", "depression", "mental health", "relax", "calm", "meditation", "mindfulness", "panic"],
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
• Practice gratitude — write 3 things you're grateful for daily

**If you're struggling:** Reach out to a mental health professional. There's no shame in asking for help. Many countries have free crisis hotlines.`,
  },

  // ====== WEATHER & CLIMATE ======
  {
    keywords: ["rain", "snow", "wind", "thunder", "lightning", "tornado", "hurricane", "earthquake", "volcano", "tsunami", "flood", "weather", "climate", "storm", "drought"],
    priority: 9,
    response:
      `🌦️ **Weather & Natural Phenomena**

**Rain:** Water evaporates → forms clouds → droplets combine → fall when heavy enough.

**Lightning:** Electrical discharge. Heats air to 30,000°C. Thunder = shockwave from rapid expansion.

**Earthquake:** Tectonic plates shift suddenly. Measured on Richter scale. Most occur at plate boundaries.

**Climate Change:** Earth warming due to greenhouse gases (CO₂, methane). Causes: fossil fuels, deforestation. Effects: rising seas, extreme weather.

**Volcano:** Magma from Earth's interior erupts. Can cause climate cooling (ash blocks sunlight).`,
  },

  // ====== PRACTICAL / EVERYDAY LIFE ======
  {
    keywords: ["study", "learn", "memorize", "concentrate", "focus", "productive", "time management", "exam", "test", "homework", "education", "school", "university", "college"],
    priority: 10,
    response:
      `📚 **Study & Learning Tips**

**Pomodoro Technique:** Study 25 min → Break 5 min → Repeat 4x → Long break 15-30 min.

**Active Recall:** Close the book and try to recall what you learned. Stronger than re-reading.

**Spaced Repetition:** Review at increasing intervals (1 day → 3 days → 7 days → 14 days).

**Feynman Technique:** Explain the concept in simple terms. Identify gaps. Fill them.

**Other Tips:**
• Sleep 7-9 hours — memories consolidate during sleep
• Exercise improves brain function
• Teach someone else — best way to solidify knowledge
• Minimize distractions (notifications off!)
• Take notes by hand — better retention than typing`,
  },
  {
    keywords: ["money", "earn", "income", "job", "career", "business", "freelance", "salary", "invest", "save", "budget", "finance"],
    priority: 10,
    response:
      `💰 **Money & Career Tips**

**Ways to Earn Online:**
• Freelancing (web dev, design, writing) — Fiverr, Upwork
• Content creation (YouTube, blogging, podcasting)
• E-commerce (Shopify, Etsy, Amazon)
• Online courses (Udemy, Teachable)
• Remote jobs — check LinkedIn, Indeed, We Work Remotely

**High-Demand Skills:**
• Web/app development ($50-150/hr)
• Data science ($60-130/hr)
• Cybersecurity ($80-150/hr)
• Digital marketing ($40-100/hr)

**Financial Basics:**
• Pay yourself first — save at least 10% of income
• Build emergency fund (3-6 months expenses)
• Avoid high-interest debt (credit cards)
• Start investing early — compound interest is powerful`,
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
• Save pasta water — starch helps sauces stick`,
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
6. If wallet/purse: cancel cards immediately, file police report

**Navigation Tips:**
• Use Google Maps / Apple Maps for directions
• Download offline maps before traveling (Google Maps: tap profile → Offline Maps)
• Save your home and work addresses
• In new cities, use landmarks to orient yourself`,
  },
  {
    keywords: ["travel", "trip", "vacation", "flight", "airport", "hotel", "packing", "passport", "visa", "tourism", "tourist"],
    priority: 9,
    response:
      `✈️ **Travel Tips**

**Before You Go:**
• Check passport validity (6+ months for many countries)
• Research visa requirements
• Get travel insurance (especially for international trips)
• Notify your bank of travel dates
• Download offline maps and translation apps
• Make copies of important documents

**Packing Essentials:**
• Passport + copies, travel documents
• Medications + prescriptions
• Phone charger + adapter (check plug type for destination)
• Comfortable walking shoes
• Weather-appropriate clothing
• Basic first-aid kit

**At the Airport:**
• Arrive 2-3 hours before international flights
• Keep essentials in carry-on (medications, valuables, change of clothes)
• Liquids in 100ml containers in a clear bag (TSA rule)`,
  },
  {
    keywords: ["cold", "flu", "fever", "cough", "headache", "pain", "medicine", "sick", "ill", "health", "doctor", "treatment", "allergy", "infection"],
    priority: 10,
    response:
      `🏥 **Common Health Issues & First Aid**

**Cold/Flu:**
• Rest, drink plenty of fluids (water, warm tea, broth)
• Over-the-counter: acetaminophen/ibuprofen for pain/fever
• Honey for cough (not for children under 1)
• Usually resolves in 7-10 days

**Headache:**
• Drink water (dehydration is a common cause)
• Rest in a dark, quiet room
• Cold compress on forehead
• OTC pain relievers (ibuprofen, acetaminophen)

**Fever:**
• Stay hydrated
• Light clothing, don't bundle up
• Acetaminophen or ibuprofen to reduce fever
• See a doctor if fever exceeds 103°F (39.4°C) or lasts 3+ days

**Allergies:**
• Antihistamines (cetirizine, loratadine)
• Avoid known allergens
• Saline nasal rinse for nasal symptoms

**When to See a Doctor:** Symptoms worsen, persist beyond 10 days, or include difficulty breathing, severe pain, or high fever.`,
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
• It's OK to take a break if emotions are running high

**Conflict Resolution:**
1. Cool down first (at least 20 minutes)
2. Listen to the other person's perspective
3. Acknowledge their feelings
4. Focus on the problem, not the person
5. Find a compromise or solution together

**Building Strong Relationships:**
• Show appreciation regularly (even small things)
• Respect boundaries
• Be honest and trustworthy
• Spend quality time together
• Support each other's goals`,
  },
  {
    keywords: ["clean", "hygiene", "wash", "shower", "bathroom", "organize", "tidy", "declutter"],
    priority: 7,
    response:
      `🧹 **Cleaning & Hygiene Tips**

**Hand Washing (Most Important!):**
• Wet hands, apply soap, scrub for 20 seconds (sing "Happy Birthday" twice)
• Don't forget between fingers, under nails, backs of hands
• Dry thoroughly

**Daily Hygiene:**
• Brush teeth 2x/day (2 minutes each)
• Shower daily or every other day
• Use deodorant
• Clean ears gently (don't use cotton swabs inside)

**Quick Home Cleaning:**
• Daily: Make bed, wipe kitchen counters, do dishes
• Weekly: Vacuum, bathroom clean, laundry, dust surfaces
• Monthly: Deep clean fridge, wash curtains, organize closet`,
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
4. Check storage — keep at least 10-15% free
5. Update OS and apps
6. Check for malware/viruses

**Battery Tips:**
• Avoid charging to 100% constantly (20-80% is ideal)
• Don't let it die completely regularly
• Avoid extreme heat/cold
• Reduce screen brightness
• Turn off unused features (Bluetooth, GPS, WiFi when not needed)

**WiFi Issues:**
• Restart router (unplug 30 seconds, plug back in)
• Move closer to router
• Check if other devices have same issue
• Change WiFi channel to avoid interference
• Forget network and reconnect

**Password Security:**
• Use 12+ characters with mix of letters, numbers, symbols
• Never reuse passwords across sites
• Use a password manager
• Enable two-factor authentication (2FA)`,
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
• 🌍 **Geography** — Countries, capitals, world facts
• 🔬 **Science** — Physics, biology, chemistry, astronomy, quantum computing
• 🔢 **Math** — Arithmetic, algebra, geometry, percentages
• 💻 **Programming** — HTML, CSS, JavaScript, Python, coding concepts
• 📜 **History** — Major events, inventions, discoveries
• 🏥 **Health** — Common illnesses, first aid, nutrition, sleep
• 🧘 **Mental Health** — Stress management, study tips, focus
• 💰 **Practical** — Career advice, money tips, travel packing
• 📱 **Tech** — Troubleshooting, phone/computer help
• 🔒 **Safety** — Lost wallet/phone procedures, emergency numbers
• ❤️ **Relationships** — Communication tips, conflict resolution

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
];

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
 */
function keywordMatches(keyword: string, inputLower: string, wordSet: Set<string>): boolean {
  const kws = keyword.toLowerCase().split(/\s+/).filter(Boolean);

  // Single word — check if it's in the word set
  if (kws.length === 1) {
    return wordSet.has(kws[0]);
  }

  // Multi-word — all words must be present in the input
  return kws.every((w) => wordSet.has(w));
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

  // Score all topics
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

  // No match — smart fallback with topic suggestions
  return smartFallback(trimmed);
}

function smartFallback(input: string): string {
  const lower = input.toLowerCase().trim();

  if (lower.length < 3) {
    return `Hi there! 👋 I'm Quantum AI. Ask me anything — cooking, science, math, history, geography, coding, health, and more!`;
  }

  // Extract any meaningful words for context
  const words = lower
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["what", "when", "where", "which", "about", "tell", "make", "help", "give", "show", "know", "does", "that", "this", "with", "have", "from", "your", "they", "them", "their", "there", "here", "also", "just", "only", "very", "some", "more", "than", "like", "into", "over", "such", "after", "before", "could", "would", "should", "might", "will", "shall", "need", "want"].includes(w));

  const topicHint = words.length > 0 ? ` (I picked up on: "${words.slice(0, 3).join(" ", )}")` : "";

  return `That's a great question!${topicHint}

While I don't have a specific answer for this in my offline knowledge base, I **can** help with many topics:

🍳 **Cooking** — "How to make cake/pasta/rice/bread/chicken"
🌍 **Geography** — "Tell me about Bangladesh/India/Japan"
🔬 **Science** — "What is quantum computing/DNA/gravity"
🔢 **Math** — "What is pi/percentages/Pythagorean theorem"
💻 **Coding** — "How to build a website/What is JavaScript"
📜 **History** — "World War/Who invented the telephone"
🏥 **Health** — "Common cold/stress relief/nutrition tips"
🔒 **Safety** — "My wallet is lost/Phone is stolen/Emergency"
💰 **Career** — "How to earn money/study tips"
🧘 **Wellness** — "How to sleep better/relax/stress relief"

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
