from enum import Enum


class Role(str, Enum):
    USER = "user"
    ENGINEER = "engineer"
    ADMIN = "admin"


ROLE_HIERARCHY = {
    Role.USER: 1,
    Role.ENGINEER: 2,
    Role.ADMIN: 3,
}


def has_required_role(user_role: str, required_role: Role) -> bool:
    """Checks if the user's role satisfies the required clearance level."""
    try:
        user_level = ROLE_HIERARCHY[Role(user_role)]
        required_level = ROLE_HIERARCHY[required_role]
        return user_level >= required_level
    except (ValueError, KeyError):
        return False
