from fastapi import APIRouter

from app.schemas import StoryDraft
from app.store import make_record, stories, story_drafts

router = APIRouter()


@router.get("/steps")
def get_story_steps():
    return {"steps": ["Safety check", "Privacy choice", "Story details", "Privacy review", "Consent"]}


@router.post("/drafts")
def save_draft(draft: StoryDraft):
    record = make_record(draft.model_dump())
    story_drafts.insert(0, record)
    return {"message": "Draft saved.", "draft": record}


@router.post("/submissions")
def submit_story(story: StoryDraft):
    is_public_story = story.publishing in {"anonymous", "nickname"}
    record = make_record({**story.model_dump(), "status": "published" if is_public_story else "private"})
    story_drafts.insert(0, record)

    if is_public_story:
        public_story = {
            "id": record["id"],
            "ownerId": story.userId,
            "ownerName": story.userName or "Anonymous",
            "title": story.storyTitle or story.draftName or "Untitled shared story",
            "excerpt": (story.storyBody[:170] + "...") if len(story.storyBody) > 170 else story.storyBody or "A newly shared story.",
            "readTime": "Just now",
            "language": story.language,
            "region": story.region or "Region not shared",
            "tags": ["Shared story"],
            "warnings": story.warnings,
            "reactions": 0,
        }
        stories.insert(0, public_story)
        return {"message": "Story added to the story library.", "submission": record, "story": public_story}

    return {"message": "Private story saved. It will not appear in the public story library.", "submission": record}
