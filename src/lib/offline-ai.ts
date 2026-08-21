/**
 * Offline AI Service — Zero-download local chat intelligence.
 * Uses pattern matching + extensive knowledge base for offline responses.
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
// Knowledge Base — extensive entries organized by category
// ============================================================

interface KnowledgeEntry {
  patterns: RegExp[];
  response: string;
}

const KNOWLEDGE: KnowledgeEntry[] = [
  // ---- Identity ----
  {
    patterns: [/who (made|created|built|developed) (you|this|quantum)/i, /who are you/i, /what are you/i],
    response:
      "I am Quantum AI, made and developed by RAGIB. I work both online and offline!\n\nIn offline mode, I use a built-in knowledge engine to answer your questions. I can help with general knowledge, cooking, science, math, geography, coding, and much more.\n\nFor the most advanced responses, switch to online mode where I'm powered by Gemini (General) or Groq (Hacking).",
  },
  {
    patterns: [/what is your name/i, /what are you called/i],
    response:
      "My name is Quantum AI. I'm an AI assistant created by RAGIB that works online and offline.",
  },

  // ---- Greetings ----
  {
    patterns: [/^(hello|hi|hey|greetings|good morning|good afternoon|good evening|yo|sup|howdy|howdy)\b/i],
    response:
      "Hello! 👋 I'm Quantum AI. How can I help you today?\n\nYou can ask me about anything — science, cooking, history, math, geography, coding, and more. I'm here to help!",
  },
  {
    patterns: [/how are you|how do you do/i],
    response:
      "I'm doing great, thanks for asking! I'm Quantum AI, running locally on your device right now. How can I help?",
  },

  // ---- Cooking & Recipes ----
  {
    patterns: [/how (to )?(make|cook|bake|prepare) (a )?cake/i, /cake recipe/i, /birthday cake/i],
    response: `🍰 **How to Make a Basic Vanilla Cake**

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
2. Whisk flour, baking powder, and salt together in a bowl.
3. In a large bowl, cream butter and sugar until light and fluffy (about 3-4 minutes).
4. Add eggs one at a time, beating well after each. Mix in vanilla.
5. Add flour mixture alternating with milk, starting and ending with flour. Mix until just combined.
6. Divide batter evenly between pans.
7. Bake for 25-30 minutes or until a toothpick comes out clean.
8. Cool in pans for 10 minutes, then turn out onto wire racks.

**Tips:**
• Don't overmix the batter — it makes the cake tough.
• Use room temperature ingredients for a smoother batter.
• For chocolate cake, replace ¼ cup flour with cocoa powder.`,
  },
  {
    patterns: [/how (to )?(make|cook|boil|fry|scramble) (an? )?egg/i, /egg (recipe|cooking|preparation)/i],
    response: `🥚 **How to Cook Eggs — Multiple Methods**

**Scrambled Eggs (Creamy & Fluffy):**
1. Crack 2-3 eggs into a bowl, add a pinch of salt and pepper.
2. Whisk vigorously for 30 seconds.
3. Heat butter in a non-stick pan over medium-low heat.
4. Pour eggs in and gently stir with a spatula.
5. Remove from heat while still slightly wet — residual heat finishes cooking.
6. Serve immediately.

**Fried Eggs:**
1. Heat oil or butter in a pan over medium heat.
2. Crack egg gently into the pan.
3. Cook 2-3 minutes for sunny side up (runny yolk).
4. For over-easy, flip carefully and cook 30 more seconds.

**Boiled Eggs:**
• Soft-boiled: Place eggs in cold water, bring to boil, cover, remove from heat, let sit 6-7 minutes.
• Hard-boiled: Same method, but let sit 10-12 minutes.
• Cool in ice water for easy peeling.

**Poached Eggs:**
1. Bring water to a gentle simmer (not boiling).
2. Add a splash of vinegar.
3. Create a gentle whirlpool and slide the egg in.
4. Cook 3-4 minutes for a runny yolk.`,
  },
  {
    patterns: [/how (to )?make (pasta|spaghetti|noodles|mac and cheese|macaroni)/i, /pasta recipe/i],
    response: `🍝 **How to Make Classic Pasta with Tomato Sauce**

**For the Pasta:**
1. Bring a large pot of salted water to a rolling boil.
2. Add pasta and cook according to package directions (usually 8-12 minutes).
3. Reserve 1 cup pasta water before draining.
4. Drain and toss with sauce.

**Simple Tomato Sauce:**
• 2 tbsp olive oil
• 3-4 cloves garlic, minced
• 1 can (28 oz) crushed tomatoes
• 1 tsp salt, ½ tsp pepper
• 1 tsp sugar (to balance acidity)
• Fresh basil leaves
• Pinch of red pepper flakes (optional)

1. Heat oil in a pan, sauté garlic for 1 minute until fragrant.
2. Add tomatoes, salt, pepper, sugar, and red pepper flakes.
3. Simmer for 15-20 minutes, stirring occasionally.
4. Tear in fresh basil at the end.
5. Toss with cooked pasta and a splash of pasta water.

**Pro tips:**
• Always salt your pasta water generously — it should taste like the sea.
• Undercook pasta by 1 minute if finishing it in the sauce.
• Save pasta water — the starch helps the sauce cling to the pasta.`,
  },
  {
    patterns: [/how (to )?make (rice|biryani|fried rice|pulao)/i, /rice recipe/i],
    response: `🍚 **How to Make Perfect Rice**

**Basic Stovetop Rice:**
1. Rinse 1 cup rice under cold water until water runs clear.
2. Combine with 1.5 cups water and a pinch of salt in a pot.
3. Bring to a boil, then reduce to lowest heat.
4. Cover and cook for 15-18 minutes.
5. Remove from heat, keep covered for 5 minutes.
6. Fluff with a fork.

**Easy Fried Rice:**
1. Use day-old cooked rice (fresh rice gets mushy).
2. Heat oil in a wok or large pan over high heat.
3. Sauté diced vegetables (carrots, peas, corn, onion) for 2-3 minutes.
4. Push to the side, scramble an egg in the empty space.
5. Add rice and 2 tbsp soy sauce, toss everything together.
6. Cook on high heat for 3-4 minutes until slightly crispy.
7. Garnish with green onions.`,
  },
  {
    patterns: [/how (to )?make (bread|roti|naan|paratha|tortilla)/i, /bread recipe/i, /homemade bread/i],
    response: `🍞 **How to Make Simple Homemade Bread**

**Basic White Bread:**
• 3 cups (375g) all-purpose flour
• 1 packet (2¼ tsp) active dry yeast
• 1 tbsp sugar
• 1 tsp salt
• 1 cup (240ml) warm water (110°F/43°C)
• 2 tbsp olive oil or melted butter

**Instructions:**
1. Dissolve sugar in warm water, sprinkle yeast on top. Let sit 5-10 minutes until foamy.
2. In a large bowl, combine flour and salt.
3. Add yeast mixture and oil. Mix until a shaggy dough forms.
4. Knead on a floured surface for 8-10 minutes until smooth and elastic.
5. Place in an oiled bowl, cover with a damp cloth, let rise 1-1.5 hours (until doubled).
6. Punch down dough, shape into a loaf, place in a greased 9x5 loaf pan.
7. Let rise another 30-45 minutes.
8. Bake at 375°F (190°C) for 30-35 minutes until golden and hollow-sounding when tapped.

**Quick Tips:**
• Water should feel warm to the touch, not hot — too hot kills the yeast.
• The bread is done when the internal temperature reaches 190°F (88°C).`,
  },
  {
    patterns: [/how (to )?make (pizza|dough)/i, /pizza recipe/i],
    response: `🍕 **How to Make Homemade Pizza**

**Pizza Dough (makes 2 medium pizzas):**
• 2¼ tsp active dry yeast
• 1 cup warm water
• 1 tsp sugar
• 2¾ cups all-purpose flour
• 2 tbsp olive oil
• 1 tsp salt

**Instructions:**
1. Dissolve yeast and sugar in warm water. Wait 5-10 minutes until foamy.
2. Mix flour and salt, add yeast mixture and olive oil.
3. Knead for 8 minutes until smooth. Let rise 1 hour.
4. Preheat oven to 475°F (245°C) with a pizza stone or inverted baking sheet.
5. Divide dough in half. Stretch each piece into a 12-inch round.
6. Add sauce (simple: crushed tomatoes + garlic + oregano + salt), mozzarella, and toppings.
7. Bake 10-12 minutes until crust is golden and cheese is bubbly.

**Pro tips:**
• Stretch the dough by hand — don't use a rolling pin (it pushes out air bubbles).
• Less is more with toppings — overloaded pizza gets soggy.
• For extra crispy crust, preheat your baking surface for 30 minutes.`,
  },
  {
    patterns: [/how (to )?(make|cook|prepare) (chicken|meat|steak|beef|fish|salmon)/i],
    response: `🍗 **How to Cook Perfect Chicken Breast**

**Pan-Seared Chicken Breast:**
1. Pound chicken to even thickness (about ½ inch) — this ensures even cooking.
2. Season generously with salt, pepper, and any spices you like.
3. Heat 1 tbsp oil in a skillet over medium-high heat.
4. Place chicken in the pan — don't move it for 5-6 minutes.
5. Flip and cook another 5-6 minutes until internal temp reaches 165°F (74°C).
6. Rest for 5 minutes before slicing (this keeps the juices in).

**Baked Chicken Breast:**
1. Preheat oven to 425°F (220°C).
2. Season chicken breasts with olive oil, salt, pepper, paprika, garlic powder.
3. Place on a baking sheet.
4. Bake 20-25 minutes until internal temp is 165°F (74°C).
5. Rest 5 minutes.

**Tips for juicy chicken:**
• Brine chicken in salt water for 30 minutes before cooking for extra moisture.
• Don't overcook — use a meat thermometer!
• Let it rest after cooking — cutting too soon lets all the juices run out.`,
  },
  {
    patterns: [/salad recipe|how (to )?make (salad|soup|smoothie|juice|drink)/i],
    response: `🥗 **Simple Garden Salad Recipe**

**Ingredients:**
• Mixed greens (lettuce, spinach, arugula)
• Cherry tomatoes, halved
• Cucumber, sliced
• Red onion, thinly sliced
• Bell pepper, diced
• Feta or goat cheese (optional)
• Nuts or croutons (optional)

**Simple Vinaigrette Dressing:**
• 3 tbsp extra virgin olive oil
• 1 tbsp balsamic vinegar or lemon juice
• 1 tsp Dijon mustard
• Salt and pepper to taste
• Optional: honey, garlic, or herbs

Whisk all dressing ingredients together. Toss with salad just before serving.`,
  },

  // ---- Geography & Countries ----
  {
    patterns: [/tell me about bangladesh|bangladesh info|about bangladesh/i],
    response: `🇧🇩 **Bangladesh — Overview**

**Official Name:** People's Republic of Bangladesh (গণপ্রজাতন্ত্রী বাংলাদেশ)

**Location:** South Asia, on the Bay of Bengal. Bordered by India on three sides and Myanmar to the southeast.

**Capital:** Dhaka (population ~22 million in metro area — one of the world's largest cities)

**Population:** ~175 million — 8th most populous country in the world.

**Geography:**
• Mostly flat and fertile delta land (Ganges-Brahmaputra-Meghna delta).
• The Sundarbans, the world's largest mangrove forest, is shared with India.
• Prone to monsoon flooding — roughly 80% of the land is floodplain.
• Cox's Bazar has the world's longest natural sandy beach (120 km).

**Language:** Bengali (Bangla) — one of the most spoken languages in the world.

**Economy:**
• One of the fastest-growing economies in Asia.
• Major garment/textile exporter — 2nd largest in the world after China.
• Growing IT and pharmaceutical sectors.
• Agriculture: rice, jute, tea, fish.

**Culture:**
• Rich tradition of music (Baul, Rabindra Sangeet), literature, and film.
• Cricket is the most popular sport — Bangladesh has a passionate national team.
• Known for warm hospitality, vibrant festivals (Pohela Boishakh — Bengali New Year), and delicious cuisine.

**Food:** Famous for fish curry (hilsa/illish), biryani, pitha (rice cakes), and chotpoti.

**History:**
• Part of British India until 1947, then East Pakistan.
• Won independence in 1971 through a liberation war.
• Has made remarkable progress in poverty reduction, women's empowerment, and development.`,
  },
  {
    patterns: [/tell me about india|india info|about india/i],
    response: `🇮🇳 **India — Overview**

**Official Name:** Republic of India (भारत गणराज्य)

**Location:** South Asia, the 7th largest country by area.

**Capital:** New Delhi

**Population:** ~1.44 billion — most populous country in the world (surpassed China in 2023).

**Geography:**
• Himalayan mountain range in the north (includes Mount K2 and Kangchenjunga).
• fertile Indo-Gangetic plain in the north.
• Thar Desert in the west.
• Deccan Plateau in the south.
• Long coastline (~7,500 km).

**Languages:** Hindi and English are official. 22 scheduled languages, 100+ spoken.

**Economy:** 5th largest GDP globally. Major industries include IT, pharmaceuticals, agriculture, textiles, and automotive.

**Culture:** One of the oldest civilizations. Known for diverse religions, festivals (Diwali, Holi, Eid), Bollywood, classical music, yoga, and cuisine.

**Famous For:** Taj Mahal, yoga, spices, cricket, Bollywood,信息技术 (IT industry), diversity.`,
  },
  {
    patterns: [/tell me about (the )?(usa|united states|america|united states of america)/i],
    response: `🇺🇸 **United States of America — Overview**

**Location:** North America, between Canada and Mexico.

**Capital:** Washington, D.C.

**Population:** ~335 million

**States:** 50 states + Washington, D.C.

**Geography:**
• Enormous variety: Rocky Mountains, Great Plains, Great Lakes, Grand Canyon, Appalachian Mountains, Hawaii volcanoes, Alaska glaciers.
• Third-largest country by area.
• Alaska is the largest state; Rhode Island is the smallest.

**Economy:** World's largest GDP (~$28 trillion). Major sectors: technology, finance, healthcare, entertainment, agriculture, energy.

**Key Cities:** New York, Los Angeles, Chicago, Houston, San Francisco, Seattle, Miami, Las Vegas.

**Language:** English (no official federal language, but de facto national language).

**Culture:**
• Melting pot of cultures from around the world.
• Hollywood — world's largest film industry.
• Jazz, blues, rock and roll, hip-hop originated here.
• Strong tradition of innovation and entrepreneurship.

**Famous For:** Statue of Liberty, Hollywood, Silicon Valley, national parks (Yellowstone, Yosemite, Grand Canyon), jazz music, fast food culture.`,
  },
  {
    patterns: [/tell me about (the )?(uk|united kingdom|england|britain|great britain)/i],
    response: `🇬🇧 **United Kingdom — Overview**

**Official Name:** United Kingdom of Great Britain and Northern Ireland

**Countries:** England, Scotland, Wales, Northern Ireland

**Capital:** London

**Population:** ~67 million

**Geography:** Island nation off the northwest coast of Europe. Includes England (rolling hills, moors), Scottish Highlands, Welsh mountains, and Northern Irish coastlines.

**Economy:** 6th largest GDP globally. Major sectors: finance (London is a global financial hub), services, technology, pharmaceuticals, creative industries.

**Language:** English (originated here!)

**History:** One of the most influential nations in history. The British Empire was once the largest empire in history, covering about a quarter of the world's land.

**Culture:** Rich literary tradition (Shakespeare, Dickens, Harry Potter), music (Beatles, Rolling Stones, Adele), theatre (West End), football (soccer), cricket, tea culture.

**Famous For:** Big Ben, Buckingham Palace, Stonehenge, Edinburgh Castle, Shakespeare, The Beatles, Premier League football, fish and chips.`,
  },
  {
    patterns: [/tell me about (japan|china|russia|australia|brazil|germany|france|canada|egypt|nigeria|south africa|mexico|italy|spain|korea|thailand|turkey|indonesia|pakistan|nepal|sri lanka)/i],
    response: `I'd love to tell you about that country! Here's what I know. Could you be more specific about which country you'd like to learn about? For example:

• **Japan** — Land of the Rising Sun, known for technology, sushi, anime, and cherry blossoms.
• **China** — World's most populous country, Great Wall, ancient civilization, modern tech giant.
• **Australia** — Island continent, unique wildlife, Great Barrier Reef, diverse landscapes.
• **Brazil** — Largest South American country, Amazon rainforest, football, Carnival.
• **Germany** — Engineering powerhouse, Oktoberfest, BMW, Beethoven.
• **France** — Eiffel Tower, cuisine, fashion, Louvre, wine.
• **Canada** — Known for politeness, maple syrup, Rocky Mountains, bilingual culture.

Just ask "tell me about [country name]" and I'll give you detailed information!`,
  },
  {
    patterns: [/what (is the capital|capital) of (\w+)/i],
    response: `I can help with that! Here are some common capitals:

• **Bangladesh** → Dhaka
• **India** → New Delhi
• **USA** → Washington, D.C.
• **UK** → London
• **Japan** → Tokyo
• **China** → Beijing
• **France** → Paris
• **Germany** → Berlin
• **Australia** → Canberra
• **Brazil** → Brasília
• **Canada** → Ottawa
• **Russia** → Moscow
• **South Korea** → Seoul
• **Italy** → Rome
• **Spain** → Madrid
• **Egypt** → Cairo
• **Turkey** → Ankara

Ask me about a specific country's capital and I can give you more details!`,
  },
  {
    patterns: [/what (is the largest|biggest) (country|ocean|river|desert|mountain|lake|island|forest) in (the world|earth)/i, /largest (country|ocean|river|desert|mountain|lake|island|forest)/i],
    response: `🌍 **World's Largest Geographic Features:**

**Largest Countries (by area):**
1. Russia — 17.1 million km²
2. Canada — 10.0 million km²
3. USA — 9.8 million km²
4. China — 9.6 million km²
5. Brazil — 8.5 million km²

**Largest Oceans:**
1. Pacific Ocean — 165.25 million km²
2. Atlantic Ocean — 106.46 million km²
3. Indian Ocean — 73.56 million km²

**Longest Rivers:**
1. Nile — 6,650 km (Africa)
2. Amazon — 6,400 km (South America)
3. Yangtze — 6,300 km (China)

**Largest Deserts:**
1. Antarctic (polar) — 14.2 million km²
2. Sahara — 9.2 million km²
3. Great Australian — 2.7 million km²

**Tallest Mountains:**
1. Mount Everest — 8,849 m (Nepal/Tibet)
2. K2 — 8,611 m (Pakistan/China)
3. Kangchenjunga — 8,586 m (Nepal/India)

**Largest Lakes:**
1. Caspian Sea — 371,000 km²
2. Superior — 82,100 km²
3. Victoria — 59,947 km²`,
  },

  // ---- Science ----
  {
    patterns: [/what is (the )?(solar system|sun|moon|earth|mars|jupiter|saturn|universe|galaxy|black hole|star|planet|asteroid|comet)/i, /tell me about (the solar system|sun|moon|earth|mars|jupiter|saturn|universe|galaxy|black hole|stars?|planets?)/i],
    response: `🌌 **The Solar System**

**The Sun:**
• A medium-sized star (G-type main-sequence) at the center of our solar system.
• About 4.6 billion years old, with roughly 5 billion years of life remaining.
• Surface temperature: ~5,500°C (9,932°F).

**Inner Planets (Terrestrial):**
• **Mercury** — Smallest planet, no atmosphere, extreme temperatures (-180°C to 430°C).
• **Venus** — Hottest planet (465°C) due to greenhouse effect. Rotates backwards.
• **Earth** — Only known planet with liquid water and life.
• **Mars** — "Red Planet" due to iron oxide. Has the tallest volcano (Olympus Mons, 21.9 km).

**Outer Planets (Gas/Ice Giants):**
• **Jupiter** — Largest planet, Great Red Spot is a storm bigger than Earth.
• **Saturn** — Famous rings made of ice and rock particles.
• **Uranus** — Rotates on its side, blue-green from methane.
• **Neptune** — Windiest planet, winds up to 2,100 km/h.

**Other Objects:** Dwarf planets (Pluto, Ceres), asteroids, comets, the Kuiper Belt, and Oort Cloud.`,
  },
  {
    patterns: [/quantum computing|quantum physics|quantum mechanics|quantum (computer|technology|theory)/i],
    response: `⚛️ **Quantum Computing & Quantum Physics**

**What is Quantum Physics?**
The branch of physics dealing with behavior at atomic and subatomic levels. Particles can exist in multiple states simultaneously, behave as waves, and be entangled with other particles.

**Key Concepts:**
• **Superposition:** A quantum particle can exist in multiple states at once until measured. A qubit can be 0, 1, or both simultaneously.
• **Entanglement:** Two particles can be connected so that measuring one instantly affects the other, regardless of distance ("spooky action at a distance" — Einstein).
• **Wave-particle duality:** Light and matter exhibit both wave-like and particle-like properties.
• **Quantum tunneling:** Particles can pass through barriers they classically shouldn't be able to cross.

**Quantum Computing:**
• Uses qubits instead of classical bits (which are either 0 or 1).
• Qubits can be 0, 1, or in superposition — enabling massive parallelism.
• Potential applications: cryptography, drug discovery, optimization, AI.
• Current challenges: maintaining qubit stability (quantum decoherence), error correction, extreme cooling requirements (near absolute zero).
• Companies working on it: IBM, Google, Microsoft, IonQ, Rigetti.`,
  },
  {
    patterns: [/artificial intelligence|machine learning|neural network|deep learning|what is ai|what is machine learning/i],
    response: `🤖 **Artificial Intelligence & Machine Learning**

**What is AI?**
Artificial Intelligence is the simulation of human intelligence by machines. It encompasses everything from simple rule-based systems to complex neural networks that can learn from data.

**Key Branches:**
• **Machine Learning (ML):** Algorithms that learn patterns from data without being explicitly programmed.
• **Deep Learning:** ML using neural networks with many layers (inspired by the human brain).
• **Natural Language Processing (NLP):** Understanding and generating human language (like me!).
• **Computer Vision:** Interpreting images and video.

**Types of Machine Learning:**
1. **Supervised Learning:** Trained on labeled data (input → output pairs). Examples: spam detection, image classification.
2. **Unsupervised Learning:** Finds patterns in unlabeled data. Examples: clustering, anomaly detection.
3. **Reinforcement Learning:** Learns through trial and error with rewards. Examples: game playing, robotics.

**How Neural Networks Work:**
• Layers of "neurons" (mathematical functions) process data.
• Input layer → Hidden layers → Output layer.
• During training, the network adjusts weights to minimize prediction errors.
• Deep learning uses many hidden layers (hence "deep").

**Modern AI Milestones:**
• GPT/BERT — Large language models (transformers)
• AlphaGo — Beat world champion at Go
• Stable Diffusion — Image generation
• GPT-4, Gemini — Multimodal AI systems`,
  },
  {
    patterns: [/dna|genetics|evolution|natural selection|genetic|gene|chromosome/i],
    response: `🧬 **DNA, Genetics & Evolution**

**What is DNA?**
DNA (Deoxyribonucleic Acid) is the molecule that carries genetic instructions for life. It's found in nearly every cell and is shaped like a double helix.

**Key Facts:**
• Human DNA has ~3 billion base pairs and ~20,000-25,000 genes.
• You share 99.9% of your DNA with every other human.
• Humans share ~96% DNA with chimpanzees, ~85% with mice, ~60% with bananas.

**How DNA Works:**
• DNA is made of four bases: Adenine (A), Thymine (T), Guanine (G), Cytosine (C).
• A always pairs with T, G always pairs with C.
• Genes are segments of DNA that code for proteins.
• Proteins do most of the work in cells and are the building blocks of life.

**Evolution & Natural Selection:**
• Charles Darwin proposed natural selection in 1859.
• Organisms with traits better suited to their environment are more likely to survive and reproduce.
• Over millions of years, small changes accumulate, leading to new species.
• Evidence: fossils, DNA comparisons, comparative anatomy, observed evolution in bacteria and insects.`,
  },
  {
    patterns: [/what is (gravity|energy|electricity|magnetism|atom|molecule|electron|proton|neutron|photon|light|sound|wave|friction|inertia)/i],
    response: `🔬 **Fundamental Physics Concepts**

**Gravity:** The force of attraction between objects with mass. The more massive the object, the stronger the gravitational pull. Einstein described it as the curvature of spacetime caused by mass and energy.

**Energy:** The ability to do work. It can't be created or destroyed (conservation of energy), only transformed from one form to another. Types: kinetic, potential, thermal, chemical, nuclear, electrical, light.

**Electricity:** The flow of electric charge (usually electrons). Conductors (metals) allow easy flow; insulators (rubber, glass) resist it. Voltage = pressure, Current = flow rate, Resistance = opposition.

**Atom:** The basic unit of matter. Consists of a nucleus (protons + neutrons) surrounded by electrons. Atoms are mostly empty space — if an atom were the size of a football stadium, the nucleus would be the size of a marble.

**Light:** Electromagnetic radiation visible to the human eye. Travels at 299,792 km/s (the speed of light). Exhibits both wave and particle (photon) properties.

**Sound:** A vibration that travels as a pressure wave through a medium (air, water, solids). Cannot travel in a vacuum. Speed in air: ~343 m/s.`,
  },
  {
    patterns: [/photosynthesis|respiration|ecosystem|food chain|food web|biodiversity/i],
    response: `🌿 **Biology — Ecosystems & Photosynthesis**

**Photosynthesis:**
The process by which plants convert light energy into chemical energy (food).

Equation: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂

• Takes place in chloroplasts (containing chlorophyll, which makes leaves green).
• Produces glucose (food for the plant) and oxygen (which we breathe).
• Essential for life on Earth — it's how most energy enters ecosystems.

**Cellular Respiration:**
The process by which organisms break down glucose to release energy.

Equation: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP (energy)

• Occurs in mitochondria.
• Essentially the reverse of photosynthesis.

**Food Chain:** A linear sequence showing energy flow:
Sun → Grass → Rabbit → Fox → Decomposers

**Food Web:** A complex network of interconnected food chains in an ecosystem.

**Biodiversity:** The variety of life in an ecosystem. Higher biodiversity = more resilient ecosystem.`,
  },

  // ---- Math ----
  {
    patterns: [/what is (pi|π|euler|e|golden ratio|fibonacci)/i, /explain pi|value of pi/i],
    response: `🔢 **Pi (π) — The Most Famous Number**

**What is Pi?**
Pi is the ratio of a circle's circumference to its diameter. It's the same for every circle, no matter the size.

π = Circumference ÷ Diameter

**Value:**
π ≈ 3.14159265358979...

It's an irrational number — the decimal goes on forever without repeating.

**Common Approximations:**
• 3.14
• 22/7 (close but not exact)
• 355/113 (very accurate approximation)

**Where Pi Appears:**
• Circle circumference: C = 2πr
• Circle area: A = πr²
• Sphere volume: V = (4/3)πr³
• Many physics equations (quantum mechanics, general relativity, statistics)

**Fun Facts:**
• Pi Day is celebrated on March 14th (3/14).
• The first 100 digits: 3.14159265358979323846264338327950288419716939937510...
• People have calculated trillions of digits of pi using computers.
• The symbol π was first used by William Jones in 1706.`,
  },
  {
    patterns: [/solve|calculate|what is \d+/i, /\d+\s*[\+\-\*\/\^]\s*\d+/i, /math (help|problem|question)/i],
    response: `🧮 **Math Help Available!**

I can help with various math topics in offline mode:

**Arithmetic:** Addition, subtraction, multiplication, division, percentages, fractions.

**Algebra:** Solving equations, factoring, graphing functions, systems of equations.

**Geometry:** Area, perimeter, volume, angles, triangles, circles, Pythagorean theorem.

**Trigonometry:** Sine, cosine, tangent, unit circle, identities.

**Calculus:** Derivatives, integrals, limits, series.

**Statistics:** Mean, median, mode, standard deviation, probability.

**Key Formulas:**
• Area of circle: A = πr²
• Pythagorean theorem: a² + b² = c²
• Quadratic formula: x = (-b ± √(b²-4ac)) / 2a
• Area of triangle: A = ½ × base × height
• Volume of sphere: V = (4/3)πr³

Try asking me a specific math question like "What is 15% of 200?" or "Explain the Pythagorean theorem" and I'll do my best!`,
  },
  {
    patterns: [/pythagorean theorem|a squared|right triangle|hypotenuse/i],
    response: `📐 **Pythagorean Theorem**

The Pythagorean theorem states that in a right-angled triangle, the square of the hypotenuse (the longest side) equals the sum of the squares of the other two sides.

**Formula:** a² + b² = c²

Where c is the hypotenuse (the side opposite the right angle), and a and b are the other two sides.

**Example:**
If a = 3 and b = 4:
c² = 3² + 4² = 9 + 16 = 25
c = √25 = 5

So a triangle with sides 3, 4, and 5 is a right triangle!

**Common Pythagorean Triples (whole numbers):**
• 3, 4, 5
• 5, 12, 13
• 8, 15, 17
• 7, 24, 25
• 9, 40, 41

**Applications:**
• Finding the distance between two points on a coordinate plane
• Construction and architecture
• Navigation and GPS
• Physics calculations`,
  },
  {
    patterns: [/percent(age)?|what is \d+%|how to calculate percent/i],
    response: `📊 **Percentages — How to Calculate**

**Basic Formula:**
Part ÷ Whole × 100 = Percentage

**Finding a percentage of a number:**
To find 15% of 200:
200 × 0.15 = 30

**Finding what percent one number is of another:**
What percent of 50 is 12?
12 ÷ 50 × 100 = 24%

**Finding the whole when you know the percentage:**
If 30 is 20% of a number, what is the number?
30 ÷ 0.20 = 150

**Percentage Increase/Decrease:**
New value = Original × (1 + percentage change)
Example: 200 increased by 15% = 200 × 1.15 = 230

**Quick Mental Math Tips:**
• 10% = divide by 10
• 1% = divide by 100
• 25% = divide by 4
• 50% = divide by 2
• 5% = half of 10%

Try asking me a specific percentage problem!`,
  },

  // ---- Programming / Coding ----
  {
    patterns: [/javascript|typescript|python|java\b|html|css|react|node\.?js|programming|coding|code|algorithm|function|variable|loop|array|api|database|sql|git|docker|linux/i],
    response: `💻 **Programming & Coding Help**

I can help with programming concepts and code in offline mode! Here are some topics I can cover:

**Languages:**
• JavaScript / TypeScript — Web development, Node.js, React
• Python — Data science, automation, web (Django/Flask)
• Java — Enterprise, Android, Spring Boot
• HTML/CSS — Web structure and styling
• C/C++ — Systems programming, game engines
• SQL — Database queries

**Core Concepts:**
• Variables, data types, operators
• Control flow (if/else, loops, switch)
• Functions and methods
• Arrays, objects, maps, sets
• Object-Oriented Programming (classes, inheritance, polymorphism)
• Recursion, sorting algorithms, search algorithms
• Data structures (linked lists, trees, graphs, stacks, queues)
• APIs (REST, GraphQL)
• Version control with Git

**Example — Hello World in Python:**
\`\`\`python
print("Hello, World!")
\`\`\`

**Example — Function in JavaScript:**
\`\`\`javascript
function greet(name) {
  return "Hello, " + name + "!";
}
console.log(greet("Quantum AI"));
\`\`\`

Ask me about specific programming topics and I'll provide detailed explanations with code examples!`,
  },
  {
    patterns: [/what is html|how does html work|html tags|basic html/i],
    response: `🌐 **HTML — HyperText Markup Language**

HTML is the standard language for creating web pages. It defines the structure and content of a web page using "tags."

**Basic Structure:**
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Page</title>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>This is a paragraph.</p>
</body>
</html>
\`\`\`

**Common Tags:**
• \`<h1>\` to \`<h6>\` — Headings (h1 is largest)
• \`<p>\` — Paragraph
• \`<a href="url">\` — Link
• \`<img src="url" alt="text">\` — Image
• \`<div>\` — Container/division
• \`<span>\` — Inline container
• \`<ul>\`, \`<ol>\`, \`<li>\` — Lists
• \`<button>\` — Button
• \`<input>\` — Form input
• \`<table>\`, \`<tr>\`, \`<td>\` — Tables

**Semantic Tags (modern HTML5):**
• \`<header>\`, \`<nav>\`, \`<main>\`, \`<footer>\`, \`<article>\`, \`<section>\`

HTML is often paired with CSS (for styling) and JavaScript (for interactivity).`,
  },
  {
    patterns: [/how (to )?(make|build|create) a (website|web app|app|program|game|bot)/i],
    response: `🛠️ **How to Build a Website from Scratch**

**Step 1: Plan**
• Decide what the website is about (portfolio, blog, business, etc.)
• Sketch the layout (home page, about page, contact page)

**Step 2: Learn the Basics**
• **HTML** — Structure and content
• **CSS** — Styling and layout
• **JavaScript** — Interactivity and logic

**Step 3: Build**
1. Create an \`index.html\` file:
\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Welcome to My Website!</h1>
  <p>This is my first web page.</p>
  <script src="script.js"></script>
</body>
</html>
\`\`\`

2. Add styles in \`style.css\`:
\`\`\`css
body { font-family: Arial; margin: 0; padding: 20px; }
h1 { color: #333; }
\`\`\`

3. Add interactivity in \`script.js\`:
\`\`\`javascript
console.log("Website loaded!");
\`\`\`

**Step 4: Deploy**
• Free hosting: GitHub Pages, Netlify, Vercel
• Connect a domain name if you want a custom URL

**Step 5: Improve**
• Make it responsive (works on mobile)
• Add more pages and features
• Learn a framework (React, Vue, Next.js) for complex apps`,
  },
  {
    patterns: [/explain (git|github|docker|linux|terminal|command line|ssh|api|rest|json|database|sql)/i, /what is (git|github|docker|linux|terminal|command line|ssh|api|rest|json|database|sql)/i],
    response: `Here are quick explanations of common tech concepts:

**Git:** Version control system that tracks changes in code. Created by Linus Torvalds (also Linux creator).

**GitHub:** Web platform for hosting Git repositories. Enables collaboration, code review, and project management.

**Docker:** Platform for building and running applications in "containers" — lightweight, isolated environments that work consistently anywhere.

**Linux:** Open-source operating system used on servers, Android phones, and developer machines. Distributions include Ubuntu, Fedora, Arch.

**Terminal/Command Line:** Text-based interface for interacting with your computer. Powerful for automation, file management, and development.

**SSH:** Secure Shell — encrypted protocol for securely connecting to remote servers.

**API (Application Programming Interface):** A way for different software systems to communicate. REST APIs use HTTP methods (GET, POST, PUT, DELETE).

**JSON:** JavaScript Object Notation — lightweight data format: \`{"name": "Quantum", "version": 1}\`

**SQL:** Structured Query Language for managing databases.
\`\`\`sql
SELECT name, email FROM users WHERE age > 18;
\`\`\`

Which one would you like to dive deeper into?`,
  },

  // ---- History ----
  {
    patterns: [/world war|ww1|ww2|world war (1|2|i|ii|one|two)|history of (the world|civilization|america|europe|asia)/i],
    response: `📜 **Major Historical Events**

**World War I (1914-1918):**
• Triggered by the assassination of Archduke Franz Ferdinand of Austria.
• Allied Powers (UK, France, Russia, USA) vs. Central Powers (Germany, Austria-Hungary, Ottoman Empire).
• New weapons: machine guns, poison gas, tanks, airplanes.
• Ended with the Treaty of Versailles. ~20 million deaths.

**World War II (1939-1945):**
• Started with Germany's invasion of Poland.
• Allied Powers (UK, USA, USSR, France) vs. Axis Powers (Germany, Italy, Japan).
• The Holocaust — systematic genocide of 6 million Jews.
• Atomic bombs dropped on Hiroshima and Nagasaki (1945).
• ~70-85 million deaths — deadliest conflict in history.
• Led to the United Nations and the Cold War.

**Other Major Events:**
• Fall of Rome (476 AD) — End of the Western Roman Empire.
• Renaissance (14th-17th century) — Cultural rebirth in Europe.
• Industrial Revolution (1760-1840) — Shift from agriculture to manufacturing.
• Moon Landing (1969) — Neil Armstrong walked on the Moon.
• Fall of the Berlin Wall (1989) — End of the Cold War.`,
  },
  {
    patterns: [/who invented|who discovered|invention of|discovery of/i],
    response: `💡 **Famous Inventions & Discoveries**

• **Electricity** — Benjamin Franklin's experiments; Thomas Edison (practical light bulb, 1879); Nikola Tesla (AC current).
• **Internet** — ARPANET (1969, US Dept. of Defense); Tim Berners-Lee invented the World Wide Web (1989).
• **Telephone** — Alexander Graham Bell (1876).
• **Printing Press** — Johannes Gutenberg (~1440) — revolutionized communication.
• **Airplane** — Wright Brothers (1903, first powered flight).
• **Penicillin** — Alexander Fleming (1928, accidental discovery).
• **World Wide Web** — Tim Berners-Lee (1989, at CERN).
• **Vaccine** — Edward Jenner (1796, smallpox vaccine).
• **Theory of Relativity** — Albert Einstein (1905/1915).
• **Evolution** — Charles Darwin (1859, On the Origin of Species).
• **X-Rays** — Wilhelm Röntgen (1895).
• **Telescope** — Hans Lippershey (1608), improved by Galileo (1609).
• **Computer** — Charles Babbage designed the first mechanical computer; Alan Turing laid theoretical foundations; modern computers evolved from there.`,
  },

  // ---- Health & Body ----
  {
    patterns: [/how (does|do) (the heart|brain|lungs|stomach|immune system|eyes|muscles|bones) work|human body|anatomy/i],
    response: `🫀 **The Human Body — How It Works**

**The Brain:**
• Weighs about 3 pounds. Contains ~86 billion neurons.
• Controls thoughts, memory, emotions, movement, breathing, temperature.
• Uses 20% of the body's total energy despite being only 2% of body weight.

**The Heart:**
• Beats ~100,000 times per day, pumping ~7,500 liters of blood.
• Four chambers: two atria (upper) and two ventricles (lower).
• Blood flows: body → right atrium → right ventricle → lungs (get oxygen) → left atrium → left ventricle → body.

**The Lungs:**
• Contain ~300 million alveoli (tiny air sacs) with a total surface area of ~70 m² (about the size of a tennis court).
• You breathe ~20,000 times per day.

**The Stomach:**
• Produces hydrochloric acid (pH 1.5-3.5) — strong enough to dissolve metal.
• Mucus lining protects the stomach from digesting itself.
• Food stays in the stomach for 2-5 hours.

**The Immune System:**
• White blood cells identify and destroy pathogens.
• Antibodies recognize specific invaders and mark them for destruction.
• Memory cells "remember" past infections for faster response (basis of vaccines).`,
  },

  // ---- Tips & Practical Knowledge ----
  {
    patterns: [/how (to )?(study|learn|memorize|concentrate|focus|be productive|manage time)/i, /study tips|learning tips|productivity/i],
    response: `📚 **Effective Study & Learning Tips**

**The Pomodoro Technique:**
1. Study for 25 minutes (one "pomodoro").
2. Take a 5-minute break.
3. After 4 pomodoros, take a longer 15-30 minute break.
4. This prevents burnout and maintains focus.

**Active Recall:**
Instead of re-reading notes, close the book and try to recall what you just learned. This strengthens memory more than passive reading.

**Spaced Repetition:**
Review information at increasing intervals (1 day, 3 days, 7 days, 14 days, 30 days). This moves information from short-term to long-term memory.

**The Feynman Technique:**
1. Choose a concept you want to learn.
2. Explain it in simple terms as if teaching someone else.
3. Identify gaps in your understanding.
4. Go back and fill those gaps.

**Other Tips:**
• Get 7-9 hours of sleep — sleep is when memories consolidate.
• Exercise regularly — it improves brain function and focus.
• Stay hydrated and eat well.
• Minimize distractions (turn off notifications).
• Teach what you learn to someone else — it's the best way to solidify knowledge.`,
  },
  {
    patterns: [/how (to )?make money|earn money|side (hustle|income)|passive income|freelancing/i],
    response: `💰 **Ways to Make Money Online**

**Freelancing:**
• Web development, graphic design, writing, translation, video editing
• Platforms: Fiverr, Upwork, Freelancer, Toptal

**Content Creation:**
• YouTube — ad revenue, sponsorships
• Blogging — ads, affiliate marketing, sponsored posts
• Podcasting — sponsorships, listener support

**Online Selling:**
• E-commerce (Shopify, Etsy, Amazon)
• Print-on-demand (Redbubble, Merch by Amazon)
• Digital products (e-books, courses, templates)

**Tech Skills (High Earning Potential):**
• Web/app development
• Data science & machine learning
• Cloud computing (AWS, Azure)
• Cybersecurity consulting

**Passive Income Ideas:**
• Create an online course (Udemy, Teachable)
• Write an e-book and sell on Amazon
• Build a SaaS product
• Stock photography
• Affiliate marketing

**Key Advice:**
• Start with skills you already have or are willing to learn.
• Build a portfolio to showcase your work.
• Be consistent — most income streams take time to build.
• Reinvest early earnings into learning and tools.`,
  },

  // ---- Space & Astronomy ----
  {
    patterns: [/how (big|far|old|fast) is|how far (is|are) (the sun|moon|mars|jupiter|alpha centauri|andromeda|the nearest star)/i, /distance to|speed of light|how fast is light/i],
    response: `🚀 **Space Distances & Scale**

**In Our Solar System:**
• Earth to Moon: 384,400 km (1.3 light-seconds)
• Earth to Sun: 149.6 million km (8.3 light-minutes)
• Earth to Mars: 55-401 million km (varies with orbit)
• Earth to Jupiter: 588-968 million km

**Beyond Our Solar System:**
• Nearest star (Proxima Centauri): 4.24 light-years (~40 trillion km)
• Nearest galaxy (Canis Major Dwarf): 25,000 light-years
• Andromeda Galaxy: 2.537 million light-years
• Observable universe: ~93 billion light-years in diameter

**Speed of Light:**
• 299,792 km/s (about 300,000 km/s)
• Light from the Sun takes 8 minutes 20 seconds to reach Earth
• Light from the nearest star takes 4.24 years
• Nothing with mass can travel at or faster than the speed of light (according to current physics)

**Mind-Boggling Numbers:**
• Milky Way galaxy: 100,000-180,000 light-years across
• Observable universe: ~2 trillion galaxies
• Each galaxy contains millions to trillions of stars`,
  },

  // ---- Everyday Knowledge ----
  {
    patterns: [/what (is|causes|makes) (rain|snow|wind|thunder|lightning|tornado|hurricane|earthquake|volcano|tsunami|climate change|global warming)/i, /weather|climate/i],
    response: `🌦️ **Weather & Natural Phenomena**

**Rain:**
Water evaporates from oceans/lakes → rises and cools → condenses into clouds → water droplets combine and become heavy enough to fall as rain.

**Snow:**
Same as rain, but temperatures are below freezing (0°C/32°F), so water vapor turns directly into ice crystals in clouds.

**Thunder & Lightning:**
Lightning is an electrical discharge between clouds or between a cloud and the ground. It heats the air to ~30,000°C (5x hotter than the Sun's surface), causing rapid expansion → sound wave = thunder.

**Earthquakes:**
Caused by the sudden release of energy in the Earth's tectonic plates. Plates are always moving (a few cm/year). When they get stuck and suddenly release, seismic waves radiate outward. Measured on the Richter scale.

**Climate Change:**
The Earth's average temperature is rising due to greenhouse gases (CO₂, methane) trapping heat in the atmosphere. Main causes: burning fossil fuels, deforestation, agriculture. Effects: rising sea levels, more extreme weather, ecosystem disruption.`,
  },
  {
    patterns: [/what (is|does) (vitamin|protein|carb|fat|calorie|nutrient|fiber|mineral|antioxidant)/i, /nutrition|diet|healthy eating|food (science|nutrition)/i],
    response: `🥗 **Nutrition Basics**

**Macronutrients (needed in large amounts):**
• **Carbohydrates** (4 cal/g) — Main energy source. Found in bread, rice, fruits, vegetables. Complex carbs (whole grains) are better than simple sugars.
• **Proteins** (4 cal/g) — Build and repair muscles, enzymes, hormones. Found in meat, fish, eggs, beans, nuts. Recommended: 0.8-1g per kg of body weight daily.
• **Fats** (9 cal/g) — Hormone production, nutrient absorption, insulation. Choose unsaturated fats (olive oil, avocados, nuts) over saturated fats.

**Micronutrients (needed in small amounts):**
• **Vitamin C** — Immune function (citrus, peppers, berries)
• **Vitamin D** — Bone health, immunity (sunlight, fish, fortified foods)
• **Iron** — Oxygen transport in blood (red meat, spinach, beans)
• **Calcium** — Bones and teeth (dairy, leafy greens)
• **Potassium** — Heart and muscle function (bananas, potatoes)

**Key Principles:**
• Eat a variety of colorful fruits and vegetables.
• Stay hydrated — drink ~2 liters of water daily.
• Limit processed foods, added sugars, and excess salt.
• A balanced diet is more important than any single "superfood."`,
  },

  // ---- General Help ----
  {
    patterns: [/help me|can you help|what can you do|what are your capabilities/i],
    response: `🤖 **I'm Quantum AI — Here's What I Can Help With (Offline):**

**General Knowledge:**
• Science, geography, history, countries, cultures
• Math calculations and explanations
• Health and nutrition information
• Space and astronomy

**Cooking:**
• Recipes for cakes, pasta, rice, bread, eggs, chicken, and more
• Cooking tips and techniques

**Programming:**
• HTML, CSS, JavaScript, Python, and more
• Explain concepts like APIs, databases, Git
• Code examples and tutorials

**Study & Learning:**
• Study techniques (Pomodoro, spaced repetition)
• How to learn new skills effectively

**Practical Advice:**
• Money-making ideas
• How to build websites/apps
• Weather and climate explanations

**Just ask me anything!** If it's in my knowledge base, I'll give you a detailed answer. For complex or very specific questions, try going online for my full AI capabilities (General mode uses Gemini, Hacking mode uses Groq).`,
  },
  {
    patterns: [/thank|thanks|thx|appreciate/i],
    response: "You're welcome! 😊 Happy to help anytime. Feel free to ask more questions!",
  },
  {
    patterns: [/bye|goodbye|see you|good night|goodbye/i],
    response: "Goodbye! 👋 Remember, I'm always here — online or offline. Have a great day!",
  },
  {
    patterns: [/what time|what date|what day/i],
    response: `I can help with that! Here's how:

**Check your device** for the current time and date — your phone, computer, or tablet always shows this.

Some fun time facts:
• A day is exactly 24 hours (23h 56m for a sidereal day — one rotation relative to stars).
• A year is 365.25 days (hence leap years).
• Time zones were established in 1884 at the International Meridian Conference.
• Greenwich Mean Time (GMT) / UTC is the reference point.`,
  },
  {
    patterns: [/offline|no internet|without (wifi|internet|connection)/i],
    response: `You're currently using my **offline mode**. 🟢

I'm running a built-in knowledge engine directly in your browser — no internet needed. I can help with:
• General knowledge and facts
• Cooking recipes
• Science and math
• Geography and countries
• Programming basics
• Study tips
• And much more!

**For even better responses**, connect to the internet and use:
• **General Mode** — Powered by Google Gemini
• **Hacking Mode** — Powered by Groq for cybersecurity topics

But I'm here to help even without a connection!`,
  },
];

// ============================================================
// Fallback responses — used when no pattern matches
// ============================================================

function smartFallback(input: string): string {
  const lower = input.toLowerCase().trim();

  // Try to extract a topic from the input
  const topicMatch = lower.match(
    /(?:about|tell me about|explain|what is|how (?:to|do|does|did)|who is|who was|why (?:is|do|does|did)|when (?:was|did|is|were))\s+(.+)/i,
  );
  const topic = topicMatch?.[1]?.replace(/[?.!]+$/, "")?.trim() ?? input;

  // Very short or greeting-like inputs
  if (input.length < 5) {
    return `Hi there! I'm Quantum AI. Ask me anything — cooking, science, math, history, coding, geography, and more. I'm happy to help even when offline!`;
  }

  // Default contextual fallback
  return `That's a great question about **"${topic}"**!

In offline mode, my knowledge covers a wide range of topics including:
• 🧪 **Science** — physics, chemistry, biology, astronomy
• 🌍 **Geography** — countries, capitals, world facts
• 🍳 **Cooking** — recipes and techniques
• 🔢 **Math** — arithmetic through calculus concepts
• 💻 **Programming** — HTML, CSS, JavaScript, Python, and more
• 📜 **History** — major events and figures
• 💪 **Health** — nutrition, anatomy, wellness

I may not have a specific answer for this topic in my offline knowledge base. Try rephrasing your question, or connect online for my full AI capabilities powered by Gemini or Groq.

**Here's what I can tell you:** Try asking something like "How do I make cake?" or "Tell me about Bangladesh" or "What is quantum computing?" and I'll give you a detailed answer!`;
}

function findResponse(input: string): string {
  const trimmed = input.trim();

  // Check knowledge base — return first matching entry
  for (const entry of KNOWLEDGE) {
    for (const pattern of entry.patterns) {
      if (pattern.test(trimmed)) {
        return entry.response;
      }
    }
  }

  // No match — use smart fallback
  return smartFallback(trimmed);
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
    await new Promise((r) => setTimeout(r, 20));
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
