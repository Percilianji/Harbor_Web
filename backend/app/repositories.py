from app.db import connection, is_configured


def normalize_db_user_key(value: str) -> str:
    cleaned = (value or "anonymous").strip().lower()
    return "app-" + "".join(character if character.isalnum() else "-" for character in cleaned)[:70]


def ensure_user_reference(cur, user_id: str = "", private_name: str = "Anonymous user") -> str:
    normalized_name = normalize_db_user_key(user_id or private_name)
    display_name = (private_name or "Anonymous user").strip()[:80]
    cur.execute("SELECT id FROM users WHERE normalized_name = %s", (normalized_name,))
    row = cur.fetchone()
    if row:
        return row["id"]

    cur.execute(
        """
        INSERT INTO users (private_name, normalized_name, recovery_email, role, account_status, must_reset_password, password_salt, password_hash)
        VALUES (%s, %s, %s, 'community', 'active', false, 'external', 'external')
        RETURNING id
        """,
        (display_name, normalized_name, ""),
    )
    return cur.fetchone()["id"]


def format_created_at(value) -> str:
    return value.strftime("%Y-%m-%d %H:%M:%S") if value else ""


def split_tags(tags: str) -> list[str]:
    if isinstance(tags, list):
        return tags
    return [tag.strip() for tag in (tags or "").split(",") if tag.strip()]


def public_user_from_db_row(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "privateName": row["private_name"],
        "recoveryEmail": row.get("recovery_email") or "",
        "officialEmail": row.get("official_email") or "",
        "role": row.get("role") or "community",
        "createdAt": format_created_at(row.get("created_at")),
    }


def get_user_for_login_from_db(normalized_login: str) -> dict | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT *
                FROM users
                WHERE normalized_name = %s OR LOWER(COALESCE(official_email, '')) = %s
                LIMIT 1
                """,
                (normalized_login, normalized_login),
            )
            return cur.fetchone()


def create_community_user_in_db(payload: dict) -> dict | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM users WHERE normalized_name = %s",
                (payload["normalized_name"],),
            )
            if cur.fetchone():
                raise ValueError("That private name is already taken.")
            cur.execute(
                """
                INSERT INTO users (
                    private_name, normalized_name, recovery_email, role, account_status,
                    must_reset_password, password_salt, password_hash
                )
                VALUES (%(private_name)s, %(normalized_name)s, %(recovery_email)s, 'community', 'active', false, %(password_salt)s, %(password_hash)s)
                RETURNING *
                """,
                payload,
            )
            return public_user_from_db_row(cur.fetchone())


def official_from_rows(profile: dict, user: dict) -> dict:
    role = user.get("role") or "government"
    return {
        "id": str(profile["id"]),
        "createdAt": format_created_at(profile.get("created_at")),
        "userId": str(user["id"]),
        "privateName": user["private_name"],
        "officialEmail": profile.get("official_email") or user.get("official_email") or "",
        "agencyName": profile.get("agency_name") or "",
        "positionTitle": profile.get("position_title") or "",
        "role": role,
        "authorityType": "NGO partner" if role == "ngo" else "Government official",
        "verificationStatus": profile.get("verification_status") or "verified",
    }


def list_officials_from_db() -> list[dict] | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT gp.*, u.id AS db_user_id, u.private_name, u.role, u.official_email AS user_official_email
                FROM government_profiles gp
                JOIN users u ON u.id = gp.user_id
                ORDER BY gp.created_at DESC
                """
            )
            officials = []
            for row in cur.fetchall():
                user = {
                    "id": row["db_user_id"],
                    "private_name": row["private_name"],
                    "role": row["role"],
                    "official_email": row["user_official_email"],
                }
                officials.append(official_from_rows(row, user))
            return officials


def create_official_account_in_db(user_payload: dict, profile_payload: dict) -> dict | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id FROM users
                WHERE normalized_name IN (%s, %s) OR LOWER(COALESCE(official_email, '')) = %s
                """,
                (user_payload["normalized_name"], user_payload["official_email"], user_payload["official_email"]),
            )
            if cur.fetchone():
                raise ValueError("That official account already exists.")
            cur.execute(
                """
                INSERT INTO users (
                    private_name, normalized_name, recovery_email, official_email, role, account_status,
                    must_reset_password, password_salt, password_hash
                )
                VALUES (
                    %(private_name)s, %(normalized_name)s, %(recovery_email)s, %(official_email)s, %(role)s,
                    'active', false, %(password_salt)s, %(password_hash)s
                )
                RETURNING *
                """,
                user_payload,
            )
            user = cur.fetchone()
            cur.execute(
                """
                INSERT INTO government_profiles (user_id, agency_name, position_title, official_email, verification_status, verified_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                RETURNING *
                """,
                (
                    user["id"],
                    profile_payload["agency_name"],
                    profile_payload["position_title"],
                    profile_payload["official_email"],
                    profile_payload["verification_status"],
                ),
            )
            return official_from_rows(cur.fetchone(), user)


def update_official_account_in_db(official_id: str, payload: dict) -> dict | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM government_profiles WHERE id = %s", (official_id,))
            profile = cur.fetchone()
            if not profile:
                return None
            user_id = profile["user_id"]
            cur.execute(
                """
                UPDATE users
                SET private_name = %(private_name)s,
                    normalized_name = %(normalized_name)s,
                    recovery_email = %(official_email)s,
                    official_email = %(official_email)s,
                    role = %(role)s,
                    updated_at = NOW()
                WHERE id = %(user_id)s
                RETURNING *
                """,
                {**payload, "user_id": user_id},
            )
            user = cur.fetchone()
            cur.execute(
                """
                UPDATE government_profiles
                SET agency_name = %(agency_name)s,
                    position_title = %(position_title)s,
                    official_email = %(official_email)s,
                    verification_status = %(verification_status)s,
                    updated_at = NOW()
                WHERE id = %(id)s
                RETURNING *
                """,
                {**payload, "id": official_id},
            )
            return official_from_rows(cur.fetchone(), user)


def delete_official_account_from_db(official_id: str) -> bool | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM government_profiles WHERE id = %s", (official_id,))
            row = cur.fetchone()
            if not row:
                return False
            cur.execute("DELETE FROM users WHERE id = %s", (row["user_id"],))
            return cur.rowcount > 0


def support_resource_from_row(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "type": row["type"],
        "place": row["place"],
        "hours": row.get("hours") or "",
        "languages": row.get("languages") or "",
        "cost": row.get("cost") or "",
        "contact": row["contact"],
        "verified": row.get("verified") or "",
        "createdAt": row["created_at"].strftime("%Y-%m-%d %H:%M:%S") if row.get("created_at") else "",
    }


def list_support_resources_from_db() -> list[dict] | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, name, type, place, hours, languages, cost, contact, verified, created_at
                FROM support_resources
                ORDER BY created_at DESC, name ASC
                """
            )
            return [support_resource_from_row(row) for row in cur.fetchall()]


def create_support_resource_in_db(payload: dict) -> dict | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO support_resources (name, type, place, hours, languages, cost, contact, verified)
                VALUES (%(name)s, %(type)s, %(place)s, %(hours)s, %(languages)s, %(cost)s, %(contact)s, %(verified)s)
                RETURNING id, name, type, place, hours, languages, cost, contact, verified, created_at
                """,
                payload,
            )
            return support_resource_from_row(cur.fetchone())


def update_support_resource_in_db(resource_id: str, payload: dict) -> dict | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE support_resources
                SET name = %(name)s,
                    type = %(type)s,
                    place = %(place)s,
                    hours = %(hours)s,
                    languages = %(languages)s,
                    cost = %(cost)s,
                    contact = %(contact)s,
                    verified = %(verified)s,
                    updated_at = NOW()
                WHERE id = %(id)s
                RETURNING id, name, type, place, hours, languages, cost, contact, verified, created_at
                """,
                {**payload, "id": resource_id},
            )
            row = cur.fetchone()
            return support_resource_from_row(row) if row else None


def delete_support_resource_from_db(resource_id: str) -> bool | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM support_resources WHERE id = %s", (resource_id,))
            return cur.rowcount > 0


def mark_support_resource_reported_in_db(name: str) -> bool | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM support_resources WHERE name = %s LIMIT 1", (name,))
            row = cur.fetchone()
            if not row:
                return False
            cur.execute(
                "INSERT INTO support_resource_reports (resource_id, reason) VALUES (%s, %s)",
                (row["id"], "Reported incorrect from public support page"),
            )
            return True


def story_from_row(row: dict) -> dict:
    reaction_count = row.get("reaction_count", 0)
    owner_id = row.get("owner_external_id") or str(row["user_id"]) if row.get("user_id") else ""
    return {
        "id": str(row["id"]),
        "ownerId": owner_id.removeprefix("app-") if owner_id.startswith("app-") else owner_id,
        "ownerName": row.get("owner_name") or "Anonymous",
        "title": row["title"],
        "excerpt": row["excerpt"],
        "readTime": row.get("read_time") or "Just now",
        "language": row.get("language") or "English",
        "region": row.get("region") or "Region not shared",
        "tags": row.get("tags") or [],
        "warnings": row.get("warnings") or [],
        "reactions": reaction_count or 0,
    }


def story_draft_payload(draft, status: str = "draft") -> dict:
    data = draft.model_dump()
    return {
        "private_place": data["privatePlace"],
        "draft_name": data["draftName"],
        "publishing": data["publishing"],
        "nickname": data["nickname"],
        "story_title": data["storyTitle"],
        "language": data["language"],
        "story_body": data["storyBody"],
        "approx_date": data["approxDate"],
        "region": data["region"],
        "warnings": data["warnings"],
        "understand_privacy": data["understandPrivacy"],
        "reviewed_ids": data["reviewedIds"],
        "deletion": data["deletion"],
        "rules": data["rules"],
        "status": status,
    }


def draft_from_row(row: dict, user_id: str = "", user_name: str = "") -> dict:
    return {
        "id": str(row["id"]),
        "createdAt": format_created_at(row.get("created_at")),
        "userId": user_id,
        "userName": user_name,
        "privatePlace": row.get("private_place") or False,
        "draftName": row.get("draft_name") or "",
        "publishing": row.get("publishing") or "private",
        "nickname": row.get("nickname") or "",
        "storyTitle": row.get("story_title") or "",
        "language": row.get("language") or "English",
        "storyBody": row.get("story_body") or "",
        "approxDate": row.get("approx_date") or "",
        "region": row.get("region") or "",
        "warnings": row.get("warnings") or [],
        "understandPrivacy": row.get("understand_privacy") or False,
        "reviewedIds": row.get("reviewed_ids") or False,
        "deletion": row.get("deletion") or False,
        "rules": row.get("rules") or False,
        "status": row.get("status") or "draft",
    }


def list_public_stories_from_db() -> list[dict] | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT ps.*, u.private_name AS owner_name, u.normalized_name AS owner_external_id, COUNT(sr.id)::int AS reaction_count
                FROM public_stories ps
                LEFT JOIN users u ON u.id = ps.user_id
                LEFT JOIN story_reactions sr ON sr.story_id = ps.id
                WHERE ps.status = 'approved'
                GROUP BY ps.id, u.private_name, u.normalized_name
                ORDER BY COALESCE(ps.published_at, ps.created_at) DESC
                """
            )
            return [story_from_row(row) for row in cur.fetchall()]


def save_story_draft_in_db(draft) -> dict | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            db_user_id = ensure_user_reference(cur, draft.userId, draft.userName or draft.privateName if hasattr(draft, "privateName") else draft.userName)
            payload = story_draft_payload(draft)
            cur.execute(
                """
                INSERT INTO story_drafts (
                    user_id, private_place, draft_name, publishing, nickname, story_title, language, story_body,
                    approx_date, region, warnings, understand_privacy, reviewed_ids, deletion, rules, status
                )
                VALUES (
                    %(user_id)s, %(private_place)s, %(draft_name)s, %(publishing)s, %(nickname)s, %(story_title)s, %(language)s, %(story_body)s,
                    %(approx_date)s, %(region)s, %(warnings)s, %(understand_privacy)s, %(reviewed_ids)s, %(deletion)s, %(rules)s, %(status)s
                )
                RETURNING *
                """,
                {"user_id": db_user_id, **payload},
            )
            return draft_from_row(cur.fetchone(), draft.userId, draft.userName)


def submit_story_in_db(story) -> tuple[dict, dict | None] | None:
    if not is_configured():
        return None

    is_public_story = story.publishing in {"anonymous", "nickname"}
    with connection() as conn:
        with conn.cursor() as cur:
            db_user_id = ensure_user_reference(cur, story.userId, story.userName or "Anonymous")
            payload = story_draft_payload(story, "published" if is_public_story else "private")
            cur.execute(
                """
                INSERT INTO story_drafts (
                    user_id, private_place, draft_name, publishing, nickname, story_title, language, story_body,
                    approx_date, region, warnings, understand_privacy, reviewed_ids, deletion, rules, status, submitted_at
                )
                VALUES (
                    %(user_id)s, %(private_place)s, %(draft_name)s, %(publishing)s, %(nickname)s, %(story_title)s, %(language)s, %(story_body)s,
                    %(approx_date)s, %(region)s, %(warnings)s, %(understand_privacy)s, %(reviewed_ids)s, %(deletion)s, %(rules)s, %(status)s, NOW()
                )
                RETURNING *
                """,
                {"user_id": db_user_id, **payload},
            )
            draft_row = cur.fetchone()
            submission = draft_from_row(draft_row, story.userId, story.userName)
            public_story = None
            if is_public_story:
                title = story.storyTitle or story.draftName or "Untitled shared story"
                excerpt = (story.storyBody[:170] + "...") if len(story.storyBody) > 170 else story.storyBody or "A newly shared story."
                cur.execute(
                    """
                    INSERT INTO public_stories (source_draft_id, user_id, title, excerpt, body, read_time, language, region, tags, warnings, status, published_at)
                    VALUES (%s, %s, %s, %s, %s, 'Just now', %s, %s, %s, %s, 'approved', NOW())
                    RETURNING *, 0::int AS reaction_count
                    """,
                    (draft_row["id"], db_user_id, title, excerpt, story.storyBody, story.language, story.region or "Region not shared", ["Shared story"], story.warnings),
                )
                public_story = story_from_row({**cur.fetchone(), "owner_name": story.userName or "Anonymous"})
                public_story["ownerId"] = story.userId
            return submission, public_story


def add_story_reaction_in_db(story_identifier: str) -> int | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM public_stories ORDER BY COALESCE(published_at, created_at) DESC")
            rows = cur.fetchall()
            story_id = None
            if story_identifier.isdigit() and int(story_identifier) < len(rows):
                story_id = rows[int(story_identifier)]["id"]
            else:
                story_id = story_identifier
            cur.execute("INSERT INTO story_reactions (story_id, reaction_label) VALUES (%s, 'support')", (story_id,))
            cur.execute("SELECT COUNT(*)::int AS count FROM story_reactions WHERE story_id = %s", (story_id,))
            return cur.fetchone()["count"]


def delete_public_story_from_db(story_id: str, owner_id: str) -> bool | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            db_user_id = ensure_user_reference(cur, owner_id, owner_id)
            cur.execute("DELETE FROM public_stories WHERE id = %s AND user_id = %s", (story_id, db_user_id))
            return cur.rowcount > 0


def journal_entry_from_row(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "title": row["title"],
        "mood": row.get("mood") or "Steady",
        "body": row["body"],
        "tags": ", ".join(row.get("tags") or []),
        "date": format_created_at(row.get("created_at")),
        "createdAt": format_created_at(row.get("created_at")),
    }


def list_journal_entries_from_db(user_id: str, user_name: str = "") -> list[dict] | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            db_user_id = ensure_user_reference(cur, user_id, user_name or user_id)
            cur.execute("SELECT * FROM journal_entries WHERE user_id = %s ORDER BY created_at DESC", (db_user_id,))
            return [journal_entry_from_row(row) for row in cur.fetchall()]


def create_journal_entry_in_db(entry, user_id: str = "", user_name: str = "") -> dict | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            db_user_id = ensure_user_reference(cur, user_id, user_name or user_id)
            cur.execute(
                """
                INSERT INTO journal_entries (user_id, title, mood, body, tags)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *
                """,
                (db_user_id, entry.title.strip(), entry.mood.strip() or "Steady", entry.body, split_tags(entry.tags)),
            )
            return journal_entry_from_row(cur.fetchone())


def delete_journal_entry_from_db(entry_id: str, user_id: str = "", user_name: str = "") -> bool | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            db_user_id = ensure_user_reference(cur, user_id, user_name or user_id)
            cur.execute("DELETE FROM journal_entries WHERE id = %s AND user_id = %s", (entry_id, db_user_id))
            return cur.rowcount > 0


def vault_case_from_row(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "createdAt": format_created_at(row.get("created_at")),
        "userId": str(row["user_id"]),
        "userName": row.get("user_name") or "Anonymous user",
        "label": row["label"],
        "incidentDateTime": row.get("incident_date_time") or row.get("incident_date") or "",
        "location": row.get("location") or "",
        "recordType": row.get("record_type") or "Incident note",
        "peopleInvolved": row.get("people_involved") or "",
        "witnesses": row.get("witnesses") or "",
        "evidenceFileName": row.get("evidence_file_name") or "",
        "screenshotReference": row.get("screenshot_reference") or "",
        "medicalLegalFollowUp": row.get("medical_legal_follow_up") or "",
        "safetyNotes": row.get("safety_notes") or "",
        "notes": row.get("notes") or "",
        "privateDetails": row.get("private_details") or "",
        "notesLength": row.get("notes_length") or 0,
        "privateDetailsLength": row.get("private_details_length") or 0,
        "consentToOfficialReview": row.get("consent_to_official_review") or False,
        "status": row.get("status") or "private",
    }


def list_official_vault_cases_from_db() -> list[dict] | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT vc.*, u.private_name AS user_name
                FROM vault_cases vc
                LEFT JOIN users u ON u.id = vc.user_id
                WHERE vc.consent_to_official_review = true
                ORDER BY vc.created_at DESC
                """
            )
            return [vault_case_from_row(row) for row in cur.fetchall()]


def create_vault_case_in_db(case) -> dict | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            db_user_id = ensure_user_reference(cur, case.userId, case.userName or "Anonymous user")
            payload = {
                "user_id": db_user_id,
                "label": case.label,
                "incident_date_time": case.incidentDateTime,
                "location": case.location,
                "record_type": case.recordType,
                "people_involved": case.peopleInvolved,
                "witnesses": case.witnesses,
                "evidence_file_name": case.evidenceFileName,
                "screenshot_reference": case.screenshotReference,
                "medical_legal_follow_up": case.medicalLegalFollowUp,
                "safety_notes": case.safetyNotes,
                "notes": case.notes,
                "private_details": case.privateDetails,
                "notes_length": len(case.notes),
                "private_details_length": len(case.privateDetails),
                "consent_to_official_review": case.consentToOfficialReview,
                "status": "new" if case.consentToOfficialReview else "private",
            }
            cur.execute(
                """
                INSERT INTO vault_cases (
                    user_id, label, incident_date_time, location, record_type, people_involved, witnesses,
                    evidence_file_name, screenshot_reference, medical_legal_follow_up, safety_notes, notes,
                    private_details, notes_length, private_details_length, consent_to_official_review, status
                )
                VALUES (
                    %(user_id)s, %(label)s, %(incident_date_time)s, %(location)s, %(record_type)s, %(people_involved)s, %(witnesses)s,
                    %(evidence_file_name)s, %(screenshot_reference)s, %(medical_legal_follow_up)s, %(safety_notes)s, %(notes)s,
                    %(private_details)s, %(notes_length)s, %(private_details_length)s, %(consent_to_official_review)s, %(status)s
                )
                RETURNING *
                """,
                payload,
            )
            return vault_case_from_row({**cur.fetchone(), "user_name": case.userName or "Anonymous user"})


def ensure_awareness_columns(cur) -> None:
    cur.execute("ALTER TABLE awareness_lessons ADD COLUMN IF NOT EXISTS content_type VARCHAR(60) NOT NULL DEFAULT 'Notes'")
    cur.execute("ALTER TABLE awareness_lessons ADD COLUMN IF NOT EXISTS thumbnail_key VARCHAR(120)")
    cur.execute("ALTER TABLE awareness_lessons ADD COLUMN IF NOT EXISTS thumbnail_url TEXT")
    cur.execute("ALTER TABLE awareness_lessons ADD COLUMN IF NOT EXISTS thumbnail_alt TEXT")
    cur.execute("ALTER TABLE awareness_lessons ADD COLUMN IF NOT EXISTS image_caption VARCHAR(220)")
    cur.execute("ALTER TABLE awareness_lessons ADD COLUMN IF NOT EXISTS media_label VARCHAR(120)")
    cur.execute("ALTER TABLE awareness_lessons ADD COLUMN IF NOT EXISTS media_url TEXT")
    cur.execute("ALTER TABLE awareness_lessons ADD COLUMN IF NOT EXISTS video_id VARCHAR(40)")
    cur.execute("ALTER TABLE awareness_lessons ADD COLUMN IF NOT EXISTS detail_intro TEXT")
    cur.execute("ALTER TABLE awareness_lessons ADD COLUMN IF NOT EXISTS detail_explanation TEXT[] NOT NULL DEFAULT '{}'")
    cur.execute("ALTER TABLE awareness_lessons ADD COLUMN IF NOT EXISTS detail_examples JSONB NOT NULL DEFAULT '[]'::jsonb")
    cur.execute("ALTER TABLE awareness_lessons ADD COLUMN IF NOT EXISTS detail_practice TEXT[] NOT NULL DEFAULT '{}'")
    cur.execute("ALTER TABLE awareness_lessons ADD COLUMN IF NOT EXISTS detail_check TEXT[] NOT NULL DEFAULT '{}'")
    cur.execute("ALTER TABLE awareness_lessons ADD COLUMN IF NOT EXISTS published_at DATE DEFAULT CURRENT_DATE")
    cur.execute("ALTER TABLE awareness_lessons ADD COLUMN IF NOT EXISTS status VARCHAR(40) NOT NULL DEFAULT 'published'")


def awareness_lesson_from_row(row: dict) -> dict:
    published_at = row.get("published_at")
    return {
        "id": str(row["id"]),
        "title": row["title"],
        "contentType": row.get("content_type") or "Notes",
        "thumbnailKey": row.get("thumbnail_key") or "",
        "thumbnailUrl": row.get("thumbnail_url") or "",
        "thumbnailAlt": row.get("thumbnail_alt") or "",
        "imageCaption": row.get("image_caption") or "",
        "mediaLabel": row.get("media_label") or "",
        "mediaUrl": row.get("media_url") or "",
        "videoId": row.get("video_id") or "",
        "age": row.get("age_group") or "All ages",
        "topic": row.get("topic") or "Prevention education",
        "summary": row["summary"],
        "points": row.get("points") or [],
        "publishedAt": published_at.isoformat() if hasattr(published_at, "isoformat") else str(published_at or ""),
        "details": {
            "intro": row.get("detail_intro") or "",
            "explanation": row.get("detail_explanation") or [],
            "examples": row.get("detail_examples") or [],
            "practice": row.get("detail_practice") or [],
            "check": row.get("detail_check") or [],
        },
    }


def awareness_payload(payload) -> dict:
    data = payload.model_dump()
    details = data.get("details") or {}
    return {
        "title": data["title"].strip(),
        "content_type": data["contentType"],
        "thumbnail_url": data["thumbnailUrl"],
        "thumbnail_alt": data["thumbnailAlt"],
        "image_caption": data["imageCaption"],
        "media_label": data["mediaLabel"],
        "media_url": data["mediaUrl"],
        "video_id": data["videoId"],
        "age_group": data["age"],
        "topic": data["topic"],
        "summary": data["summary"],
        "points": data["points"],
        "detail_intro": details.get("intro", ""),
        "detail_explanation": details.get("explanation", []),
        "detail_examples": details.get("examples", []),
        "detail_practice": details.get("practice", []),
        "detail_check": details.get("check", []),
        "published_at": data["publishedAt"] or None,
    }


def list_awareness_lessons_from_db() -> list[dict] | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            ensure_awareness_columns(cur)
            cur.execute("SELECT * FROM awareness_lessons WHERE status = 'published' ORDER BY published_at DESC, created_at DESC")
            return [awareness_lesson_from_row(row) for row in cur.fetchall()]


def create_awareness_lesson_in_db(payload) -> dict | None:
    if not is_configured():
        return None

    data = awareness_payload(payload)
    with connection() as conn:
        with conn.cursor() as cur:
            ensure_awareness_columns(cur)
            cur.execute(
                """
                INSERT INTO awareness_lessons (
                    title, content_type, thumbnail_url, thumbnail_alt, image_caption, media_label, media_url, video_id,
                    age_group, topic, summary, points, detail_intro, detail_explanation, detail_examples,
                    detail_practice, detail_check, published_at, status
                )
                VALUES (
                    %(title)s, %(content_type)s, %(thumbnail_url)s, %(thumbnail_alt)s, %(image_caption)s, %(media_label)s, %(media_url)s, %(video_id)s,
                    %(age_group)s, %(topic)s, %(summary)s, %(points)s, %(detail_intro)s, %(detail_explanation)s, %(detail_examples)s,
                    %(detail_practice)s, %(detail_check)s, COALESCE(%(published_at)s, CURRENT_DATE), 'published'
                )
                RETURNING *
                """,
                data,
            )
            return awareness_lesson_from_row(cur.fetchone())


def update_awareness_lesson_in_db(lesson_id: str, payload) -> dict | None:
    if not is_configured():
        return None

    data = awareness_payload(payload)
    with connection() as conn:
        with conn.cursor() as cur:
            ensure_awareness_columns(cur)
            cur.execute(
                """
                UPDATE awareness_lessons
                SET title = %(title)s,
                    content_type = %(content_type)s,
                    thumbnail_url = %(thumbnail_url)s,
                    thumbnail_alt = %(thumbnail_alt)s,
                    image_caption = %(image_caption)s,
                    media_label = %(media_label)s,
                    media_url = %(media_url)s,
                    video_id = %(video_id)s,
                    age_group = %(age_group)s,
                    topic = %(topic)s,
                    summary = %(summary)s,
                    points = %(points)s,
                    detail_intro = %(detail_intro)s,
                    detail_explanation = %(detail_explanation)s,
                    detail_examples = %(detail_examples)s,
                    detail_practice = %(detail_practice)s,
                    detail_check = %(detail_check)s,
                    published_at = COALESCE(%(published_at)s, published_at),
                    updated_at = NOW()
                WHERE id = %(id)s
                RETURNING *
                """,
                {**data, "id": lesson_id},
            )
            row = cur.fetchone()
            return awareness_lesson_from_row(row) if row else None


def delete_awareness_lesson_from_db(lesson_id: str) -> dict | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            ensure_awareness_columns(cur)
            cur.execute("DELETE FROM awareness_lessons WHERE id = %s RETURNING *", (lesson_id,))
            row = cur.fetchone()
            return awareness_lesson_from_row(row) if row else None


def campaign_flyer_from_row(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "title": row["title"],
        "imageUrl": row["image_url"],
        "language": row.get("language") or "English",
        "region": row.get("region") or "",
        "isActive": row.get("is_active") or False,
        "createdAt": format_created_at(row.get("created_at")),
    }


def list_campaign_flyers_from_db() -> list[dict] | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT *
                FROM campaign_flyers
                ORDER BY is_active DESC, created_at DESC
                """
            )
            return [campaign_flyer_from_row(row) for row in cur.fetchall()]


def create_campaign_flyer_in_db(payload, user_id: str = "", user_name: str = "") -> dict | None:
    if not is_configured():
        return None

    with connection() as conn:
        with conn.cursor() as cur:
            db_user_id = ensure_user_reference(cur, user_id, user_name or user_id or "Government official")
            if payload.isActive:
                cur.execute("UPDATE campaign_flyers SET is_active = false WHERE is_active = true")
            cur.execute(
                """
                INSERT INTO campaign_flyers (title, image_url, language, region, is_active, created_by)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    payload.title.strip(),
                    payload.imageUrl.strip(),
                    payload.language.strip() or "English",
                    payload.region.strip() or "Cameroon",
                    payload.isActive,
                    db_user_id,
                ),
            )
            return campaign_flyer_from_row(cur.fetchone())
