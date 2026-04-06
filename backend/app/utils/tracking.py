import random
import string
from datetime import datetime


def generate_tracking_number() -> str:
    """Generate a tracking number like VDP-2026-A3X7"""
    year = datetime.now().year
    chars = string.ascii_uppercase + string.digits
    suffix = ''.join(random.choices(chars, k=4))
    return f"VDP-{year}-{suffix}"
