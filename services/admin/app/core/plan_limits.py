from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class PlanLimits:
    max_menus: Optional[int]
    max_items: Optional[int]
    max_languages: int
    can_search: bool
    can_stoplist: bool
    ai_translation: bool
    ai_nutrition: bool
    ai_description: bool
    allergens: bool
    telegram_alerts: bool
    remove_branding: bool


PLAN_LIMITS: dict[str, PlanLimits] = {
    "starter": PlanLimits(
        max_menus=1, max_items=50, max_languages=1,
        can_search=False, can_stoplist=False,
        ai_translation=False, ai_nutrition=False, ai_description=False,
        allergens=False, telegram_alerts=False, remove_branding=False,
    ),
    "business": PlanLimits(
        max_menus=5, max_items=200, max_languages=3,
        can_search=True, can_stoplist=True,
        ai_translation=True, ai_nutrition=True, ai_description=False,
        allergens=False, telegram_alerts=False, remove_branding=False,
    ),
    "pro": PlanLimits(
        max_menus=None, max_items=None, max_languages=3,
        can_search=True, can_stoplist=True,
        ai_translation=True, ai_nutrition=True, ai_description=True,
        allergens=True, telegram_alerts=True, remove_branding=True,
    ),
}

ALLOWED_LANGUAGES: dict[str, set[str]] = {
    "starter":  {"ru"},
    "business": {"ru", "kz", "en"},
    "pro":      {"ru", "kz", "en"},
}


def get_limits(plan: str) -> PlanLimits:
    return PLAN_LIMITS.get(plan, PLAN_LIMITS["starter"])


def get_allowed_languages(plan: str) -> set[str]:
    return ALLOWED_LANGUAGES.get(plan, ALLOWED_LANGUAGES["starter"])
