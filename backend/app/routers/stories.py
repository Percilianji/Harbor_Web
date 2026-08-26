from fastapi import APIRouter

from app.schemas import DeleteStoryRequest
from app.store import stories

router = APIRouter()


@router.get("")
def list_stories():
    return {"stories": stories}


@router.post("/{index}/reactions")
def add_reaction(index: int):
    if 0 <= index < len(stories):
        stories[index]["reactions"] += 1
        return {"reactions": stories[index]["reactions"]}
    return {"reactions": 0}


@router.delete("/{story_id}")
def delete_story(story_id: str, request: DeleteStoryRequest):
    for index, story in enumerate(stories):
        if story.get("id") == story_id and story.get("ownerId") == request.userId:
            removed = stories.pop(index)
            return {"deleted": True, "story": removed}

    return {"deleted": False, "message": "Story not found or you do not have permission to delete it."}
