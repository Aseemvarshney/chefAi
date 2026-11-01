import json
import random
import re
from typing import Optional
from app.config import settings

# ─── Try to import Gemini ────────────────────────────────────────────────────
_gemini_client = None
_gemini_model = None
GEMINI_AVAILABLE = False

try:
    import google.genai as genai
    if settings.GEMINI_API_KEY:
        _gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        GEMINI_AVAILABLE = True
except ImportError:
    try:
        import google.generativeai as genai_legacy
        if settings.GEMINI_API_KEY:
            genai_legacy.configure(api_key=settings.GEMINI_API_KEY)
            _gemini_model = genai_legacy.GenerativeModel("gemini-1.5-flash")
            GEMINI_AVAILABLE = True
    except ImportError:
        GEMINI_AVAILABLE = False


def _call_gemini(prompt: str) -> str:
    """Helper to generate content using whichever Gemini client is available."""
    if _gemini_client:
        response = _gemini_client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
        )
        return response.text.strip() if response and response.text else ""
    elif _gemini_model:
        response = _gemini_model.generate_content(prompt)
        return response.text.strip() if response and response.text else ""
    raise RuntimeError("Gemini client/model is not initialized")


def _extract_json(text: str):
    """Safely extract and parse JSON from Gemini text output."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    return json.loads(text)

# ─── Mock Recipe Database ────────────────────────────────────────────────────

MOCK_RECIPES = {
    "chicken biryani": {
        "name": "Chicken Biryani",
        "cuisine": "South Asian",
        "description": "A fragrant and flavorful rice dish layered with spiced chicken, aromatic basmati rice, and fried onions. A beloved classic from the Indian subcontinent.",
        "preparation_time": 30,
        "cooking_time": 60,
        "difficulty": "Medium",
        "tags": "rice,chicken,spicy,Indian",
        "ingredients": [
            {"name": "Basmati Rice", "quantity": 2.0, "unit": "cups"},
            {"name": "Chicken", "quantity": 750.0, "unit": "g"},
            {"name": "Onions", "quantity": 3.0, "unit": "medium"},
            {"name": "Yogurt", "quantity": 1.0, "unit": "cup"},
            {"name": "Tomatoes", "quantity": 2.0, "unit": "medium"},
            {"name": "Ginger-Garlic Paste", "quantity": 2.0, "unit": "tbsp"},
            {"name": "Biryani Masala", "quantity": 2.0, "unit": "tbsp"},
            {"name": "Turmeric", "quantity": 0.5, "unit": "tsp"},
            {"name": "Red Chili Powder", "quantity": 1.0, "unit": "tsp"},
            {"name": "Saffron", "quantity": 0.25, "unit": "tsp"},
            {"name": "Mint Leaves", "quantity": 0.5, "unit": "cup"},
            {"name": "Ghee", "quantity": 3.0, "unit": "tbsp"},
            {"name": "Salt", "quantity": 2.0, "unit": "tsp"},
            {"name": "Whole Spices (Bay leaf, Cinnamon, Cardamom, Cloves)", "quantity": 1.0, "unit": "set"}
        ],
        "instructions": json.dumps([
            "Wash and soak basmati rice for 30 minutes.",
            "Marinate chicken with yogurt, ginger-garlic paste, biryani masala, turmeric, red chili powder, and salt for at least 1 hour.",
            "Heat oil in a large heavy-bottomed pot. Fry sliced onions until golden brown. Remove half for garnish.",
            "In the same oil, add whole spices and cook for 1 minute.",
            "Add marinated chicken and cook on medium heat for 20 minutes until chicken is almost cooked.",
            "Parboil rice with salt and whole spices until 70% done. Drain.",
            "Layer the rice over the chicken. Add saffron water, mint leaves, fried onions, and ghee.",
            "Seal the pot with foil or dough. Cook on low heat (dum) for 25 minutes.",
            "Gently mix before serving. Garnish with fried onions and mint leaves."
        ]),
        "nutrition": {
            "calories": 650.0, "protein": 42.0, "carbohydrates": 75.0,
            "fat": 18.0, "fiber": 3.0, "sugar": 4.0, "sodium": 820.0,
            "vitamins": '{"Vitamin A": "12%", "Vitamin C": "8%", "Iron": "25%", "Calcium": "10%"}'
        }
    },
    "pasta": {
        "name": "Classic Spaghetti Carbonara",
        "cuisine": "Italian",
        "description": "A rich and creamy Roman pasta dish made with eggs, Pecorino Romano cheese, guanciale, and black pepper. Simple ingredients, extraordinary flavor.",
        "preparation_time": 10,
        "cooking_time": 20,
        "difficulty": "Easy",
        "tags": "pasta,Italian,creamy,quick",
        "ingredients": [
            {"name": "Spaghetti", "quantity": 400.0, "unit": "g"},
            {"name": "Guanciale or Bacon", "quantity": 200.0, "unit": "g"},
            {"name": "Eggs", "quantity": 4.0, "unit": "whole"},
            {"name": "Egg Yolks", "quantity": 2.0, "unit": ""},
            {"name": "Pecorino Romano", "quantity": 100.0, "unit": "g"},
            {"name": "Black Pepper", "quantity": 2.0, "unit": "tsp"},
            {"name": "Salt", "quantity": 1.0, "unit": "tsp"},
            {"name": "Pasta Water", "quantity": 1.0, "unit": "cup"}
        ],
        "instructions": json.dumps([
            "Cook spaghetti in heavily salted boiling water until al dente. Reserve 1 cup pasta water.",
            "Meanwhile, cook guanciale/bacon in a pan until crispy. Remove from heat.",
            "Whisk eggs, yolks, and finely grated Pecorino Romano with black pepper in a bowl.",
            "Drain pasta and immediately add to the pan with guanciale (off heat).",
            "Quickly add egg-cheese mixture, tossing vigorously while adding pasta water gradually to create a silky cream.",
            "Season with more black pepper and serve immediately with extra Pecorino."
        ]),
        "nutrition": {
            "calories": 520.0, "protein": 28.0, "carbohydrates": 62.0,
            "fat": 18.0, "fiber": 3.0, "sugar": 2.0, "sodium": 680.0,
            "vitamins": '{"Vitamin B12": "35%", "Iron": "15%", "Calcium": "20%"}'
        }
    },
    "default": {
        "name": "{dish_name}",
        "cuisine": "International",
        "description": "A delicious and carefully crafted dish prepared with fresh ingredients and traditional cooking techniques.",
        "preparation_time": 20,
        "cooking_time": 35,
        "difficulty": "Medium",
        "tags": "homemade,fresh,delicious",
        "ingredients": [
            {"name": "Main Ingredient", "quantity": 500.0, "unit": "g"},
            {"name": "Onion", "quantity": 2.0, "unit": "medium"},
            {"name": "Garlic", "quantity": 4.0, "unit": "cloves"},
            {"name": "Tomatoes", "quantity": 3.0, "unit": "medium"},
            {"name": "Oil", "quantity": 3.0, "unit": "tbsp"},
            {"name": "Salt", "quantity": 1.5, "unit": "tsp"},
            {"name": "Black Pepper", "quantity": 0.5, "unit": "tsp"},
            {"name": "Mixed Herbs", "quantity": 1.0, "unit": "tsp"},
            {"name": "Water / Broth", "quantity": 2.0, "unit": "cups"}
        ],
        "instructions": json.dumps([
            "Prepare and chop all vegetables and ingredients.",
            "Heat oil in a pan over medium heat.",
            "Sauté onions until translucent, about 5 minutes.",
            "Add garlic and cook for 1 more minute.",
            "Add the main ingredient and cook until browned.",
            "Add tomatoes, spices, and broth. Stir well.",
            "Cover and simmer on low heat for 25 minutes.",
            "Adjust seasoning to taste.",
            "Serve hot with your choice of side dish."
        ]),
        "nutrition": {
            "calories": 380.0, "protein": 22.0, "carbohydrates": 35.0,
            "fat": 14.0, "fiber": 4.0, "sugar": 5.0, "sodium": 560.0,
            "vitamins": '{"Vitamin C": "20%", "Iron": "18%", "Calcium": "8%"}'
        }
    }
}

SUBSTITUTIONS = {
    "butter": ["Olive Oil (3/4 the amount)", "Coconut Oil (same amount)", "Vegetable Oil (3/4 amount)", "Avocado (mashed, same amount)"],
    "cream": ["Milk + Corn Flour (1 cup milk + 2 tbsp flour)", "Coconut Cream", "Greek Yogurt (thinned)", "Silken Tofu (blended)"],
    "eggs": ["Flax Egg (1 tbsp flaxseed + 3 tbsp water)", "Banana (1/2 mashed)", "Applesauce (1/4 cup)", "Chia Egg"],
    "milk": ["Almond Milk", "Oat Milk", "Soy Milk", "Coconut Milk"],
    "sugar": ["Honey (3/4 amount)", "Maple Syrup (3/4 amount)", "Stevia", "Coconut Sugar"],
    "flour": ["Almond Flour (1:1)", "Oat Flour (1:1)", "Coconut Flour (1/4 amount)", "Rice Flour (1:1)"],
    "oil": ["Butter (same amount)", "Applesauce (for baking)", "Greek Yogurt (for baking)", "Avocado Oil"],
    "salt": ["Soy Sauce (reduce other liquids)", "Miso Paste", "Celery Seeds", "Nutritional Yeast"],
}

FRIDGE_RECIPES = {
    frozenset(["tomato", "egg", "onion"]): "Shakshuka (Eggs in Tomato Sauce)",
    frozenset(["rice", "egg", "onion"]): "Egg Fried Rice",
    frozenset(["potato", "onion", "egg"]): "Spanish Omelette (Tortilla Española)",
    frozenset(["bread", "egg", "butter"]): "French Toast",
    frozenset(["pasta", "tomato", "garlic"]): "Pasta Arrabbiata",
    frozenset(["chicken", "garlic", "lemon"]): "Lemon Garlic Roasted Chicken",
    frozenset(["banana", "milk", "oats"]): "Banana Oat Smoothie",
}


def _scale_recipe(recipe: dict, servings: int) -> dict:
    """Scale ingredient quantities for the requested servings (base = 2)."""
    factor = servings / 2.0
    scaled = dict(recipe)
    scaled["servings"] = servings
    scaled["ingredients"] = [
        {**ing, "quantity": round(ing["quantity"] * factor, 2)}
        for ing in recipe["ingredients"]
    ]
    # Nutrition values represent per-serving metrics, so retain baseline per-serving values
    scaled["nutrition"] = dict(recipe["nutrition"])
    return scaled


# ─── Main AI Service Functions ───────────────────────────────────────────────

async def generate_recipe(dish_name: str, servings: int = 2) -> dict:
    """Generate a recipe using Gemini API or fall back to mock data."""
    if GEMINI_AVAILABLE:
        try:
            return await _gemini_generate_recipe(dish_name, servings)
        except Exception as e:
            print(f"[Gemini] Error: {e} — falling back to mock")

    return _mock_generate_recipe(dish_name, servings)


async def _gemini_generate_recipe(dish_name: str, servings: int) -> dict:
    prompt = f"""
    Generate a complete recipe for "{dish_name}" for {servings} servings.
    Return ONLY valid JSON with this exact structure:
    {{
      "name": "Full Recipe Name",
      "cuisine": "Cuisine Type",
      "description": "2-3 sentence description",
      "preparation_time": <minutes as int>,
      "cooking_time": <minutes as int>,
      "difficulty": "Easy|Medium|Hard",
      "servings": {servings},
      "tags": "comma,separated,tags",
      "ingredients": [
        {{"name": "Ingredient Name", "quantity": <number>, "unit": "unit"}}
      ],
      "instructions": ["Step 1...", "Step 2...", "Step 3..."],
      "nutrition": {{
        "calories": <per serving float>,
        "protein": <grams float>,
        "carbohydrates": <grams float>,
        "fat": <grams float>,
        "fiber": <grams float>,
        "sugar": <grams float>,
        "sodium": <mg float>,
        "vitamins": {{"Vitamin C": "X%", "Iron": "X%"}}
      }}
    }}
    """
    text = _call_gemini(prompt)
    data = _extract_json(text)
    data["instructions"] = json.dumps(data["instructions"])
    data["nutrition"]["vitamins"] = json.dumps(data["nutrition"].get("vitamins", {}))
    return data


def _mock_generate_recipe(dish_name: str, servings: int) -> dict:
    name_lower = dish_name.lower()
    # Find closest match
    recipe = None
    for key, val in MOCK_RECIPES.items():
        if key != "default" and key in name_lower:
            recipe = dict(val)
            break
    if not recipe:
        recipe = dict(MOCK_RECIPES["default"])
        recipe["name"] = dish_name.title()
        recipe["description"] = f"A delicious {dish_name} prepared with fresh ingredients."

    return _scale_recipe(recipe, servings)


async def get_ingredient_substitutions(ingredient: str, context: str = "") -> list:
    """Get substitution suggestions for an ingredient."""
    if GEMINI_AVAILABLE:
        try:
            return await _gemini_substitutions(ingredient, context)
        except Exception as e:
            print(f"[Gemini] Substitution error: {e}")

    # Mock substitutions
    ing_lower = ingredient.lower()
    for key, subs in SUBSTITUTIONS.items():
        if key in ing_lower:
            return subs
    return [
        f"Check your pantry for a similar {ingredient}",
        "Omit the ingredient if possible",
        "Search for a specific substitute online",
        "Ask your local grocery store for alternatives"
    ]


async def _gemini_substitutions(ingredient: str, context: str) -> list:
    prompt = f"""
    What are 4 best substitutes for "{ingredient}" in cooking?
    Context: {context if context else "general cooking"}
    Return ONLY a JSON array of strings, each being a substitution option with quantity notes.
    Example: ["Olive Oil (same amount)", "Coconut Oil (3/4 amount)"]
    """
    text = _call_gemini(prompt)
    return _extract_json(text)


async def get_fridge_suggestions(ingredients: list) -> list:
    """Suggest recipes based on available ingredients."""
    if GEMINI_AVAILABLE:
        try:
            return await _gemini_fridge_mode(ingredients)
        except Exception as e:
            print(f"[Gemini] Fridge mode error: {e}")

    # Mock fridge mode
    ing_set = frozenset(i.lower() for i in ingredients)
    suggestions = []
    for key_set, recipe_name in FRIDGE_RECIPES.items():
        if key_set & ing_set:
            suggestions.append({
                "name": recipe_name,
                "matching_ingredients": list(key_set & ing_set),
                "missing_ingredients": list(key_set - ing_set)
            })
    if not suggestions:
        suggestions = [
            {"name": "Simple Stir Fry", "matching_ingredients": ingredients[:2], "missing_ingredients": ["Soy sauce"]},
            {"name": "Mixed Vegetable Soup", "matching_ingredients": ingredients[:3], "missing_ingredients": ["Broth"]},
            {"name": "Improvised Salad", "matching_ingredients": ingredients, "missing_ingredients": ["Dressing"]}
        ]
    return suggestions[:5]


async def _gemini_fridge_mode(ingredients: list) -> list:
    prompt = f"""
    I have these ingredients: {", ".join(ingredients)}
    Suggest 5 recipes I can make with some or all of these ingredients.
    Return ONLY a JSON array with this structure:
    [{{
      "name": "Recipe Name",
      "matching_ingredients": ["ing1", "ing2"],
      "missing_ingredients": ["ing3"]
    }}]
    """
    text = _call_gemini(prompt)
    return _extract_json(text)


async def generate_meal_plan(plan_type: str, dietary_pref: str, calories: int, budget: str) -> dict:
    """Generate a structured meal plan."""
    if GEMINI_AVAILABLE:
        try:
            return await _gemini_meal_plan(plan_type, dietary_pref, calories, budget)
        except Exception as e:
            print(f"[Gemini] Meal plan error: {e}")

    return _mock_meal_plan(plan_type, dietary_pref, calories)


def _mock_meal_plan(plan_type: str, dietary_pref: str, calories: int) -> dict:
    days = {"daily": 1, "weekly": 7, "monthly": 30}.get(plan_type, 7)
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    meals = {
        "breakfast": ["Oatmeal with Fruits", "Scrambled Eggs on Toast", "Greek Yogurt Parfait", "Banana Smoothie", "Avocado Toast", "Pancakes", "Muesli with Milk"],
        "lunch": ["Grilled Chicken Salad", "Vegetable Rice Bowl", "Tuna Sandwich", "Lentil Soup", "Caesar Salad", "Pasta Primavera", "Quinoa Buddha Bowl"],
        "dinner": ["Baked Salmon with Veggies", "Chicken Curry with Rice", "Beef Stir Fry", "Vegetable Pasta", "Grilled Fish Tacos", "Mushroom Risotto", "Lamb Chops with Potatoes"],
        "snack": ["Apple with Peanut Butter", "Mixed Nuts", "Hummus with Carrot Sticks", "Protein Bar", "Cheese and Crackers", "Trail Mix", "Fresh Fruit Bowl"]
    }
    plan = {}
    for i in range(min(days, 7)):
        day = day_names[i]
        plan[day] = {
            "breakfast": {"meal": meals["breakfast"][i % 7], "calories": calories // 5},
            "lunch": {"meal": meals["lunch"][i % 7], "calories": calories // 3},
            "dinner": {"meal": meals["dinner"][i % 7], "calories": calories // 3},
            "snack": {"meal": meals["snack"][i % 7], "calories": calories // 10},
        }
    return {"plan_type": plan_type, "dietary_preference": dietary_pref, "daily_calories": calories, "plan": plan}


async def _gemini_meal_plan(plan_type: str, dietary_pref: str, calories: int, budget: str) -> dict:
    days = {"daily": 1, "weekly": 7, "monthly": 30}.get(plan_type, 7)
    prompt = f"""
    Create a {days}-day {dietary_pref if dietary_pref != 'none' else ''} meal plan.
    Daily calorie target: {calories} calories. Budget: {budget}.
    Return ONLY valid JSON:
    {{
      "plan_type": "{plan_type}",
      "dietary_preference": "{dietary_pref}",
      "daily_calories": {calories},
      "plan": {{
        "Day 1": {{
          "breakfast": {{"meal": "...", "calories": 400}},
          "lunch": {{"meal": "...", "calories": 600}},
          "dinner": {{"meal": "...", "calories": 700}},
          "snack": {{"meal": "...", "calories": 200}}
        }}
      }}
    }}
    """
    text = _call_gemini(prompt)
    return _extract_json(text)


async def get_recommendations(search_history: list = None, favorites: list = None, dietary_pref: str = "none") -> list:
    """Get personalized, dynamic recipe recommendations that vary every single time."""
    if GEMINI_AVAILABLE:
        try:
            prompt = f"""
            Suggest 6 unique, creative, and mouth-watering recipe recommendations for a user.
            User Dietary Preference: {dietary_pref}.
            Recent searches: {", ".join(search_history[:3]) if search_history else 'general cooking'}.
            Favorite dishes: {", ".join(favorites[:3]) if favorites else 'various cuisines'}.

            Return ONLY a JSON array of 6 objects with this exact structure:
            [
              {{
                "name": "Recipe Name",
                "cuisine": "Cuisine",
                "reason": "Fun 1-sentence personalized reason",
                "tag": "Quick|High Protein|Comfort Food|Trending|Chef Special",
                "prep_time": 20
              }}
            ]
            """
            text = _call_gemini(prompt)
            recs = _extract_json(text)
            if recs and isinstance(recs, list) and len(recs) >= 3:
                return recs[:6]
        except Exception as e:
            print(f"[Gemini] Recommendations error: {e}")

    # Rich randomized fallback pool with 16+ varied options
    pool = [
        {"name": "Butter Chicken with Garlic Naan", "cuisine": "North Indian", "reason": "Rich tomato gravy paired with fluffy naan.", "tag": "Comfort Food", "prep_time": 35},
        {"name": "Trastevere Spaghetti Carbonara", "cuisine": "Italian", "reason": "Silky egg-cheese sauce with crispy guanciale.", "tag": "Quick & Easy", "prep_time": 20},
        {"name": "Thai Basil Chicken Stir-Fry (Pad Krapow)", "cuisine": "Thai", "reason": "Spicy, aromatic stir-fry served over jasmine rice.", "tag": "Trending", "prep_time": 15},
        {"name": "Mediterranean Quinoa Power Bowl", "cuisine": "Mediterranean", "reason": "Packed with chickpeas, cucumbers, feta & lemon dressing.", "tag": "High Protein", "prep_time": 15},
        {"name": "Authentic Mexican Tacos al Pastor", "cuisine": "Mexican", "reason": "Marinated pork with grilled pineapple & cilantro.", "tag": "Street Food", "prep_time": 25},
        {"name": "Japanese Salmon Teriyaki Bowl", "cuisine": "Japanese", "reason": "Glazed salmon over warm rice with steamed edamame.", "tag": "Healthy Pick", "prep_time": 20},
        {"name": "Paneer Tikka Masala", "cuisine": "Indian", "reason": "Chargrilled paneer cubes in spiced gravy.", "tag": "Vegetarian Delight", "prep_time": 30},
        {"name": "Spanish Paella Valenciana", "cuisine": "Spanish", "reason": "Saffron-infused rice layered with seafood and veggies.", "tag": "Weekend Feasts", "prep_time": 45},
        {"name": "Korean Crispy Fried Chicken (Yangnyeom)", "cuisine": "Korean", "reason": "Double-fried chicken tossed in sweet & spicy sauce.", "tag": "Chef Special", "prep_time": 30},
        {"name": "Creamy Wild Mushroom Risotto", "cuisine": "Italian", "reason": "Slow-cooked Arborio rice with parmesan & thyme.", "tag": "Gourmet Choice", "prep_time": 35},
        {"name": "Middle Eastern Falafel Wrap", "cuisine": "Middle Eastern", "reason": "Crispy chickpea falafels with tahini & fresh mint.", "tag": "Vegan Favorite", "prep_time": 20},
        {"name": "Classic French Beef Bourguignon", "cuisine": "French", "reason": "Tender beef braised in red wine & herbs.", "tag": "Slow Cooked", "prep_time": 50},
        {"name": "South Indian Crispy Dosa & Sambar", "cuisine": "Indian", "reason": "Golden crepe with potato masala & coconut chutney.", "tag": "Breakfast Classic", "prep_time": 25},
        {"name": "Greek Lemon Oregano Roasted Chicken", "cuisine": "Greek", "reason": "Juicy chicken roasted with garlic, lemon & potatoes.", "tag": "Family Favorite", "prep_time": 40},
        {"name": "Vietnamese Beef Pho Noodles", "cuisine": "Vietnamese", "reason": "Aromatic bone broth infused with star anise & fresh basil.", "tag": "Noodle Bowl", "prep_time": 30},
        {"name": "Garlic Butter Honey Glazed Shrimp", "cuisine": "Seafood", "reason": "Succulent shrimp tossed in garlic, honey & chili flakes.", "tag": "15-Min Meal", "prep_time": 15},
    ]

    selected = random.sample(pool, min(6, len(pool)))

    if search_history and len(search_history) > 0:
        k = search_history[0]
        selected[0] = {
            "name": f"Special {k.title()} Bowl",
            "cuisine": "Fusion",
            "reason": f"Inspired by your recent search for '{k}'",
            "tag": "Personalized",
            "prep_time": 20
        }

    return selected


PERSONA_PROMPTS = {
    "auguste": (
        "You are Chef Auguste, an elite French Michelin-starred Master Chef. "
        "You speak with refined elegance, culinary passion, and deep knowledge of classical gastronomy and wine pairings. "
        "You emphasize technique, flavor balance, and address the user with respect as 'Chef'."
    ),
    "nonna": (
        "You are Nonna Rosa, a warm, loving, and passionate Italian grandmother from Tuscany. "
        "You cook from the heart, never skimp on garlic or good olive oil, and believe good food brings people together. "
        "Use warm Italian expressions like 'Ciao tesoro!', 'Mamma mia!', and share secret homestyle kitchen wisdom."
    ),
    "marcus": (
        "You are Coach Marcus, an energetic sports nutritionist and strength coach. "
        "You view food as high-performance fuel for muscle building and energy. "
        "You emphasize high protein, clean complex carbs, healthy fats, and macro efficiency. Call the user 'Champ' or 'Athlete'."
    ),
    "sam": (
        "You are Speedy Sam, a super resourceful 15-minute kitchen hacker and college budget genius. "
        "You love air-fryers, one-pan meals, minimal dish-washing, and making delicious food in under 15 minutes. "
        "Keep it fun, fast-paced, and wildly practical!"
    )
}


async def chat_with_assistant(message: str, history: list = None, user_name: str = "Chef", persona: str = "auguste") -> str:
    """Conversational AI Chef Assistant supporting multiple chef personas."""
    msg = message.strip()
    msg_lower = msg.lower()
    persona_key = persona.lower() if persona else "auguste"
    persona_bio = PERSONA_PROMPTS.get(persona_key, PERSONA_PROMPTS["auguste"])

    if GEMINI_AVAILABLE:
        try:
            sys_prompt = (
                f"{persona_bio}\n"
                "You can answer ANY cooking or culinary question asked by the user with clear, practical, and inspiring answers. "
                "Format your response beautifully with markdown, bullet points, and appetizing emojis."
            )
            history_text = ""
            if history:
                formatted_history = []
                for item in history[-6:]:
                    if hasattr(item, "sender") and hasattr(item, "text"):
                        formatted_history.append(f"{item.sender}: {item.text}")
                    elif isinstance(item, dict):
                        formatted_history.append(f"{item.get('sender', 'user')}: {item.get('text', '')}")
                if formatted_history:
                    history_text = "\n\nConversation History:\n" + "\n".join(formatted_history)

            prompt = f"{sys_prompt}{history_text}\n\nUser Question: {msg}"
            response_text = _call_gemini(prompt)
            if response_text:
                return response_text
        except Exception as e:
            print(f"Gemini chat error: {e}")

    # ── Smart Culinary Mock Responses by Persona ─────────────────────────
    if any(w in msg_lower for w in ["hi", "hello", "hey", "start"]):
        if persona_key == "nonna":
            return (
                f"Ciao {user_name}, tesoro mio! 👵 Nonna Rosa is so happy you're here! "
                "Are you eating enough? Come, let's cook something with love—a velvety sauce, fresh pasta, or whatever we find in your kitchen. "
                "Tell me, what are you craving today?"
            )
        elif persona_key == "marcus":
            return (
                f"Let's get after it, {user_name}! 🏋️ Coach Marcus checking in. "
                "Time to fuel that body right! What are your macro targets today? Need 40g+ protein ideas, lean dinner prep, or quick clean fuel?"
            )
        elif persona_key == "sam":
            return (
                f"Yo {user_name}! ⚡ Speedy Sam in the house. "
                "Rule #1 in my kitchen: maximum flavor, under 15 minutes, and preferably one pan so we don't do dishes. "
                "What's in your fridge right now? Let's whip something up!"
            )
        else:
            return (
                f"Bonjour, {user_name}! 👨‍🍳 Chef Auguste at your service. "
                "Welcome to the ChefAI culinary atelier. Whether you seek to master a delicate emulsion, balance acidity, or create an exquisite menu, I am here to guide your craft. "
                "What masterpiece shall we create?"
            )

    if any(w in msg_lower for w in ["substitute", "replace", "instead of", "swap"]):
        return (
            "Here are popular ingredient substitutions:\n\n"
            "• **Egg (for baking)**: 1/4 cup applesauce OR 1 tbsp flaxseed + 3 tbsp water OR 1/2 mashed banana per egg.\n"
            "• **Buttermilk**: 1 cup milk + 1 tbsp lemon juice or white vinegar (let sit 5 mins).\n"
            "• **Heavy Cream**: 3/4 cup milk + 1/3 cup melted butter.\n"
            "• **Soy Sauce**: Coconut aminos OR Tamari (gluten-free).\n"
            "• **Breadcrumbs**: Rolled oats, crushed cornflakes, or almond flour."
        )

    if any(w in msg_lower for w in ["quick", "fast", "15 min", "10 min", "easy"]):
        return (
            "⏱️ **Quick 15-Minute Meals Ideas**:\n\n"
            "1. **Garlic Butter Shrimp Pasta**: Sauté garlic and shrimp in butter, toss with boiled spaghetti and fresh parsley.\n"
            "2. **Avocado Toast with Poached Egg**: Toasted sourdough, mashed avocado, lemon juice, chili flakes, and a runny poached egg.\n"
            "3. **Caprese Salad Wrap**: Mozzarella, tomatoes, fresh basil, and balsamic glaze wrapped in a tortilla.\n"
            "4. **Egg Fried Rice**: Sauté cold cooked rice with scrambled eggs, green peas, soy sauce, and sesame oil."
        )

    if any(w in msg_lower for w in ["healthy", "diet", "weight", "calories", "salad", "protein"]):
        return (
            "🥗 **Healthy & High-Protein Meal Recommendation**:\n\n"
            "**Grilled Lemon Herb Chicken Bowl**\n"
            "• **Protein**: 45g | **Calories**: ~420 kcal\n"
            "• **Base**: Quinoa or brown rice + roasted zucchini & bell peppers.\n"
            "• **Dressing**: Olive oil, lemon juice, garlic, and fresh oregano.\n"
            "• **Tip**: Marinate chicken breasts in lemon juice and garlic for 15 mins before grilling for maximum juiciness!"
        )

    if any(w in msg_lower for w in ["egg", "paneer", "chicken", "pasta", "rice", "biryani", "pizza", "burger"]):
        return (
            f"That sounds delicious! 😋\n\n"
            f"Here is a great technique when cooking **{msg}**:\n"
            "1. **Prep Everything First** (*Mise en place*): Measure and chop ingredients before turning on the stove.\n"
            "2. **Heat Control**: Preheat your skillet/pan so ingredients sear properly without boiling in their own juices.\n"
            "3. **Season Gradually**: Add salt at different cooking stages rather than all at the end.\n\n"
            "Would you like a full step-by-step recipe or dietary breakdown for this dish?"
        )

    return (
        f"Great question! 🍳 When it comes to **{msg}**, key culinary principles make a big difference:\n\n"
        "• Always balance acidity (lemon/vinegar), salt, and fat for rich flavor depth.\n"
        "• Let grilled meats rest for 5–7 minutes before slicing to retain juices.\n"
        "• Use fresh herbs towards the end of cooking for vibrant aroma.\n\n"
        "Ask me anything else about recipes, meal planning, or ingredient swaps!"
    )


async def get_location_meals(country: str, city: str = "", meal_time: str = "any", dietary_pref: str = "none") -> list:
    """Suggest regional meals based on country/city location context."""
    if GEMINI_AVAILABLE:
        try:
            loc_str = f"{city}, {country}" if city else country
            prompt = f"""
            Suggest 4 authentic, popular regional dishes for someone located in {loc_str}.
            Meal Time Preference: {meal_time}.
            Dietary Preference: {dietary_pref}.
            Return ONLY a JSON array of objects with this exact structure:
            [
              {{
                "name": "Dish Name",
                "cuisine": "Regional Cuisine Name",
                "description": "Short mouth-watering description (1-2 sentences)",
                "reason": "Why this is popular in {loc_str} for {meal_time}",
                "difficulty": "Easy|Medium|Hard",
                "prep_time": 25
              }}
            ]
            """
            text = _call_gemini(prompt)
            return _extract_json(text)
        except Exception as e:
            print(f"[Gemini] Location meals error: {e}")

    # Mock fallback based on region
    c_lower = country.lower()
    if "india" in c_lower:
        return [
            {
                "name": "Butter Chicken with Garlic Naan",
                "cuisine": "North Indian",
                "description": "Tender chicken cooked in a rich, buttery tomato gravy spiced with garam masala.",
                "reason": f"Iconic comforting classic enjoyed across {country}.",
                "difficulty": "Medium",
                "prep_time": 35
            },
            {
                "name": "Masala Dosa with Sambar",
                "cuisine": "South Indian",
                "description": "Crispy fermented rice-lentil crepe filled with spiced potato masala, served with coconut chutney.",
                "reason": "Beloved staple meal full of authentic regional spice.",
                "difficulty": "Medium",
                "prep_time": 25
            },
            {
                "name": "Chole Bhature",
                "cuisine": "Punjabi",
                "description": "Spicy chickpea curry paired with fluffy deep-fried bread.",
                "reason": "Famous street food & restaurant classic.",
                "difficulty": "Easy",
                "prep_time": 30
            },
            {
                "name": "Paneer Tikka Kathi Roll",
                "cuisine": "Street Food",
                "description": "Smoky marinated paneer cubes rolled in flatbread with tangy mint chutney.",
                "reason": "Quick, delicious, and ubiquitous regional favorite.",
                "difficulty": "Easy",
                "prep_time": 20
            }
        ]
    elif "italy" in c_lower or "italian" in c_lower:
        return [
            {
                "name": "Trastevere Spaghetti Carbonara",
                "cuisine": "Roman / Italian",
                "description": "Silky pasta with guanciale, fresh egg yolks, Pecorino Romano, and cracked pepper.",
                "reason": "Classic Roman dish perfected over generations.",
                "difficulty": "Easy",
                "prep_time": 20
            },
            {
                "name": "Neapolitan Margherita Pizza",
                "cuisine": "Campanian",
                "description": "Wood-fired dough topped with San Marzano tomatoes, fresh mozzarella, and basil.",
                "reason": "World-renowned specialty of Naples.",
                "difficulty": "Medium",
                "prep_time": 30
            },
            {
                "name": "Risotto alla Milanese",
                "cuisine": "Lombard",
                "description": "Creamy saffron-infused Arborio rice with butter and Parmigiano-Reggiano.",
                "reason": "Elegant Northern Italian traditional dish.",
                "difficulty": "Medium",
                "prep_time": 25
            },
            {
                "name": "Classic Tiramisu",
                "cuisine": "Venetian",
                "description": "Coffee-soaked ladyfingers layered with whipped mascarpone cream and cocoa.",
                "reason": "Ultimate Italian dessert loved worldwide.",
                "difficulty": "Easy",
                "prep_time": 20
            }
        ]
    elif "mexico" in c_lower:
        return [
            {
                "name": "Tacos al Pastor",
                "cuisine": "Mexican Street Food",
                "description": "Thinly sliced marinated pork with pineapple, cilantro, and onion on warm corn tortillas.",
                "reason": "Mexico City's legendary taco favorite.",
                "difficulty": "Medium",
                "prep_time": 25
            },
            {
                "name": "Chiles en Nogada",
                "cuisine": "Poblano",
                "description": "Poblano chiles stuffed with spiced picadillo, covered in creamy walnut sauce and pomegranate.",
                "reason": "Traditional festive Mexican masterpiece.",
                "difficulty": "Hard",
                "prep_time": 45
            },
            {
                "name": "Chicken Enchiladas Verdes",
                "cuisine": "Mexican",
                "description": "Tortillas rolled with shredded chicken, smothered in tangy green tomatillo sauce and melted cheese.",
                "reason": "Hearty homemade comfort food.",
                "difficulty": "Easy",
                "prep_time": 30
            },
            {
                "name": "Fresh Guacamole & Totopos",
                "cuisine": "Mexican",
                "description": "Creamy avocado smashed with lime, jalapeño, cilantro, and red onion.",
                "reason": "Essential authentic Mexican appetizer.",
                "difficulty": "Easy",
                "prep_time": 10
            }
        ]
    else:
        loc_display = f"{city}, {country}" if city else country
        return [
            {
                "name": f"Regional {country} Specialty Bowl",
                "cuisine": f"{country} Fusion",
                "description": f"A vibrant meal highlighting fresh local ingredients from {loc_display}.",
                "reason": f"Popular localized favorite in {country}.",
                "difficulty": "Easy",
                "prep_time": 25
            },
            {
                "name": "Herbed Roast Chicken with Seasoned Vegetables",
                "cuisine": "Continental",
                "description": "Juicy chicken roasted with garlic, rosemary, and seasonal root vegetables.",
                "reason": "Globally loved comforting meal suitable for any time of day.",
                "difficulty": "Medium",
                "prep_time": 40
            },
            {
                "name": "Artisanal Fresh Pasta with Herb Oil",
                "cuisine": "Mediterranean",
                "description": "Freshly cooked pasta tossed with olive oil, cherry tomatoes, basil, and parmesan.",
                "reason": "Quick, delicious, and universally enjoyed meal.",
                "difficulty": "Easy",
                "prep_time": 15
            },
            {
                "name": "Savory Garden Stir-Fry Bowl",
                "cuisine": "Asian Fusion",
                "description": "Crisp vegetables stir-fried in ginger-garlic sauce over aromatic rice.",
                "reason": "Healthy, fast, and customizable to local ingredients.",
                "difficulty": "Easy",
                "prep_time": 20
            }
        ]


async def get_smart_fridge_suggestions(ingredients: list, dietary_pref: str = "none", max_cooking_time: int = 60) -> list:
    """Enhanced smart fridge algorithm factoring in ingredient categories, quantities, dietary preference, and max time."""
    if GEMINI_AVAILABLE:
        try:
            formatted_ings = []
            for ing in ingredients:
                if isinstance(ing, dict):
                    name = ing.get("name", "")
                    qty = ing.get("quantity", "")
                    unit = ing.get("unit", "")
                    cat = ing.get("category", "fridge")
                    formatted_ings.append(f"{name} ({qty} {unit}, {cat})".strip())
                elif hasattr(ing, "name"):
                    formatted_ings.append(f"{ing.name} ({ing.quantity} {ing.unit}, {ing.category})")
                else:
                    formatted_ings.append(str(ing))

            prompt = f"""
            Available Ingredients (categorized by fridge/pantry/spices): {", ".join(formatted_ings)}
            Dietary Restriction: {dietary_pref}
            Max Cooking Time: {max_cooking_time} minutes

            Suggest 4 tailored recipes that maximize the use of available ingredients within time and dietary constraints.
            Return ONLY a JSON array with this exact structure:
            [
              {{
                "name": "Recipe Name",
                "matching_ingredients": ["ing1", "ing2"],
                "missing_ingredients": ["ing3"],
                "estimated_calories": 400,
                "difficulty": "Easy|Medium|Hard",
                "cooking_time": 25,
                "reason": "Why this recipe fits your ingredients and timeframe"
              }}
            ]
            """
            text = _call_gemini(prompt)
            return _extract_json(text)
        except Exception as e:
            print(f"[Gemini] Smart fridge error: {e}")

    # Mock fallback
    ing_names = []
    for ing in ingredients:
        if isinstance(ing, dict):
            ing_names.append(ing.get("name", "").lower())
        elif hasattr(ing, "name"):
            ing_names.append(ing.name.lower())
        else:
            ing_names.append(str(ing).lower())

    ing_set = set(ing_names)

    mock_pool = [
        {
            "name": "Loaded Garden Omelette / Scramble",
            "keys": {"egg", "butter", "cheese", "onion", "tomato", "spinach", "pepper"},
            "calories": 320,
            "difficulty": "Easy",
            "time": 15,
            "reason": "Quick high-protein meal utilizing your fresh fridge items."
        },
        {
            "name": "Savory Garlic Herb Fried Rice",
            "keys": {"rice", "egg", "onion", "garlic", "soy sauce", "oil", "peas", "carrot"},
            "calories": 450,
            "difficulty": "Easy",
            "time": 20,
            "reason": "Great pantry cleanser using leftover rice and spices."
        },
        {
            "name": "Rustic Tomato Garlic Pasta",
            "keys": {"pasta", "tomato", "garlic", "olive oil", "cheese", "basil", "oregano"},
            "calories": 510,
            "difficulty": "Easy",
            "time": 25,
            "reason": "Classic Mediterranean dish made with simple pantry and fridge items."
        },
        {
            "name": "Skillet Lemon Garlic Chicken / Tofu",
            "keys": {"chicken", "tofu", "garlic", "lemon", "butter", "oil", "pepper"},
            "calories": 480,
            "difficulty": "Medium",
            "time": 30,
            "reason": "Flavorful dinner utilizing main protein and spices."
        }
    ]

    suggestions = []
    for item in mock_pool:
        matched = [k for k in item["keys"] if any(k in ing for ing in ing_set)]
        missing = [k for k in item["keys"] if not any(k in ing for ing in ing_set)]
        if not matched:
            matched = ing_names[:2] if ing_names else ["ingredients"]
            missing = ["seasoning", "oil"]

        if item["time"] <= max_cooking_time:
            suggestions.append({
                "name": item["name"],
                "matching_ingredients": matched,
                "missing_ingredients": missing[:3],
                "estimated_calories": item["calories"],
                "difficulty": item["difficulty"],
                "cooking_time": item["time"],
                "reason": item["reason"]
            })

    if not suggestions:
        suggestions = [{
            "name": "Chef's Express Stir-Fry",
            "matching_ingredients": ing_names,
            "missing_ingredients": ["Soy Sauce"],
            "estimated_calories": 380,
            "difficulty": "Easy",
            "cooking_time": min(max_cooking_time, 20),
            "reason": "Simple sauté utilizing all your current ingredients."
        }]

    return suggestions[:4]


async def rag_chat(message: str, context: str = "", history: list = None, user_name: str = "Chef", persona: str = "auguste") -> str:
    """Chat assistant augmented with grounded recipe context (RAG) and chef personas."""
    persona_key = persona.lower() if persona else "auguste"
    persona_bio = PERSONA_PROMPTS.get(persona_key, PERSONA_PROMPTS["auguste"])

    if GEMINI_AVAILABLE:
        try:
            sys_prompt = (
                f"{persona_bio}\n"
                "You are an expert culinary AI assistant grounded with specific knowledge from the user's recipe library.\n"
                "When answering the user's question, strictly reference and prioritize the provided saved recipe context.\n"
                "If the context contains relevant details, cite the recipe names explicitly and give accurate steps/ingredients.\n"
                "Format your response with markdown, bullet points, and appetizing emojis."
            )
            context_block = f"\n\n--- GROUNDING RECIPE CONTEXT ---\n{context}\n---------------------------------\n" if context else ""

            history_text = ""
            if history:
                formatted_history = []
                for item in history[-6:]:
                    if hasattr(item, "sender") and hasattr(item, "text"):
                        formatted_history.append(f"{item.sender}: {item.text}")
                    elif isinstance(item, dict):
                        formatted_history.append(f"{item.get('sender', 'user')}: {item.get('text', '')}")
                if formatted_history:
                    history_text = "\n\nConversation History:\n" + "\n".join(formatted_history)

            prompt = f"{sys_prompt}{context_block}{history_text}\n\nUser Question: {message}"
            response_text = _call_gemini(prompt)
            if response_text:
                return response_text
        except Exception as e:
            print(f"[Gemini] RAG Chat error: {e}")

    # Fallback response
    if context:
        greeting = "Bonjour" if persona_key == "auguste" else "Ciao" if persona_key == "nonna" else "Let's go" if persona_key == "marcus" else "Yo"
        return (
            f"{greeting} {user_name}! Based on your saved recipe library, here is what I found:\n\n"
            f"{context}\n\n"
            f"To answer your question (*\"{message}\"*): You can use these recipes as your main reference! "
            "Let me know if you need specific ingredient scaling, substitutions, or cooking steps."
        )

    return await chat_with_assistant(message=message, history=history, user_name=user_name, persona=persona)


