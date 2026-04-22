from pydantic import BaseModel, Field


class ProviderInfo(BaseModel):
    id: str = Field(..., description="Provider identifier", examples=["openai"])
    name: str = Field(..., description="Display name", examples=["OpenAI"])
    models: list[str] = Field(..., description="Suggested model names")
    requires_azure_config: bool = Field(False, description="Whether Azure-specific config is required")
    requires_bedrock_config: bool = Field(False, description="Whether AWS Bedrock-specific config is required")
    model_context_windows: dict[str, int] = Field(default_factory=dict, description="Context window sizes per model (in tokens)")


class PromptTemplate(BaseModel):
    id: str = Field(..., description="Template identifier (filename stem)", examples=["short_meeting_summary"])
    name: str = Field(..., description="Display name", examples=["Short Meeting Summary"])
    content: str = Field(..., description="Full markdown template content")


class LanguageOption(BaseModel):
    code: str = Field(..., description="Language code", examples=["en"])
    name: str = Field(..., description="Language display name", examples=["English"])


class ConfigResponse(BaseModel):
    providers: list[ProviderInfo]
    prompt_templates: list[PromptTemplate]
    languages: list[LanguageOption]


class ListBedrockModelsRequest(BaseModel):
    aws_region: str = Field(..., description="AWS region for Bedrock", examples=["us-east-1"])
    aws_access_key_id: str = Field(..., min_length=1, description="AWS access key ID")
    aws_secret_access_key: str = Field(..., min_length=1, description="AWS secret access key")


class BedrockModelInfo(BaseModel):
    model_id: str = Field(..., description="Model identifier for API calls")
    name: str = Field(..., description="Human-readable model name")
    provider: str = Field("", description="Model provider (e.g. Anthropic, Amazon)")


class ListBedrockModelsResponse(BaseModel):
    models: list[BedrockModelInfo] = Field(..., description="Available Bedrock models")
    error: str | None = Field(None, description="Error message if listing failed")


class GetSpeakersRequest(BaseModel):
    transcript: str = Field(..., description="The transcript of the provided audio file", examples=[
                            "Speaker A: How are you?\nSpeaker B: I'm fine thanks"])


class GetSpeakersResponse(BaseModel):
    speakers: list[str] = Field(..., description="The speakers of the transcript", examples=["Speaker A", "Speaker B"])


class UpdatedTranscriptResponse(BaseModel):
    transcript: str


class UpdatedTranscriptRequest(BaseModel):
    transcript: str = Field(..., description="The transcript of the provided audio file", examples=[
                            "Speaker A: How are you?\nSpeaker B: I'm fine thanks"])
    speakers: dict = Field(..., description="The speakers of the transcript", examples=[
                            {"Speaker A": "John", "Speaker B": "Jane"}])
