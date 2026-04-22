import datetime
from enum import Enum
from typing import Literal
from pydantic import BaseModel, Field, model_validator


class LLMProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    AZURE_OPENAI = "azure_openai"
    LANGDOCK = "langdock"
    PWC = "pwc"
    BEDROCK = "bedrock"


class AzureConfig(BaseModel):
    api_version: str = Field(..., description="Azure OpenAI API version", examples=["2024-02-15-preview"])
    azure_endpoint: str = Field(..., description="Azure OpenAI endpoint URL", examples=["https://my-resource.openai.azure.com/"])
    deployment_name: str = Field(..., description="Azure OpenAI deployment name", examples=["gpt-4-deployment"])


class LangdockConfig(BaseModel):
    region: Literal["eu", "us"] = "eu"


class BedrockConfig(BaseModel):
    aws_region: str = Field(..., description="AWS region for Bedrock", examples=["us-east-1"])
    aws_access_key_id: str = Field(..., min_length=1, description="AWS access key ID")
    aws_secret_access_key: str = Field(..., min_length=1, description="AWS secret access key")


class ProviderCredentials(BaseModel):
    """Shared credentials object for all LLM providers. Sent per-request."""
    provider: LLMProvider = Field(..., description="Which LLM provider to use")
    model: str = Field(..., min_length=1, description="Model identifier")
    api_key: str = Field("", description="Provider API key (not required for Bedrock)")
    azure_config: AzureConfig | None = Field(None, description="Required only when provider is 'azure_openai'")
    langdock_config: LangdockConfig = Field(default_factory=LangdockConfig, description="Langdock region config")
    bedrock_config: BedrockConfig | None = Field(None, description="Required only when provider is 'bedrock'")

    @model_validator(mode="after")
    def validate_provider_config(self):
        if self.provider == LLMProvider.AZURE_OPENAI and self.azure_config is None:
            raise ValueError("azure_config is required when provider is 'azure_openai'")
        if self.provider == LLMProvider.BEDROCK and self.bedrock_config is None:
            raise ValueError("bedrock_config is required when provider is 'bedrock'")
        if self.provider != LLMProvider.BEDROCK and not self.api_key:
            raise ValueError("api_key is required for non-Bedrock providers")
        return self

    @property
    def model_name(self) -> str:
        """Resolve the effective model name (uses deployment_name for Azure)."""
        if self.provider == LLMProvider.AZURE_OPENAI and self.azure_config:
            return self.azure_config.deployment_name
        return self.model


class CreateSummaryRequest(BaseModel):
    credentials: ProviderCredentials = Field(..., description="LLM provider credentials")
    stream: bool = Field(True, description="Whether to stream the response")
    system_prompt: str = Field(..., min_length=1, description="The system prompt (selected/edited template)")
    text: str = Field(..., min_length=1, description="The transcript text to summarize")
    target_language: str = Field("English", description="Output language", examples=["English", "German", "French", "Spanish"])
    informal_german: bool = Field(True, description="Use informal German pronouns (du/ihr instead of Sie)")
    date: datetime.date | None = Field(None, description="Meeting date for date formatting in prompt")
    author: str | None = Field(None, description="Speaker selected as author/POV for the summary")


class TokenUsage(BaseModel):
    input_tokens: int = Field(0, description="Number of input/prompt tokens")
    output_tokens: int = Field(0, description="Number of output/completion tokens")
    total_tokens: int = Field(0, description="Total tokens (input + output)")


class CreateSummaryResponse(BaseModel):
    summary: str = Field(..., description="The AI summary of the transcription")
    summary_title: str | None = Field(None, description="Dedicated summary title generated via structured output")
    usage: TokenUsage | None = Field(None, description="Token usage for this request")


class ExtractKeyPointsRequest(BaseModel):
    credentials: ProviderCredentials = Field(..., description="LLM provider credentials")
    transcript: str = Field(..., min_length=1, description="The transcript text to extract key points from")
    speakers: list[str] = Field(..., min_length=1, description="List of speaker labels found in the transcript")
    identify_speakers: bool = Field(False, description="When True, also attempt to identify real speaker names from the transcript")


class ExtractKeyPointsResponse(BaseModel):
    key_points: dict[str, str] = Field(..., description="Mapping of speaker label to 1-3 sentence key point summary")
    speaker_labels: dict[str, str] = Field(default_factory=dict, description="Mapping of speaker label to identified real name (only speakers with clearly identifiable names)")


class TestLLMRequest(BaseModel):
    credentials: ProviderCredentials = Field(..., description="LLM provider credentials")


class TestLLMResponse(BaseModel):
    success: bool = Field(..., description="Whether the test was successful")
    error: str | None = Field(None, description="Error message if the test failed")


class GenerateTitleRequest(BaseModel):
    credentials: ProviderCredentials = Field(..., description="LLM provider credentials")
    transcript: str = Field(..., min_length=1, description="The transcript text to generate a title from")
    target_language: str = Field("English", description="Output language for the title")
    date: datetime.date | None = Field(None, description="Meeting date")
    system_prompt: str | None = Field(None, description="Optional custom system prompt for title generation")


class GenerateTitleResponse(BaseModel):
    title: str = Field(..., description="The generated title")
    usage: TokenUsage | None = Field(None, description="Token usage for this request")
