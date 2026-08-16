def extract_text(response):
    content = response.content

    # Normal string response
    if isinstance(content, str):
        return content

    # Structured Gemini response
    if isinstance(content, list):
        texts = []

        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                texts.append(item.get("text", ""))

        return "\n".join(texts).strip()

    return str(content)