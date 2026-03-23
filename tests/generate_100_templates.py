"""
Generate 100+ creative templates across different styles and categories.
Uses Grok Imagine text-to-image (no reference image needed).
"""

import asyncio
import base64
import json
import os
import time
from datetime import datetime

import httpx

GROK_KEY = os.environ.get("GROK_API_KEY", "")
URL = "https://api.x.ai/v1/images/generations"
OUT = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "templates")
os.makedirs(OUT, exist_ok=True)

HEADERS = {"Authorization": f"Bearer {GROK_KEY}", "Content-Type": "application/json"}

# ── 105 Template Definitions ──────────────────────────────────────────

TEMPLATES = [
    # ═══ SALE & PROMOTIONAL (25) ═══
    {"id": "flash_sale", "cat": "sale", "name": "Flash Sale", "desc": "Bold urgency-driven promo",
     "prompt": "Professional e-commerce flash sale ad. Sleek wireless headphones on dark gradient background. Bold white text 'FLASH SALE' at top, '48 HOURS ONLY' subtitle, huge yellow 'UP TO 60% OFF' centered, 'Free Shipping on Orders $50+' at bottom, red 'ENDS SUNDAY' badge bottom-right. Modern, high contrast."},
    {"id": "black_friday", "cat": "sale", "name": "Black Friday", "desc": "Dark dramatic Black Friday",
     "prompt": "Black Friday ad creative. Matte black background with gold foil accents and particles. A premium watch centered. Giant bold text 'BLACK FRIDAY' in white with gold outline at top, 'UP TO 70% OFF EVERYTHING' in gold, 'DOORBUSTERS START AT $9.99' in white, 'SHOP NOW' gold CTA button at bottom. Luxurious, dramatic."},
    {"id": "cyber_monday", "cat": "sale", "name": "Cyber Monday", "desc": "Neon tech Cyber Monday",
     "prompt": "Cyber Monday ad. Dark background with neon blue and purple glowing grid lines. A gaming keyboard floating. Text: 'CYBER MONDAY' in glowing neon blue, 'DEALS UP TO 80% OFF' in white, 'CODE: CYBER80' in a neon badge, '24 HOURS ONLY' with countdown aesthetic. Cyberpunk, futuristic."},
    {"id": "clearance", "cat": "sale", "name": "Clearance", "desc": "Bold red clearance event",
     "prompt": "Clearance sale ad. Bright red background with white starburst patterns. Stack of shoeboxes. Bold text: 'CLEARANCE EVENT' in huge white block letters, 'EVERYTHING MUST GO' in yellow, 'UP TO 75% OFF' in a red circle badge, 'WHILE SUPPLIES LAST' at bottom. Retail energy, urgent."},
    {"id": "bogo", "cat": "sale", "name": "Buy One Get One", "desc": "Fun BOGO deal",
     "prompt": "Buy one get one free ad. Bright coral/orange gradient background. Two identical sunglasses arranged symmetrically. Text: 'BUY ONE' in white at top, 'GET ONE FREE' in bold yellow below, product name in clean font, 'Limited Time Offer' in a banner, 'No Code Needed' at bottom. Playful, eye-catching."},
    {"id": "weekend_deal", "cat": "sale", "name": "Weekend Deal", "desc": "Casual weekend sale",
     "prompt": "Weekend deal ad. Warm sunset gradient background (peach to lavender). A cozy throw blanket. Text: 'WEEKEND DEAL' in relaxed serif font, '30% OFF ALL HOME' in bold sans-serif, 'Sat & Sun Only' in handwritten style, 'shopcozy.com' at bottom. Warm, inviting, relaxed vibe."},
    {"id": "holiday_sale", "cat": "sale", "name": "Holiday Sale", "desc": "Festive holiday promotion",
     "prompt": "Holiday sale ad. Deep green background with gold snowflake patterns and warm bokeh lights. A gift box with red ribbon. Text: 'HOLIDAY SALE' in elegant gold serif, 'UP TO 50% OFF' in white, 'Gift the Best This Season' in italic, 'FREE GIFT WRAPPING' in a red banner. Festive, warm, premium."},
    {"id": "summer_sale", "cat": "sale", "name": "Summer Sale", "desc": "Bright summer promotion",
     "prompt": "Summer sale ad. Bright turquoise background with palm leaf shadows and sun rays. Sunglasses and a beach towel. Text: 'SUMMER SALE' in bold chunky white, 'UP TO 40% OFF' in coral pink, 'Use Code: SUN40' in a yellow badge, 'shopbright.com' at bottom. Vibrant, beachy, energetic."},
    {"id": "winter_sale", "cat": "sale", "name": "Winter Sale", "desc": "Cool winter clearance",
     "prompt": "Winter sale ad. Icy blue gradient background with snowflake particles. A warm knit scarf. Text: 'WINTER SALE' in crisp white serif, 'SAVE UP TO 50%' in ice blue, 'Cozy Up for Less' in italic, 'Free Shipping Over $35' in a subtle banner. Cool, clean, seasonal."},
    {"id": "spring_sale", "cat": "sale", "name": "Spring Sale", "desc": "Fresh spring renewal",
     "prompt": "Spring sale ad. Soft pastel gradient (mint to pink). Fresh flowers and a watering can. Text: 'SPRING INTO SAVINGS' in playful serif, '25% OFF NEW ARRIVALS' in bold green, 'Fresh Styles Are Here' in script, 'SHOP NOW' mint CTA button. Light, airy, fresh."},
    {"id": "back_to_school", "cat": "sale", "name": "Back to School", "desc": "School supplies sale",
     "prompt": "Back to school ad. Yellow background with notebook paper texture. Colorful pencils, ruler, backpack. Text: 'BACK TO SCHOOL' in chalkboard-style font, 'SAVE 30% ON ESSENTIALS' in bold blue, 'Gear Up for A+ Grades' in red, 'Code: SCHOOL30' in a pencil-shaped badge. Fun, academic."},
    {"id": "valentines", "cat": "sale", "name": "Valentine's Day", "desc": "Romantic Valentine's promo",
     "prompt": "Valentine's Day ad. Soft pink gradient with scattered rose petals. A jewelry box with necklace. Text: 'VALENTINE'S DAY' in elegant serif, 'Gift of Love — 20% Off' in rose gold, 'For the One You Love' in italic script, 'Free Gift Box' in a heart badge. Romantic, elegant."},
    {"id": "mothers_day", "cat": "sale", "name": "Mother's Day", "desc": "Heartfelt Mother's Day",
     "prompt": "Mother's Day ad. Soft lavender and white floral background. A spa gift set. Text: 'HAPPY MOTHER'S DAY' in elegant serif, 'She Deserves the Best' in script, '25% OFF GIFT SETS' in bold, 'Free Personalization' in a ribbon banner. Soft, caring, premium."},
    {"id": "fathers_day", "cat": "sale", "name": "Father's Day", "desc": "Classic Father's Day",
     "prompt": "Father's Day ad. Deep navy blue background with subtle leather texture. A premium wallet. Text: 'FATHER'S DAY' in bold condensed white, 'FOR THE MAN WHO HAS EVERYTHING' in light blue, '30% OFF GIFTS FOR DAD' in a gold banner, 'Code: DAD30' at bottom. Masculine, sophisticated."},
    {"id": "prime_day", "cat": "sale", "name": "Prime Day Style", "desc": "Lightning deal format",
     "prompt": "Lightning deal ad. Dark blue background with electric yellow accent lines. A smart speaker device. Text: 'LIGHTNING DEAL' in electric yellow, 'SAVE 45%' in huge white numbers, 'Today Only — While Supplies Last' in smaller text, progress bar showing '73% Claimed' in yellow. Amazon Prime Day energy."},
    {"id": "free_shipping", "cat": "sale", "name": "Free Shipping", "desc": "Free shipping promotion",
     "prompt": "Free shipping ad. Clean white background with a delivery truck illustration and a package. Text: 'FREE SHIPPING' in bold navy blue, 'On Every Order — No Minimum' in clean sans-serif, 'For a Limited Time' in a green banner, 'SHOP NOW' blue CTA button. Clean, trustworthy, simple."},
    {"id": "bundle_deal", "cat": "sale", "name": "Bundle Deal", "desc": "Product bundle offer",
     "prompt": "Bundle deal ad. Warm cream background. Three skincare bottles arranged together with a gift ribbon. Text: 'THE COMPLETE SET' in elegant serif, 'Save 40% vs. Buying Separately' in bold, '$89 Value — Yours for $49.99' with strikethrough pricing, 'Limited Edition Bundle' in a badge. Premium value."},
    {"id": "last_chance", "cat": "sale", "name": "Last Chance", "desc": "Urgency-driven closing",
     "prompt": "Last chance ad. Black background with red gradient glow. An alarm clock and a product. Text: 'LAST CHANCE' in huge bold red, 'SALE ENDS TONIGHT' in white, 'Don't Miss Out' in italic, countdown showing '03:42:18' in digital font, 'SHOP BEFORE MIDNIGHT' in a red banner. Maximum urgency."},
    {"id": "vip_access", "cat": "sale", "name": "VIP Early Access", "desc": "Exclusive early access",
     "prompt": "VIP access ad. Dark charcoal with gold accents and a velvet texture. A luxury perfume bottle. Text: 'VIP EARLY ACCESS' in gold metallic serif, 'Sale Starts 24 Hours Before Everyone Else' in white, 'Exclusive for Members Only' in italic gold, 'JOIN FREE' gold CTA button. Exclusive, luxury."},
    {"id": "refer_friend", "cat": "sale", "name": "Refer a Friend", "desc": "Referral program promo",
     "prompt": "Referral ad. Bright gradient (purple to blue). Two gift boxes connected by a ribbon. Text: 'GIVE $20, GET $20' in bold white, 'Share the Love' in lighter weight, 'Refer a Friend & You Both Save' in clean text, 'Your Unique Link Inside' in a rounded button. Social, friendly, rewarding."},

    # ═══ PRODUCT LAUNCH (15) ═══
    {"id": "new_arrival", "cat": "launch", "name": "New Arrival", "desc": "Elegant product launch",
     "prompt": "New arrival ad. Cream/beige marble surface with soft window light. A leather handbag centered. Text: 'NEW ARRIVAL' in thin elegant serif, 'The Sienna Collection' in script, 'Handcrafted Italian Leather' in small caps, 'SHOP NOW | Free Returns' at bottom bar. Luxury editorial."},
    {"id": "coming_soon", "cat": "launch", "name": "Coming Soon", "desc": "Teaser announcement",
     "prompt": "Coming soon teaser ad. Dark minimalist background with a single spotlight. Product silhouette partially revealed. Text: 'COMING SOON' in thin tall white letters, 'Something Extraordinary' in subtle italic, 'Be the First to Know' in small text, 'JOIN THE WAITLIST' CTA button with glow. Mysterious, anticipatory."},
    {"id": "just_dropped", "cat": "launch", "name": "Just Dropped", "desc": "Street-style drop",
     "prompt": "Product drop ad. Concrete/urban texture background. Fresh sneakers with dramatic lighting. Text: 'JUST DROPPED' in bold distressed street-style font, 'Limited Run — 500 Units' in clean white, 'First Come, First Served' in yellow, 'SHOP THE DROP' button. Streetwear, hype energy."},
    {"id": "preorder", "cat": "launch", "name": "Pre-Order", "desc": "Pre-order now available",
     "prompt": "Pre-order ad. Gradient from midnight blue to teal. A sleek gadget with soft glow. Text: 'PRE-ORDER NOW' in clean bold white, 'Be Among the First' in lighter text, 'Ships March 2026' in a subtle badge, 'RESERVE YOURS — $0 Down' CTA. Tech-forward, anticipatory."},
    {"id": "limited_edition", "cat": "launch", "name": "Limited Edition", "desc": "Scarcity-driven exclusivity",
     "prompt": "Limited edition ad. Black background with holographic rainbow foil accents. A premium watch with serial number visible. Text: 'LIMITED EDITION' in holographic metallic, 'Only 200 Made' in white, '#047/200' in a badge, 'Once They're Gone, They're Gone' in italic. Ultra-exclusive."},
    {"id": "collection_launch", "cat": "launch", "name": "Collection Launch", "desc": "Full collection reveal",
     "prompt": "Collection launch ad. Soft neutral linen background. Four products arranged in a styled grid. Text: 'THE SPRING COLLECTION' in elegant serif, 'Five New Designs' in clean sans-serif, 'Inspired by the Mediterranean Coast' in italic, 'EXPLORE THE COLLECTION' CTA. Editorial, curated."},

    # ═══ LIFESTYLE & SEASONAL (15) ═══
    {"id": "seasonal", "cat": "lifestyle", "name": "Seasonal Summer", "desc": "Vibrant summer lifestyle",
     "prompt": "Summer lifestyle ad. Bright turquoise background with flat lay items: sunglasses, sunscreen, straw hat, tropical drink. Text: 'SUMMER ESSENTIALS' in bold white, 'Save 30% This Weekend' in coral ribbon, 'Use Code: SUN30' in rounded badge, 'shopbright.com'. Beach-party energy."},
    {"id": "cozy_winter", "cat": "lifestyle", "name": "Cozy Winter", "desc": "Warm winter hygge",
     "prompt": "Cozy winter lifestyle ad. Warm interior scene with a blanket, hot cocoa, candle, and book by a window with snow outside. Text: 'COZY SEASON IS HERE' in warm serif, 'Everything You Need to Hibernate' in lighter text, 'Shop Warmth — 20% Off' in a cozy badge. Hygge, warm, inviting."},
    {"id": "outdoor_adventure", "cat": "lifestyle", "name": "Outdoor Adventure", "desc": "Rugged outdoor lifestyle",
     "prompt": "Outdoor adventure ad. Mountain landscape at golden hour. Hiking boots and a backpack on a rocky ledge. Text: 'BUILT FOR THE WILD' in bold condensed white, 'Adventure-Ready Gear' in lighter weight, '40% Off Outdoor Essentials' in a green banner, 'EXPLORE NOW'. Rugged, aspirational."},
    {"id": "home_kitchen", "cat": "lifestyle", "name": "Home & Kitchen", "desc": "Warm kitchen lifestyle",
     "prompt": "Home kitchen lifestyle ad. Bright modern kitchen with marble countertops and morning sunlight. Fresh ingredients and cookware. Text: 'KITCHEN ESSENTIALS' in clean serif, 'Cook Like a Pro' in script, '25% Off Your First Order' in a warm banner, 'Free Shipping Over $35'. Warm, aspirational."},
    {"id": "fitness_energy", "cat": "lifestyle", "name": "Fitness & Energy", "desc": "High-energy fitness",
     "prompt": "Fitness lifestyle ad. Dynamic shot of dumbbells and protein shaker on a gym floor with dramatic side lighting. Text: 'CRUSH YOUR GOALS' in bold condensed white, 'Performance Nutrition' in accent color, '30-Day Money-Back Guarantee' in smaller text, 'START TODAY' neon green CTA. High energy."},
    {"id": "wellness_calm", "cat": "lifestyle", "name": "Wellness & Calm", "desc": "Peaceful wellness aesthetic",
     "prompt": "Wellness ad. Soft gradient (sage green to cream). Minimalist arrangement: a jade roller, essential oil bottle, eucalyptus sprigs on white linen. Text: 'SELF CARE RITUAL' in thin elegant serif, 'Nourish Your Mind & Body' in script, '15% Off Wellness Kits' in a soft badge. Calm, zen, minimal."},
    {"id": "pet_love", "cat": "lifestyle", "name": "Pet Lovers", "desc": "Heartwarming pet lifestyle",
     "prompt": "Pet lifestyle ad. Warm home setting with a golden retriever happily sitting next to premium dog food bowl. Text: 'BECAUSE THEY DESERVE THE BEST' in warm serif, 'All-Natural Dog Food' in clean text, 'First Bag 50% Off' in a paw-print badge, 'Vet Recommended'. Heartwarming, trust."},
    {"id": "baby_nursery", "cat": "lifestyle", "name": "Baby & Nursery", "desc": "Soft baby/parenting",
     "prompt": "Baby nursery ad. Soft pastel nursery setting (mint and blush). A cute baby blanket and wooden toys. Text: 'LITTLE ONES COLLECTION' in gentle rounded serif, '100% Organic Cotton' in clean text, 'Safe for Sensitive Skin' with a leaf icon, '20% Off Newborn Essentials'. Gentle, safe, loving."},
    {"id": "travel_wanderlust", "cat": "lifestyle", "name": "Travel & Wanderlust", "desc": "Aspirational travel",
     "prompt": "Travel lifestyle ad. Split image: passport and suitcase on left, tropical beach on right. Golden light. Text: 'TRAVEL ESSENTIALS' in condensed white, 'Pack Light. Go Far.' in italic, 'Everything Under $50' in a badge, 'Adventure Awaits' at bottom. Wanderlust, freedom."},
    {"id": "date_night", "cat": "lifestyle", "name": "Date Night", "desc": "Romantic evening aesthetic",
     "prompt": "Date night ad. Moody restaurant setting with candlelight, wine glasses, and a small gift box. Text: 'DATE NIGHT READY' in elegant thin serif, 'Gifts That Impress' in script, 'Under $75 — Free Gift Wrap' in a burgundy banner, 'Shop the Collection'. Romantic, sophisticated."},

    # ═══ PREMIUM & LUXURY (10) ═══
    {"id": "premium", "cat": "luxury", "name": "Premium Lifestyle", "desc": "Moody luxury aesthetic",
     "prompt": "Premium lifestyle ad. Dark rustic wood table with warm left-side lighting. Artisan charcuterie board with cheeses and meats. Text: 'TASTE THE DIFFERENCE' in gold serif, 'Artisan Gift Boxes from $49' in white, 'Perfect for Holiday Gifting' in italic, 'Order by Dec 15' bottom banner. Rich, sophisticated."},
    {"id": "luxury_gold", "cat": "luxury", "name": "Luxury Gold", "desc": "Gold and black opulence",
     "prompt": "Luxury ad. Pure black background with gold leaf accents and subtle sparkle. A premium perfume bottle. Text: 'PURE LUXURY' in thin gold serif with wide letter-spacing, 'The Art of Fragrance' in white italic, 'Limited Signature Edition' in gold, 'Complimentary Engraving' in a gold line. Ultra-premium."},
    {"id": "artisan_craft", "cat": "luxury", "name": "Artisan Craft", "desc": "Handmade artisan quality",
     "prompt": "Artisan craft ad. Warm workshop setting with natural wood and leather. Hand-stitched leather wallet on workbench with tools. Text: 'HANDCRAFTED WITH CARE' in rustic serif, 'Made by Hand in Portland, OR' in lighter text, 'Each Piece Takes 8 Hours' in italic, 'Shop Artisan'. Authentic, craft."},
    {"id": "heritage_brand", "cat": "luxury", "name": "Heritage Brand", "desc": "Timeless heritage feel",
     "prompt": "Heritage brand ad. Vintage-tinted warm tones. Classic leather briefcase with aged patina on a mahogany desk. Text: 'SINCE 1952' in thin serif, 'Quality That Lasts Generations' in classic type, 'Lifetime Warranty' in a crest-style badge, 'Shop the Heritage Collection'. Timeless, trustworthy."},
    {"id": "minimalist_luxury", "cat": "luxury", "name": "Minimalist Luxury", "desc": "Clean high-end minimal",
     "prompt": "Minimalist luxury ad. Pure white background with one small accent of blush pink. A single elegant ceramic vase. Text: 'LESS IS MORE' in ultra-thin sans-serif with extreme letter-spacing, 'Curated Home Objects' in small caps, 'From $89' in the lightest weight. Maximum negative space. Museum gallery feel."},

    # ═══ SOCIAL MEDIA FORMATS (15) ═══
    {"id": "instagram_carousel", "cat": "social", "name": "Carousel Slide", "desc": "Instagram carousel card",
     "prompt": "Instagram carousel slide ad. Clean white background with accent color (coral). A skincare routine set of 3 products. Text: 'YOUR 3-STEP ROUTINE' in bold, 'Swipe to Learn More →' at bottom in coral, step number '01' in large light text background, product name centered. Instagram native, swipeable."},
    {"id": "testimonial", "cat": "social", "name": "Customer Review", "desc": "Social proof testimonial",
     "prompt": "Customer testimonial ad. Soft blush pink background. Five gold stars at top. Large quotation marks. Text: '\"This changed my skincare routine completely. My skin has never looked better.\"' in elegant font, '— Sarah M., Verified Buyer' below, product image small in corner, '4.9/5 from 12,000+ Reviews'. Trust, social proof."},
    {"id": "before_after", "cat": "social", "name": "Before & After", "desc": "Transformation comparison",
     "prompt": "Before and after comparison ad. Split screen with clean dividing line. Left side: dull, messy desk labeled 'BEFORE'. Right side: organized, clean desk with premium organizer labeled 'AFTER'. Text at top: 'THE DIFFERENCE IS CLEAR' in bold. Product name and '30% Off' at bottom. Clean, persuasive."},
    {"id": "unboxing", "cat": "social", "name": "Unboxing Experience", "desc": "Premium unboxing moment",
     "prompt": "Unboxing experience ad. Overhead view of a beautiful product box being opened, tissue paper, thank-you card visible. Premium product nestled inside. Text: 'THE UNBOXING EXPERIENCE' in clean serif, 'Every Detail Matters' in italic, 'Free Premium Packaging on All Orders' at bottom. Satisfying, premium."},
    {"id": "how_to", "cat": "social", "name": "How-To / Tutorial", "desc": "Step-by-step tutorial",
     "prompt": "How-to tutorial ad. Clean layout with numbered steps: '01 02 03' in large light background numbers. Three circular images showing product usage steps. Text: 'HOW TO USE' in bold at top, step descriptions in clean sans-serif, 'Watch the Full Tutorial' CTA at bottom, 'Takes Just 2 Minutes'. Educational."},
    {"id": "giveaway", "cat": "social", "name": "Giveaway / Contest", "desc": "Social giveaway promotion",
     "prompt": "Giveaway ad. Vibrant gradient (purple to pink) with confetti and sparkle effects. A prize bundle of products. Text: 'GIVEAWAY!' in huge bold white, 'WIN THIS $250 BUNDLE' in yellow, rules: 'Follow + Like + Tag 2 Friends' in clean text, 'Winner Announced Friday' in a badge. Exciting, social."},
    {"id": "user_generated", "cat": "social", "name": "UGC Style", "desc": "Authentic user-generated feel",
     "prompt": "User-generated content style ad. Slightly imperfect, authentic photo feel. Someone holding a coffee mug at a cafe, natural lighting, slightly warm filter. Text overlay in casual handwritten style: 'my new favorite thing ♡', small product tag in corner, 'As seen on @username' at bottom. Authentic, relatable."},
    {"id": "poll_engagement", "cat": "social", "name": "Poll / Quiz", "desc": "Interactive engagement post",
     "prompt": "Poll engagement ad. Split down middle: left side shows product in Color A (blue), right side shows same product in Color B (blush). Text: 'WHICH COLOR ARE YOU?' in bold at top, 'OCEAN BLUE' and 'BLUSH PINK' labels on each side, 'Vote in Stories' at bottom, brand logo small. Interactive, fun."},
    {"id": "countdown", "cat": "social", "name": "Countdown Timer", "desc": "Launch countdown",
     "prompt": "Countdown ad. Dark sleek background. Large digital countdown display showing '02 : 14 : 59 : 33' (days, hours, minutes, seconds). Product silhouette behind the numbers. Text: 'LAUNCHING IN' at top in clean white, product name below countdown, 'SET YOUR REMINDER' CTA. Anticipation, hype."},

    # ═══ INDUSTRY SPECIFIC (15) ═══
    {"id": "food_drink", "cat": "industry", "name": "Food & Beverage", "desc": "Appetizing food brand",
     "prompt": "Food brand ad. Overhead shot of beautifully plated pasta with fresh basil, parmesan, and olive oil on a rustic ceramic plate. Text: 'MANGIA BENE' in elegant Italian serif, 'Authentic Italian Sauces' in clean font, 'Made with San Marzano Tomatoes' in italic, 'Order Online — Ships Fresh'. Appetizing."},
    {"id": "beauty_skincare", "cat": "industry", "name": "Beauty & Skincare", "desc": "Clean beauty aesthetic",
     "prompt": "Beauty skincare ad. Soft pink gradient with water droplets texture. A glass serum bottle with golden liquid. Text: 'GLOW FROM WITHIN' in thin elegant font, '20% Vitamin C + Hyaluronic Acid' in clean text, 'Visible Results in 14 Days' in italic, 'Dermatologist Recommended' badge. Clean beauty."},
    {"id": "tech_gadget", "cat": "industry", "name": "Tech & Gadgets", "desc": "Modern tech product",
     "prompt": "Tech gadget ad. Dark gradient (deep gray to black). A smartwatch floating with holographic UI elements around it. Text: 'NEXT-GEN WEARABLE' in bold condensed white, '72-Hour Battery | GPS | Health Tracking' in accent blue, 'Starting at $199' in clean text, 'PRE-ORDER NOW' bright button. Futuristic."},
    {"id": "fashion_apparel", "cat": "industry", "name": "Fashion & Apparel", "desc": "Editorial fashion",
     "prompt": "Fashion editorial ad. A model silhouette against a sunset gradient (warm peach to mauve). Flowing dress fabric caught in motion. Text: 'THE NEW SILHOUETTE' in ultra-thin wide-tracked serif, 'Fall/Winter 2026' in small caps, 'Free Express Shipping' at bottom. Vogue-inspired, editorial."},
    {"id": "home_decor", "cat": "industry", "name": "Home Decor", "desc": "Interior design aesthetic",
     "prompt": "Home decor ad. Beautiful Scandinavian living room with a statement pendant lamp, minimalist sofa, and plants. Text: 'DESIGN YOUR SPACE' in clean modern sans-serif, 'Curated Home Furnishings' in lighter weight, 'Up to 40% Off Living Room' in a sage green banner, 'Free Design Consultation'. Aspirational interior."},
    {"id": "jewelry", "cat": "industry", "name": "Jewelry", "desc": "Elegant jewelry closeup",
     "prompt": "Jewelry ad. Extreme close-up of a delicate gold necklace with a small diamond pendant on a soft velvet surface. Soft dreamy lighting. Text: 'FOREVER YOURS' in thin elegant serif, '14K Solid Gold' in small caps, 'Personalize with Your Initial' in italic, 'From $79 | Free Engraving'. Intimate, precious."},
    {"id": "kids_toys", "cat": "industry", "name": "Kids & Toys", "desc": "Colorful kids product",
     "prompt": "Kids toys ad. Bright rainbow gradient background with playful scattered stars and shapes. Wooden educational toy blocks. Text: 'PLAY & LEARN' in fun rounded bold font, 'Educational Toys for Ages 2-6' in clean text, 'Screen-Free Fun!' in a star badge, '20% Off First Order' in bright button. Joyful, colorful."},
    {"id": "sports_outdoor", "cat": "industry", "name": "Sports & Outdoor", "desc": "Athletic action shot",
     "prompt": "Sports ad. Dynamic action-blur background of a trail. Running shoes with dirt splash frozen in motion. Text: 'RUN FURTHER' in bold italic white, 'All-Terrain Trail Runners' in clean text, 'Grip That Never Quits' in accent text, 'Shop Men's & Women's' CTA. Dynamic, athletic, powerful."},
    {"id": "books_education", "cat": "industry", "name": "Books & Education", "desc": "Intellectual aesthetic",
     "prompt": "Books/education ad. Warm reading nook with stacked books, reading glasses, and a cup of tea. Warm afternoon light. Text: 'READ MORE THIS YEAR' in classic serif, 'Bestsellers from $9.99' in clean text, 'Free Bookmark with Every Order' in a bookmark-shaped badge, 'Join Our Book Club'. Intellectual, cozy."},
    {"id": "automotive", "cat": "industry", "name": "Automotive", "desc": "Bold automotive accessories",
     "prompt": "Automotive accessories ad. Dark asphalt background with dramatic under-lighting. Premium car phone mount and dash cam. Text: 'DRIVE SMARTER' in bold condensed chrome-effect font, 'Premium Car Accessories' in white, 'Fits All Vehicles' in smaller text, '30% Off Bundles' in a racing stripe banner. Bold, masculine."},
    {"id": "garden_plant", "cat": "industry", "name": "Garden & Plants", "desc": "Green botanical aesthetic",
     "prompt": "Garden/plant ad. Lush green botanical background with monstera leaves and ferns. A beautiful ceramic planter with a trailing pothos plant. Text: 'BRING THE OUTSIDE IN' in botanical serif with leaf accents, 'Indoor Plants Delivered' in clean text, 'Arrives in 2 Days — Guaranteed Alive' in green badge. Fresh, botanical."},

    # ═══ CAMPAIGN CONCEPTS (10) ═══
    {"id": "bestseller", "cat": "campaign", "name": "Bestseller Badge", "desc": "Social proof bestseller",
     "prompt": "Bestseller ad. Clean white background with a gold '#1 BESTSELLER' ribbon across the top corner. A premium water bottle centered. Text: 'THERE'S A REASON IT'S #1' in bold, '50,000+ Sold' in accent color, '4.9★ (8,200 Reviews)' with stars, 'See What Everyone's Talking About' CTA. Social proof, trust."},
    {"id": "back_in_stock", "cat": "campaign", "name": "Back in Stock", "desc": "Restock announcement",
     "prompt": "Back in stock ad. Soft gradient background with spotlight effect. A popular product with a 'SOLD OUT' tag being replaced by 'BACK IN STOCK' tag. Text: 'IT'S BACK!' in bold, 'Back In Stock — Limited Quantities' in clean text, 'Sold Out 3x — Don't Miss It Again' in smaller text, 'SHOP NOW' urgent CTA. Excitement, scarcity."},
    {"id": "gift_guide", "cat": "campaign", "name": "Gift Guide", "desc": "Curated gift guide",
     "prompt": "Gift guide ad. Warm festive background with subtle bokeh. Four gift items arranged in a grid layout, each in its own box. Text: 'GIFT GUIDE 2026' in elegant serif, 'Perfect Presents for Everyone' in script, 'Under $25 | Under $50 | Under $100' in three neat badges, 'Free Gift Wrapping'. Curated, helpful."},
    {"id": "subscribe_save", "cat": "campaign", "name": "Subscribe & Save", "desc": "Subscription model promo",
     "prompt": "Subscribe and save ad. Clean gradient (blue to teal). A product with recurring delivery box. Text: 'SUBSCRIBE & SAVE 20%' in bold white, 'Never Run Out Again' in lighter weight, 'Free Delivery Every Month' with a calendar icon, 'Cancel Anytime — No Commitment' at bottom, 'START SAVING' CTA. Convenient, value."},
    {"id": "award_winner", "cat": "campaign", "name": "Award Winner", "desc": "Award-winning product",
     "prompt": "Award winner ad. Elegant cream background with a gold award seal/badge prominently displayed. A skincare product next to the award. Text: 'AWARD-WINNING' in gold serif, '2026 Beauty Innovation Award' in clean text, 'As Featured in Vogue, Allure & Elle' with publication logos, 'See Why Experts Choose Us'. Authority, prestige."},
    {"id": "early_bird", "cat": "campaign", "name": "Early Bird", "desc": "Early access pricing",
     "prompt": "Early bird ad. Sunrise gradient (warm orange to soft yellow). A bird silhouette and a product. Text: 'EARLY BIRD SPECIAL' in warm bold font, 'First 100 Orders Get 40% Off' in white, 'Price Goes Up at Midnight' in urgency text, 'Be First — Save Most' in a sun-shaped badge. Warm, exclusive."},

    # ═══ APP & TECH (5) ═══
    {"id": "app_download", "cat": "tech", "name": "App Download", "desc": "Modern dark tech-forward",
     "prompt": "App download ad. Dark gradient from deep purple to black. Glowing smartphone mockup with workout tracking interface. Dynamic energy lines and particles. Text: 'YOUR BODY. YOUR PLAN.' in bold white condensed, 'AI-Powered Personal Training' in gradient text (blue to purple), 'Join 850,000+ Members' with 5 stars, 'Download Free — No Credit Card' green CTA button. Nike Training Club energy."},
    {"id": "saas_tool", "cat": "tech", "name": "SaaS Platform", "desc": "B2B software dashboard",
     "prompt": "SaaS platform ad. Dark UI background showing a clean analytics dashboard with charts and metrics. Slight glow on key numbers. Text: 'STOP GUESSING. START KNOWING.' in bold white, 'Real-Time Analytics for Your Business' in accent blue, 'Trusted by 4,200+ Teams' in smaller text, '14-Day Free Trial' green button. B2B, professional."},
    {"id": "online_course", "cat": "tech", "name": "Online Course", "desc": "E-learning platform",
     "prompt": "Online course ad. Gradient (dark navy to blue). A laptop showing a video lesson interface. Text: 'MASTER NEW SKILLS' in bold white, 'Python, Data Science & AI — All in One Course' in accent text, 'Certificate on Completion' with a diploma icon, 'Enroll Free — Start Today' yellow CTA. Educational, ambitious."},
    {"id": "crypto_fintech", "cat": "tech", "name": "Fintech / Crypto", "desc": "Modern fintech aesthetic",
     "prompt": "Fintech ad. Dark background with neon green accent lines and subtle grid. A phone showing a clean banking/portfolio interface. Text: 'YOUR MONEY. SIMPLIFIED.' in clean bold white, 'Zero Fees. Instant Transfers.' in neon green, 'Join 2M+ Users' in white, 'Get Started in 60 Seconds' CTA. Modern, trust."},
    {"id": "podcast_launch", "cat": "tech", "name": "Podcast / Media", "desc": "Audio content promotion",
     "prompt": "Podcast ad. Deep warm gradient (burgundy to dark purple). A microphone with sound wave visualization. Text: 'NEW EPISODES WEEKLY' in bold condensed white, 'The Business Growth Show' in clean serif, '#1 in Business on Apple Podcasts' with a ranking badge, 'Listen Free on All Platforms' at bottom. Audio, professional."},
]

async def generate_one(client: httpx.AsyncClient, template: dict, semaphore: asyncio.Semaphore) -> dict:
    async with semaphore:
        filepath = os.path.join(OUT, f"{template['id']}.png")

        # Skip if already exists
        if os.path.exists(filepath) and os.path.getsize(filepath) > 10000:
            return {"id": template["id"], "status": "skipped"}

        try:
            resp = await client.post(
                URL,
                headers=HEADERS,
                json={
                    "model": "grok-imagine-image",
                    "prompt": template["prompt"],
                    "n": 1,
                    "response_format": "b64_json",
                },
            )

            if resp.status_code != 200:
                return {"id": template["id"], "status": "fail", "error": resp.text[:100]}

            data = resp.json()
            b64 = data["data"][0]["b64_json"]
            img = base64.b64decode(b64)

            with open(filepath, "wb") as f:
                f.write(img)

            return {"id": template["id"], "status": "ok", "size_kb": round(len(img) / 1024, 1)}

        except Exception as e:
            return {"id": template["id"], "status": "error", "error": str(e)[:100]}


async def main():
    print(f"Generating {len(TEMPLATES)} templates...", flush=True)
    print(f"Output: {OUT}", flush=True)
    print(f"Concurrency: 5 parallel requests", flush=True)
    start = time.time()

    semaphore = asyncio.Semaphore(5)
    results = []

    async with httpx.AsyncClient(timeout=60.0) as client:
        tasks = [generate_one(client, t, semaphore) for t in TEMPLATES]
        for i, coro in enumerate(asyncio.as_completed(tasks)):
            result = await coro
            results.append(result)
            status = result["status"]
            tid = result["id"]
            extra = f" ({result.get('size_kb', '')}KB)" if status == "ok" else f" {result.get('error', '')}" if status != "skipped" else ""
            print(f"  [{len(results)}/{len(TEMPLATES)}] {tid:<25s} {status}{extra}", flush=True)

    elapsed = round(time.time() - start, 1)
    ok = sum(1 for r in results if r["status"] == "ok")
    skipped = sum(1 for r in results if r["status"] == "skipped")
    failed = sum(1 for r in results if r["status"] in ("fail", "error"))
    print(f"\nDone in {elapsed}s: {ok} generated, {skipped} skipped, {failed} failed", flush=True)

    # Save template manifest
    manifest = []
    for t in TEMPLATES:
        manifest.append({
            "id": t["id"],
            "category": t["cat"],
            "name": t["name"],
            "description": t["desc"],
            "preview": f"/templates/{t['id']}.png",
        })

    manifest_path = os.path.join(OUT, "..", "..", "src", "lib", "creative-templates.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"Manifest saved: {manifest_path} ({len(manifest)} templates)", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
