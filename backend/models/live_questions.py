from pydantic import BaseModel, Field

from models.llm import ProviderCredentials


class QuestionInput(BaseModel):
    id: str = Field(..., description="Question UUID")
    question: str = Field(..., min_length=1, description="The question or topic text")


class EvaluateQuestionsRequest(BaseModel):
    credentials: ProviderCredentials = Field(..., description="LLM provider credentials")
    transcript: str = Field(..., min_length=1, description="Full transcript text to evaluate against")
    questions: list[QuestionInput] = Field(..., description="Unanswered questions to evaluate")


class QuestionEvaluation(BaseModel):
    id: str = Field(..., description="Question ID")
    answered: bool = Field(..., description="Whether the question is answered by the transcript")
    answer: str | None = Field(None, description="Short answer text (only when answered is True)")


class EvaluateQuestionsResponse(BaseModel):
    evaluations: list[QuestionEvaluation] = Field(..., description="Evaluation results for each question")
