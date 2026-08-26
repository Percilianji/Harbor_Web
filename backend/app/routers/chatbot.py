import os
import logging

from fastapi import APIRouter
from openai import OpenAI

from app.schemas import ChatMessage

router = APIRouter()
logger = logging.getLogger("harbor.chatbot")

SYSTEM_PROMPT = """
You are Ask Harbor, an age-appropriate awareness and safety education guide.
Keep answers calm, brief, non-graphic, and practical. Explain consent, boundaries,
online safety, healthy relationships, and trusted support. Do not provide legal,
medical, or emergency instructions as a replacement for professionals. If a user
may be in immediate danger, encourage contacting local emergency services or a
trusted adult/support service now.
When web search is available, use it for current awareness, hotline, policy, or
internet-sourced questions. Do not invent sources. Keep the answer easy to
understand for the selected age group.
"""


def fallback_reply(message: str, age_group: str, topic: str) -> str:
    text = message.lower()

    if any(word in text for word in ["not talking", "won't talk", "wont talk", "quiet", "silent", "withdraw", "withdrawn", "changed", "different", "problem", "worried", "worry"]):
        return (
            "A child becoming very quiet or not talking can mean many things: stress, fear, shame, bullying, illness, family pressure, or something that feels too hard to explain. "
            "It makes sense to pay attention without assuming the worst right away. "
            "Try to approach gently, without asking leading or frightening questions. You might say: "
            "\"I noticed you seem quieter lately. I am not angry. I am here if something is bothering you.\" "
            "Do not pressure her to explain immediately. Keep routines calm, stay nearby, and watch for changes in sleep, appetite, school, fear of a person/place, body pain, nightmares, or sudden clinginess. "
            "and consider speaking with a pediatrician, school counselor, child therapist, or trusted safeguarding service. "
            "If you think the child may be unsafe right now, prioritize getting them away from the unsafe situation and contact local emergency or child protection support."
        )

    if text.strip() in {"hello", "hi", "hey", "good morning", "good afternoon", "good evening"}:
        return (
            "Hi, I am here with you. You can ask about consent, body boundaries, online pressure, warning signs, "
            "how to talk to a child, or how to find support. What is happening?"
        )

    if any(word in text for word in ["child", "daughter", "son", "girl", "boy", "kid"]) and any(word in text for word in ["talk", "speak", "say", "tell"]):
        return (
            "When a child is struggling to talk, a calm opening can help more than direct questioning. "
            "Try short, low-pressure check-ins: \"You do not have to explain now, but I am here.\" "
            "Offer choices: drawing, writing, sitting together, talking to another trusted adult, or seeing a counselor. "
            "If the silence started after being with a specific person or going to a specific place, treat that as important information and keep the child away from anything that feels unsafe while you seek support."
        )

    if any(word in text for word in ["consent", "boundary", "boundaries", "touch"]):
        return (
            "Consent means a person freely chooses what happens to their body, space, photos, and private information. "
            "For children, keep it simple: they can say no, safe adults should listen, and unsafe secrets about touch should be told to a trusted adult."
        )

    if any(word in text for word in ["online", "photo", "message", "image", "internet", "social"]):
        return (
            "For online safety, avoid sharing private images or personal details, save evidence if there are threats, "
            "block/report the account, and involve a trusted adult or safeguarding service early."
        )

    return (
        f"Ask Harbor can help with {topic.lower()} for {age_group}. "
        "A safe first step is to name the concern, avoid sharing private details, "
        "and talk with a trusted adult, counselor, support service, or emergency service if there is immediate danger."
    )


def chat_completion_reply(client: OpenAI, model: str, payload: ChatMessage) -> str:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(
        {
            "role": item.get("role", "user"),
            "content": item.get("content", ""),
        }
        for item in payload.history[-6:]
        if item.get("role") in {"user", "assistant"} and item.get("content")
    )
    messages.append(
        {
            "role": "user",
            "content": (
                f"Age group: {payload.ageGroup}\n"
                f"Topic: {payload.topic}\n"
                f"Question: {payload.message}"
            ),
        }
    )

    response = client.chat.completions.create(
        model=model,
        messages=messages,
        max_completion_tokens=450,
    )
    return response.choices[0].message.content or fallback_reply(payload.message, payload.ageGroup, payload.topic)


@router.post("")
def chat(payload: ChatMessage):
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    enable_web_search = os.getenv("OPENAI_ENABLE_WEB_SEARCH", "true").lower() == "true"
    web_search_tool = os.getenv("OPENAI_WEB_SEARCH_TOOL", "web_search")

    if not api_key:
        return {"reply": fallback_reply(payload.message, payload.ageGroup, payload.topic), "mode": "fallback", "reason": "missing_api_key"}

    client = OpenAI(api_key=api_key)
    history_text = "\n".join(
        f"{item.get('role', 'user')}: {item.get('content', '')}" for item in payload.history[-6:]
    )
    request = {
        "model": model,
        "instructions": SYSTEM_PROMPT,
        "input": (
            f"Age group: {payload.ageGroup}\n"
            f"Topic: {payload.topic}\n"
            f"Recent conversation:\n{history_text}\n"
            f"User: {payload.message}"
        ),
        "max_output_tokens": 450,
    }

    if enable_web_search:
        request["tools"] = [{"type": web_search_tool}]

    responses_client = getattr(client, "responses", None)
    if responses_client is not None:
        try:
            response = responses_client.create(**request)
            return {"reply": response.output_text, "mode": "openai_web" if enable_web_search else "openai"}
        except Exception as error:
            logger.warning("OpenAI Responses request failed with tools: %s", error.__class__.__name__)
            try:
                request.pop("tools", None)
                response = responses_client.create(**request)
                return {"reply": response.output_text, "mode": "openai"}
            except Exception as retry_error:
                error_message = str(retry_error)[:220]
                logger.warning("OpenAI Responses retry failed: %s: %s", retry_error.__class__.__name__, error_message)
                return {
                    "reply": fallback_reply(payload.message, payload.ageGroup, payload.topic),
                    "mode": "fallback",
                    "reason": "responses_failed",
                    "error": f"{retry_error.__class__.__name__}: {error_message}",
                }

    if model.startswith("gpt-5"):
        return {"reply": fallback_reply(payload.message, payload.ageGroup, payload.topic), "mode": "fallback", "reason": "sdk_too_old_for_gpt5"}

    try:
        reply = chat_completion_reply(client, model, payload)
        return {"reply": reply, "mode": "openai_chat"}
    except Exception as error:
        error_message = str(error)[:220]
        logger.warning("OpenAI Chat Completions failed: %s: %s", error.__class__.__name__, error_message)
        return {
            "reply": fallback_reply(payload.message, payload.ageGroup, payload.topic),
            "mode": "fallback",
            "reason": "chat_completions_failed",
            "error": f"{error.__class__.__name__}: {error_message}",
        }
