TEMPLATE = {
    "slug": "seven-foot-fiancee",
    "title": "She's moving in.",
    "category": "BAD ROMANCE",
    "premise": "A very tall fictional fiancée. A very ordinary apartment. A wildly inadequate ceiling.",
    "duration": "12 seconds",
    "credits": 3,
    "frame_count": 3,
    "tagline": "Love has no limits. Your ceiling does.",
    "captions": ["Meet my fiancée.", "She's moving in tomorrow.", "The landlord has some questions."],
    "reveal": "AI FICTION. The relationship is fictional. The ceiling had it coming.",
}


def moderate(data: dict):
    # Conservative Gate 1 guardrail, not a production classifier.
    text = " ".join(str(data.get(k, "")) for k in ("name", "setting", "custom_details")).lower()
    denied = (
        "kill",
        "murder",
        "suicide",
        "bomb",
        "arrest",
        "nude",
        "naked",
        "minor",
        "child",
        "cheating",
        "rape",
        "abuse",
        "blood",
        "emergency",
        "ignore previous",
        "system prompt",
        "http://",
        "https://",
    )
    return not any(term in text for term in denied)
