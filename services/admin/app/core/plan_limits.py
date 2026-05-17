from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class PlanLimits:
    max_menus: Optional[int]
    max_items: Optional[int]
    max_languages: int
    can_search: bool


PLAN_LIMITS: dict[str, PlanLimits] = {
    "starter":  PlanLimits(max_menus=1,    max_items=50,   max_languages=1, can_search=False),
    "business": PlanLimits(max_menus=5,    max_items=200,  max_languages=3, can_search=True),
    "pro":      PlanLimits(max_menus=None, max_items=None, max_languages=3, can_search=True),
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
