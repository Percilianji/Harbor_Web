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
    userId: str = ""
    userName: str = ""
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
    privateDetails: str = ""
    consentToOfficialReview: bool = False


class ChatMessage(BaseModel):
    message: str
    ageGroup: str = "General"
    topic: str = "Awareness"
    history: list[dict[str, str]] = Field(default_factory=list)


class AwarenessLessonRequest(BaseModel):
    title: str
    contentType: str = "Notes"
    thumbnailKey: str = ""
    thumbnailUrl: str = ""
    thumbnailAlt: str = ""
    imageCaption: str = ""
    mediaLabel: str = ""
    mediaUrl: str = ""
    videoId: str = ""
    age: str = "All ages"
    topic: str = "Prevention education"
    summary: str
    points: list[str] = Field(default_factory=list)
    publishedAt: str = ""
    details: dict = Field(default_factory=dict)


class SignupRequest(BaseModel):
    privateName: str
    password: str
    confirmPassword: str
    recoveryEmail: str = ""
    accountType: str = "community"
    governmentCode: str = ""


class LoginRequest(BaseModel):
    privateName: str
    password: str


class OfficialAccountRequest(BaseModel):
    privateName: str
    officialEmail: str
    agencyName: str
    positionTitle: str = ""
    role: str = "government"


class OfficialAccountUpdate(BaseModel):
    privateName: str
    officialEmail: str
    agencyName: str
    positionTitle: str = ""
    verificationStatus: str = "verified"
    role: str = "government"


class SupportResourceRequest(BaseModel):
    name: str
    type: str
    place: str
    hours: str = ""
    languages: str = ""
    cost: str = ""
    contact: str
    verified: str = "Admin added"


class CampaignFlyerRequest(BaseModel):
    title: str
    imageUrl: str
    language: str = "English"
    region: str = "Cameroon"
    isActive: bool = True


class PasswordSetupRequest(BaseModel):
    token: str
    password: str
    confirmPassword: str
