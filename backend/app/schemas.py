from pydantic import BaseModel, Field


class StoryDraft(BaseModel):
    userId: str = ""
    userName: str = ""
    privatePlace: bool = False
    draftName: str = ""
    publishing: str = "private"
    nickname: str = ""
    storyTitle: str = ""
    language: str = "English"
    storyBody: str = ""
    approxDate: str = ""
    region: str = ""
    warnings: list[str] = Field(default_factory=list)
    understandPrivacy: bool = False
    reviewedIds: bool = False
    deletion: bool = False
    rules: bool = False


class DeleteStoryRequest(BaseModel):
    userId: str = ""


class JournalEntry(BaseModel):
    title: str
    mood: str = "Steady"
    body: str
    tags: str = ""


class VaultCase(BaseModel):
    label: str
    incidentDateTime: str = ""
    location: str = ""
    recordType: str = "Incident note"
    peopleInvolved: str = ""
    witnesses: str = ""
    evidenceFileName: str = ""
    screenshotReference: str = ""
    medicalLegalFollowUp: str = ""
    safetyNotes: str = ""
    notes: str = ""


class ChatMessage(BaseModel):
    message: str
    ageGroup: str = "General"
    topic: str = "Awareness"
    history: list[dict[str, str]] = Field(default_factory=list)


class SignupRequest(BaseModel):
    privateName: str
    password: str
    confirmPassword: str
    recoveryEmail: str = ""


class LoginRequest(BaseModel):
    privateName: str
    password: str
