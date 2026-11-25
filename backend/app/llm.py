import logging
import os
from typing import List, Optional

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_groq import ChatGroq

logger = logging.getLogger(__name__)


class GeminiChatWrapper:
    """LangChain-compatible wrapper around google-genai for Gemini text & multimodal calls."""

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash", temperature: float = 0.7):
        from google import genai
        from google.genai import types

        self.client = genai.Client(api_key=api_key)
        self.model = model
        self.temperature = temperature
        self._types = types

    def invoke(self, messages: List[BaseMessage]) -> AIMessage:
        system_parts = []
        contents = []
        for msg in messages:
            if isinstance(msg, SystemMessage):
                system_parts.append(str(msg.content))
            elif isinstance(msg, HumanMessage):
                contents.append(
                    self._types.Content(
                        role="user",
                        parts=[self._types.Part.from_text(text=str(msg.content))],
                    )
                )
            elif isinstance(msg, AIMessage):
                contents.append(
                    self._types.Content(
                        role="model",
                        parts=[self._types.Part.from_text(text=str(msg.content))],
                    )
                )

        config_kwargs = {"temperature": self.temperature}
        if system_parts:
            config_kwargs["system_instruction"] = "\n\n".join(system_parts)

        response = self.client.models.generate_content(
            model=self.model,
            contents=contents,
            config=self._types.GenerateContentConfig(**config_kwargs),
        )
        return AIMessage(content=response.text or "No response generated.")

    def analyze_image(self, image_bytes: bytes, mime_type: str, prompt: str) -> str:
        response = self.client.models.generate_content(
            model=self.model,
            contents=[
                self._types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                prompt,
            ],
            config=self._types.GenerateContentConfig(temperature=0.4),
        )
        return response.text or ""


_llm_instance = None


def get_llm():
    global _llm_instance
    if _llm_instance is not None:
        return _llm_instance

    gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    groq_api_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    if gemini_api_key:
        try:
            _llm_instance = GeminiChatWrapper(
                api_key=gemini_api_key, model=gemini_model, temperature=0.7
            )
            logger.info("Initialized Gemini LLM with model: %s", gemini_model)
            return _llm_instance
        except Exception as e:
            logger.error("Failed to initialize Gemini LLM: %s", e)
    elif groq_api_key:
        try:
            _llm_instance = ChatGroq(
                api_key=groq_api_key, model=groq_model, temperature=0.7
            )
            logger.info("Initialized ChatGroq with model: %s", groq_model)
            return _llm_instance
        except Exception as e:
            logger.error("Failed to initialize ChatGroq: %s", e)

    return None


def generate_text(prompt: str, system: str = "You are AgroSathi AI, a helpful Indian agricultural advisor.") -> Optional[str]:
    llm = get_llm()
    if llm is None:
        return None
    try:
        res = llm.invoke([SystemMessage(content=system), HumanMessage(content=prompt)])
        return res.content
    except Exception as e:
        logger.error("LLM generate_text error: %s", e)
        return None
