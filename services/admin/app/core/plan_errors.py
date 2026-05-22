from fastapi import HTTPException, status

from app.core.plan_limits import get_limits

_UPGRADE_TO: dict[str, str] = {
    "starter": "business",
    "business": "pro",
    "pro": "pro",
}


class PlanLimitError(HTTPException):
    def __init__(self, detail: dict) -> None:
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def menus_limit_error(plan: str) -> PlanLimitError:
    limit = get_limits(plan).max_menus
    return PlanLimitError({
        "code": "PLAN_LIMIT_REACHED",
        "message": f"Ваш тариф позволяет создать не более {limit} меню. Обновите тариф для добавления новых меню.",
        "upgrade_to": _UPGRADE_TO.get(plan, "business"),
    })


def items_limit_error(plan: str) -> PlanLimitError:
    limit = get_limits(plan).max_items
    return PlanLimitError({
        "code": "PLAN_LIMIT_REACHED",
        "message": f"Ваш тариф позволяет добавить не более {limit} позиций. Обновите тариф для добавления новых позиций.",
        "upgrade_to": _UPGRADE_TO.get(plan, "business"),
    })


def stoplist_limit_error() -> PlanLimitError:
    return PlanLimitError({
        "code": "PLAN_LIMIT_REACHED",
        "message": "Стоп-лист доступен только на тарифе Бизнес и выше.",
        "upgrade_to": "business",
    })


def language_limit_error(plan: str, language: str) -> PlanLimitError:
    from app.core.plan_limits import get_allowed_languages
    allowed = ", ".join(sorted(get_allowed_languages(plan)))
    return PlanLimitError({
        "code": "PLAN_LIMIT_REACHED",
        "message": f"Язык «{language}» недоступен на вашем тарифе. Доступные языки: {allowed}.",
        "upgrade_to": _UPGRADE_TO.get(plan, "business"),
    })
