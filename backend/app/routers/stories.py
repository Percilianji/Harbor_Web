from fastapi import APIRouter

from app.repositories import add_story_reaction_in_db, delete_public_story_from_db, list_public_stories_from_db
from app.schemas import DeleteStoryRequest
from app.store import stories

router = APIRouter()


@router.get("")
def list_stories():
    db_stories = list_public_stories_from_db()
    if db_stories is not None:
        return {"stories": db_stories}
    return {"stories": stories}


@router.post("/{index}/reactions")
def add_reaction(index: int):
    db_reactions = add_story_reaction_in_db(str(index))
    if db_reactions is not None:
        return {"reactions": db_reactions}

    if 0 <= index < len(stories):
        stories[index]["reactions"] += 1
        return {"reactions": stories[index]["reactions"]}
    return {"reactions": 0}


@router.delete("/{story_id}")
def delete_story(story_id: str, request: DeleteStoryRequest):
    db_deleted = delete_public_story_from_db(story_id, request.userId)
    if db_deleted is not None:
        return {"deleted": db_deleted, "message": "" if db_deleted else "Story not found or you do not have permission to delete it."}

    for index, story in enumerate(stories):
        if story.get("id") == story_id and story.get("ownerId") == request.userId:
            removed = stories.pop(index)
            return {"deleted": True, "story": removed}

    return {"deleted": False, "message": "Story not found or you do not have permission to delete it."}
