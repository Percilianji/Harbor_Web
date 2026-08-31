import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import SectionHeading from "../components/SectionHeading.jsx";
import { apiRequest } from "../utils/api.js";
import { useLanguage } from "../utils/language.jsx";
import imagePower from "../../assets/free 1.jpg";
import imageDress from "../../assets/free 2.jpg";
import imageReport from "../../assets/free 3.jpg";
import imageTell from "../../assets/free 4.jpg";
import imageFists from "../../assets/free 5.jpg";
import imageChains from "../../assets/free 6.jpg";
import imageProfile from "../../assets/free 7.jpg";
import imageVoices from "../../assets/free 8.jpg";
import imageSilence from "../../assets/free 9.jpg";
import imageChoice from "../../assets/free 10.jpg";

const thumbnails = {
  boundaries: imageChoice,
  secrets: imageSilence,
  consent: imageDress,
  online: imageReport,
  pressure: imageTell,
  relationships: imageChains,
  support: imageProfile,
  bystander: imageFists,
  caregivers: imageVoices,
  classroom: imagePower,
};

const lessons = [
  {
    title: "Body boundaries",
    contentType: "Notes",
    thumbnailKey: "boundaries",
    imageCaption: "Learning body boundaries",
    thumbnailAlt: "People at a public march holding signs about bodily choice and personal rights",
    age: "Children 6-9",
    topic: "Personal safety",
    summary: "A gentle child-friendly lesson that teaches what body boundaries are, how to say no, and when to ask a safe adult for help.",
    points: ["My body belongs to me.", "Safe adults listen when I say no.", "Secrets about touch should be shared with a trusted adult."],
  },
  {
    title: "Safe and unsafe secrets",
    contentType: "Notes",
    thumbnailKey: "secrets",
    imageCaption: "Safe adults and trusted help",
    thumbnailAlt: "Advocacy artwork encouraging people to break silence and speak to trusted support",
    age: "Children 6-9",
    topic: "Trusted adults",
    summary: "A simple guide that helps children tell the difference between fun surprises and unsafe secrets that should be shared.",
    points: ["Surprises can be told later.", "Unsafe secrets feel heavy or scary.", "It is okay to ask for help more than once."],
  },
  {
    title: "Consent in friendships",
    contentType: "Notes",
    thumbnailKey: "consent",
    imageCaption: "Consent in everyday choices",
    thumbnailAlt: "A consent awareness poster about respect, clothing, and personal choice",
    age: "Preteens 10-12",
    topic: "Consent",
    summary: "A practical preteen lesson about asking first, respecting no, changing your mind, and treating friends' boundaries seriously.",
    points: ["Ask before touching or sharing photos.", "No one owes access to their body or space.", "A real friend respects a no."],
  },
  {
    title: "#knowB4Unude",
    contentType: "Video",
    videoId: "iNAVcRO22S0",
    mediaLabel: "Play video",
    mediaUrl: "https://www.youtube.com/watch?v=iNAVcRO22S0",
    imageCaption: "Digital safety basics",
    thumbnailAlt: "Video thumbnail for #knowB4Unude",
    age: "Preteens 10-12",
    topic: "Digital safety",
    summary: "A short video for preteens about online pressure, private images, and how to ask for help before a situation gets worse.",
    points: ["Do not send private images.", "Block and report pressure or threats.", "Tell a trusted adult before deleting evidence."],
  },
  {
    title: "ASK. LISTEN. RESPECT.",
    contentType: "Video",
    videoId: "n6X5I7xoxEY",
    mediaLabel: "Play video",
    mediaUrl: "https://www.youtube.com/watch?v=n6X5I7xoxEY",
    imageCaption: "Consent without pressure",
    thumbnailAlt: "Video thumbnail for ASK. LISTEN. RESPECT.",
    age: "Teens 13-17",
    topic: "Consent",
    summary: "A teen-friendly video that explains consent as asking clearly, listening carefully, and respecting boundaries without pressure.",
    points: ["Consent must be freely given.", "Silence is not consent.", "Pressure, guilt, or threats are warning signs."],
  },
  {
    title: "It's Giving Red Flags",
    contentType: "Video",
    videoId: "ETt8BnLbWwg",
    mediaLabel: "Play video",
    mediaUrl: "https://www.youtube.com/watch?v=ETt8BnLbWwg",
    imageCaption: "Healthy relationship signs",
    thumbnailAlt: "Video thumbnail for It's Giving Red Flags",
    age: "Teens 13-17",
    topic: "Healthy relationships",
    summary: "A direct video for teens on recognizing relationship warning signs such as control, monitoring, jealousy, and pressure.",
    points: ["Control is not care.", "You can keep friends and privacy.", "Ask for help if leaving feels unsafe."],
  },
  {
    title: "Dating After Sexual Assault",
    contentType: "Video",
    videoId: "rIxB8vlmAjY",
    mediaLabel: "Play video",
    mediaUrl: "https://www.youtube.com/watch?v=rIxB8vlmAjY",
    imageCaption: "Dating after harm",
    thumbnailAlt: "Video thumbnail for Dating After Sexual Assault",
    age: "Young adults 18+",
    topic: "Getting help",
    summary: "A supportive video for young adults about dating after harm, setting new boundaries, and moving at a pace that feels safe.",
    points: ["You get to choose your pace.", "Boundaries can change.", "Support can make hard conversations safer."],
  },
  {
    title: "AboutCONSENT",
    contentType: "Podcast/Audio",
    thumbnailUrl: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts115/v4/a1/c4/22/a1c42262-2978-61da-5336-a74245d5e360/mza_14304228428910261741.jpg/600x600bb.jpg",
    mediaLabel: "Listen to podcast",
    mediaUrl: "https://podcasts.apple.com/us/podcast/aboutconsent/id1474315911",
    imageCaption: "Podcast audio",
    thumbnailAlt: "AboutCONSENT podcast cover artwork",
    age: "Young adults 18+",
    topic: "Consent",
    summary: "A real podcast with conversations about consent, survivor-centered support, prevention, and safer community responses.",
    points: ["Consent is active communication.", "Culture shapes safety.", "Support should be survivor-centered."],
  },
  {
    title: "Strength To Care",
    contentType: "Video",
    videoId: "Atn-Q380_S4",
    mediaLabel: "Play video",
    mediaUrl: "https://www.youtube.com/watch?v=Atn-Q380_S4",
    imageCaption: "Community action",
    thumbnailAlt: "Video thumbnail for Strength To Care",
    age: "Young adults 18+",
    topic: "Community safety",
    summary: "A RAINN video about how friends, family, and community members can respond with belief, calm, and practical care.",
    points: ["Choose the safest intervention.", "Get help from others.", "Support the person afterward without pressure."],
  },
  {
    title: "Culture of Consent",
    contentType: "Podcast/Audio",
    thumbnailUrl: "https://i.scdn.co/image/ab6765630000ba8aa1bf153f4655d048359278e4",
    mediaLabel: "Listen to podcast",
    mediaUrl: "https://open.spotify.com/show/0CB75JXKisp8ilamE1YBnJ",
    imageCaption: "Podcast audio",
    thumbnailAlt: "Culture of Consent podcast cover artwork",
    age: "Parents & guardians",
    topic: "Trusted adults",
    summary: "A real podcast for caregivers and educators about normalizing consent, boundaries, and prevention conversations.",
    points: ["Use correct names for body parts.", "Avoid fear-based teaching.", "Thank children when they tell you something hard."],
  },
  {
    title: "Sex, Power, and Consent",
    contentType: "Podcast/Audio",
    thumbnailUrl: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts126/v4/f3/9b/de/f39bde5e-0a87-f52b-2ac1-f0a1f5add643/mza_1879752631854681806.png/600x600bb.jpg",
    mediaLabel: "Listen to podcast",
    mediaUrl: "https://www.who.int/podcasts/series/noexcuse/episode-23---sex--power-and-consent--decoding-sexual-misconduct",
    imageCaption: "Podcast audio",
    thumbnailAlt: "#NoExcuse podcast cover artwork",
    age: "Educators",
    topic: "Prevention education",
    summary: "A WHO podcast episode for educators and adults who want to understand power, consent, misconduct, and prevention.",
    points: ["Keep examples age-appropriate.", "Name reporting channels clearly.", "Do not ask students to disclose publicly."],
  },
  {
    title: "Both/And",
    contentType: "Podcast/Audio",
    thumbnailUrl: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/41/90/b7/4190b7c3-cf8f-652f-9816-7b6ff7ab76c0/mza_13255878296208075778.jpg/600x600bb.jpg",
    mediaLabel: "Listen to podcast",
    mediaUrl: "https://podcasts.apple.com/us/podcast/both-and-a-sexual-violence-prevention-podcast/id1622831700",
    imageCaption: "Podcast audio",
    thumbnailAlt: "Both/And podcast cover artwork",
    age: "Educators",
    topic: "Prevention education",
    summary: "A prevention podcast for deeper conversations about accountability, education, culture change, and safer communities.",
    points: ["Prevention is ongoing work.", "Communities need clear norms.", "Learning should lead to safer action."],
  },
];

const contentTypes = ["All", "Notes", "Video", "Podcast/Audio"];

const managementTypes = ["Notes", "Video", "Podcast/Audio", "Educational Book", "Article"];

const blankLesson = {
  title: "",
  contentType: "Notes",
  thumbnailUrl: "",
  thumbnailAlt: "",
  imageCaption: "",
  mediaLabel: "",
  mediaUrl: "",
  videoId: "",
  age: "Teens 13-17",
  topic: "Prevention education",
  summary: "",
  pointsText: "",
  publishedAt: new Date().toISOString().slice(0, 10),
  detailsIntro: "",
};

const noteDetails = {
  "Body boundaries": {
    intro: "Body boundaries are the rules a person has about their own body, personal space, touch, and privacy. Children should hear this in clear, calm language: they are allowed to say no to touch, move away, and tell a trusted adult when something feels confusing, scary, or uncomfortable.",
    explanation: [
      "A boundary can be physical, like not wanting a hug, or private, like closing the bathroom door.",
      "A safe adult does not punish a child for saying no to unwanted touch.",
      "Children should know they can keep asking for help until someone listens.",
    ],
    examples: [
      { situation: "Someone wants a hug and the child does not want one.", response: "The child can say, 'No thank you,' wave instead, or stand beside a trusted adult." },
      { situation: "Someone touches a private body part or asks to see one.", response: "The child should move away if possible and tell a trusted adult as soon as they can." },
      { situation: "An adult says, 'Do not tell anyone about this touch.'", response: "That is an unsafe secret. The child should tell a trusted adult, even if they were told not to." },
    ],
    practice: [
      "Practice saying: 'No, I do not want that.'",
      "Name three trusted adults the child can go to.",
      "Choose a safe signal the child can use when they need help leaving a situation.",
    ],
    check: [
      "Can a child say no to a hug from someone they know?",
      "Should unsafe secrets about touch be kept?",
      "Who are two trusted adults this child can talk to?",
    ],
  },
  "Safe and unsafe secrets": {
    intro: "This lesson helps children understand that some surprises are harmless, but secrets that create fear, shame, confusion, or pressure should be shared with a trusted adult. The goal is to remove the idea that a child must carry a frightening secret alone.",
    explanation: [
      "A safe surprise usually makes people happy and is revealed soon, like a birthday gift.",
      "An unsafe secret feels heavy, scary, embarrassing, or confusing.",
      "A child is not in trouble for telling a trusted adult about an unsafe secret.",
    ],
    examples: [
      { situation: "A sibling says, 'Do not tell Mom about her birthday card.'", response: "That is a surprise. It will be revealed soon and does not make anyone unsafe." },
      { situation: "Someone says, 'If you tell, people will be angry with you.'", response: "That is pressure. The child should tell a trusted adult." },
      { situation: "A child tells one adult and the adult does not listen.", response: "The child should tell another trusted adult. Asking again is allowed." },
    ],
    practice: [
      "Sort examples into 'safe surprise' and 'unsafe secret.'",
      "Practice saying: 'I need to tell you something, even if someone told me not to.'",
      "Write or say the names of three safe adults.",
    ],
    check: [
      "What makes a surprise different from an unsafe secret?",
      "Is it okay to tell an unsafe secret?",
      "What should a child do if the first adult does not help?",
    ],
  },
  "Consent in friendships": {
    intro: "Consent is not only about dating or sex. Preteens can learn consent through everyday friendship moments: hugs, photos, teasing, borrowing things, sitting close, games, and online sharing. The main idea is simple: ask, listen, and respect the answer.",
    explanation: [
      "Consent means someone freely agrees without pressure, fear, guilt, or embarrassment.",
      "A person can change their mind, even if they said yes before.",
      "Being friends with someone does not mean you can touch them, tease them, or post about them without asking.",
    ],
    examples: [
      { situation: "A friend says no to being in a group photo.", response: "Respect it. Take the photo without them or ask what they are comfortable with." },
      { situation: "A joke makes someone uncomfortable.", response: "Stop, apologize briefly, and do not repeat it." },
      { situation: "A friend agreed to a game yesterday but does not want to play today.", response: "Accept the new answer. Consent can change." },
    ],
    practice: [
      "Practice asking: 'Are you okay with this?'",
      "Practice responding to no: 'Okay, thanks for telling me.'",
      "Think of one online action that needs permission before doing it.",
    ],
    check: [
      "Can someone change their mind after saying yes?",
      "Does silence always mean yes?",
      "What is one respectful response when a friend says no?",
    ],
  },
};

function enrichLesson(lesson) {
  const nextLesson = noteDetails[lesson.title] ? { ...lesson, details: noteDetails[lesson.title] } : lesson;
  return {
    ...nextLesson,
    id: nextLesson.id || nextLesson.title,
    publishedAt: nextLesson.publishedAt || nextLesson.published_at || "2026-08-01",
  };
}

function getContentType(lesson) {
  return lesson.contentType || lesson.content_type || "Notes";
}

function getYoutubeId(lesson) {
  if (lesson.videoId || lesson.video_id) {
    return lesson.videoId || lesson.video_id;
  }

  const url = lesson.mediaUrl || lesson.media_url || "";
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return match?.[1] || "";
}

function getMediaUrl(lesson) {
  return lesson.mediaUrl || lesson.media_url || "";
}

function getMediaLabel(lesson) {
  const type = getContentType(lesson);
  if (lesson.mediaLabel || lesson.media_label) return lesson.mediaLabel || lesson.media_label;
  if (getYoutubeId(lesson)) return "Play video";
  if (type === "Podcast/Audio") return "Listen";
  if (type === "Educational Book") return "Open book";
  if (type === "Article") return "Read article";
  return "Open resource";
}

function getThumbnailSrc(lesson) {
  const youtubeId = getYoutubeId(lesson);
  if (getContentType(lesson) === "Video" && youtubeId) {
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }

  if (lesson.thumbnailUrl || lesson.thumbnail_url) {
    return lesson.thumbnailUrl || lesson.thumbnail_url;
  }

  return thumbnails[lesson.thumbnailKey || lesson.thumbnail_key] || imageChoice;
}

export default function AwarenessHub({ notify, currentUser }) {
  const { isFrench } = useLanguage();
  const [items, setItems] = useState(lessons.map(enrichLesson));
  const [age, setAge] = useState("All ages");
  const [topic, setTopic] = useState("All topics");
  const [contentType, setContentType] = useState("All");
  const [query, setQuery] = useState("");
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  const [form, setForm] = useState(blankLesson);
  const [editingId, setEditingId] = useState("");
  const canManage = ["government", "ngo", "admin"].includes(currentUser?.role);

  useEffect(() => {
    apiRequest("/api/awareness/lessons")
      .then((data) => setItems(data.lessons.map(enrichLesson)))
      .catch(() => undefined);
  }, [notify]);

  useEffect(() => {
    const shouldLockScroll = Boolean(activeNote || activeVideo);
    document.body.classList.toggle("modal-open", shouldLockScroll);

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [activeNote, activeVideo]);

  const visibleLessons = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((lesson) => {
      const matchesAge = age === "All ages" || lesson.age === age;
      const matchesTopic = topic === "All topics" || lesson.topic === topic;
      const matchesType = contentType === "All" || getContentType(lesson) === contentType;
      const matchesQuery = !normalized || [lesson.title, lesson.age, lesson.topic, lesson.summary, ...lesson.points]
        .join(" ")
        .toLowerCase()
        .includes(normalized);

      return matchesAge && matchesTopic && matchesType && matchesQuery;
    });
  }, [age, contentType, items, topic, query]);

  const availableAgeGroups = useMemo(() => ["All ages", ...Array.from(new Set(items.map((lesson) => lesson.age)))], [items]);
  const availableTopics = useMemo(() => ["All topics", ...Array.from(new Set(items.map((lesson) => lesson.topic)))], [items]);
  const visibleContentTypes = useMemo(() => ["All", ...Array.from(new Set([...contentTypes.slice(1), ...items.map(getContentType), ...managementTypes]))], [items]);

  const setFormField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const lessonPayload = () => ({
    title: form.title,
    contentType: form.contentType,
    thumbnailUrl: form.thumbnailUrl,
    thumbnailAlt: form.thumbnailAlt,
    imageCaption: form.imageCaption || form.contentType,
    mediaLabel: form.mediaLabel,
    mediaUrl: form.mediaUrl,
    videoId: form.videoId,
    age: form.age,
    topic: form.topic,
    summary: form.summary,
    points: form.pointsText.split("\n").map((item) => item.trim()).filter(Boolean),
    publishedAt: form.publishedAt,
    details: form.detailsIntro ? { intro: form.detailsIntro, explanation: [], examples: [], practice: [], check: [] } : {},
  });

  const resetManagementForm = () => {
    setEditingId("");
    setForm(blankLesson);
  };

  const saveLesson = (event) => {
    event.preventDefault();
    const payload = lessonPayload();
    const localLesson = enrichLesson({ ...payload, id: editingId || `${payload.title}-${Date.now()}` });
    const method = editingId ? "PUT" : "POST";
    const path = editingId ? `/api/awareness/lessons/${encodeURIComponent(editingId)}` : "/api/awareness/lessons";

    setItems((current) => editingId ? current.map((item) => item.id === editingId ? localLesson : item) : [localLesson, ...current]);
    apiRequest(path, { method, headers: { "X-Harbor-Role": canManage ? currentUser.role : "community" }, body: JSON.stringify(payload) })
      .then((data) => {
        setItems((current) => current.map((item) => item.id === localLesson.id ? enrichLesson(data.lesson) : item));
        notify(data.message);
      })
      .catch(() => notify(editingId ? "Content updated locally." : "Content added locally."));
    resetManagementForm();
  };

  const editLesson = (lesson) => {
    setEditingId(lesson.id || lesson.title);
    setForm({
      title: lesson.title || "",
      contentType: getContentType(lesson),
      thumbnailUrl: lesson.thumbnailUrl || lesson.thumbnail_url || "",
      thumbnailAlt: lesson.thumbnailAlt || lesson.thumbnail_alt || "",
      imageCaption: lesson.imageCaption || lesson.image_caption || "",
      mediaLabel: lesson.mediaLabel || lesson.media_label || "",
      mediaUrl: lesson.mediaUrl || lesson.media_url || "",
      videoId: lesson.videoId || lesson.video_id || "",
      age: lesson.age || "Teens 13-17",
      topic: lesson.topic || "Prevention education",
      summary: lesson.summary || "",
      pointsText: (lesson.points || []).join("\n"),
      publishedAt: lesson.publishedAt || "2026-08-01",
      detailsIntro: lesson.details?.intro || "",
    });
  };

  const deleteLesson = (lesson) => {
    const lessonId = lesson.id || lesson.title;
    setItems((current) => current.filter((item) => item.id !== lessonId));
    apiRequest(`/api/awareness/lessons/${encodeURIComponent(lessonId)}`, { method: "DELETE", headers: { "X-Harbor-Role": canManage ? currentUser.role : "community" } })
      .then((data) => notify(data.message))
      .catch(() => notify("Content deleted locally."));
  };

  const readFileAsDataUrl = (field, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFormField(field, reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <section id="awareness" className="app-section muted-band" aria-labelledby="awareness-title">
      <SectionHeading eyebrow={isFrench ? "Sensibilisation" : "Awareness Hub"} title={isFrench ? "Education simple et adaptee a l'age." : "Age-appropriate safety education."}>
        {isFrench ? "Apprenez avec des notes courtes, des videos et des audios sur le consentement, les limites, la securite en ligne et l'aide." : "Learn through short notes, YouTube-style video resources, and audio discussions about consent, boundaries, online safety, relationships, and getting help."}
      </SectionHeading>

      <div className="content-tabs" aria-label="Awareness content type">
        {visibleContentTypes.map((type) => (
          <button className={contentType === type ? "active" : ""} type="button" key={type} onClick={() => setContentType(type)}>
            {type}
          </button>
        ))}
      </div>

      {canManage && (
        <form className="awareness-manager" onSubmit={saveLesson}>
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Official content manager</p>
              <h3>{editingId ? "Edit awareness content" : "Add awareness content"}</h3>
            </div>
            {editingId && <button className="button ghost" type="button" onClick={resetManagementForm}>Cancel edit</button>}
          </div>
          <div className="form-grid">
            <label className="field"><span>Title</span><input required value={form.title} onChange={(event) => setFormField("title", event.target.value)} placeholder="Example: Love does not hurt" /></label>
            <label className="field"><span>Content type</span><select value={form.contentType} onChange={(event) => setFormField("contentType", event.target.value)}>{managementTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <div className="form-grid">
            <label className="field"><span>Audience</span><input value={form.age} onChange={(event) => setFormField("age", event.target.value)} placeholder="Teens 13-17, Parents, Educators" /></label>
            <label className="field"><span>Topic</span><input value={form.topic} onChange={(event) => setFormField("topic", event.target.value)} placeholder="Domestic violence, consent, reporting" /></label>
          </div>
          <label className="field"><span>Short summary</span><textarea required rows="3" value={form.summary} onChange={(event) => setFormField("summary", event.target.value)} placeholder="Explain what people will learn in simple language." /></label>
          <label className="field"><span>Key points <small>one per line</small></span><textarea rows="4" value={form.pointsText} onChange={(event) => setFormField("pointsText", event.target.value)} placeholder={"Domestic violence is a crime.\nLove does not hurt.\nCall 116, 117, or 118 for help."} /></label>
          <div className="form-grid">
            <label className="field"><span>Published date</span><input type="date" value={form.publishedAt} onChange={(event) => setFormField("publishedAt", event.target.value)} /></label>
            <label className="field"><span>Button label</span><input value={form.mediaLabel} onChange={(event) => setFormField("mediaLabel", event.target.value)} placeholder="Play video, Listen, Open book, Read article" /></label>
          </div>
          <div className="form-grid">
            <label className="field"><span>Media link</span><input value={form.mediaUrl} onChange={(event) => setFormField("mediaUrl", event.target.value)} placeholder="YouTube, podcast, PDF, article, or audio link" /></label>
            <label className="field"><span>YouTube video ID <small>optional</small></span><input value={form.videoId} onChange={(event) => setFormField("videoId", event.target.value)} placeholder="Only if using YouTube" /></label>
          </div>
          <div className="form-grid">
            <label className="field"><span>Thumbnail image link</span><input value={form.thumbnailUrl} onChange={(event) => setFormField("thumbnailUrl", event.target.value)} placeholder="Leave empty to use YouTube thumbnail" /></label>
            <label className="field"><span>Upload thumbnail</span><input type="file" accept="image/*" onChange={(event) => readFileAsDataUrl("thumbnailUrl", event.target.files?.[0])} /></label>
          </div>
          <div className="form-grid">
            <label className="field"><span>Upload video/audio/book</span><input type="file" accept="video/*,audio/*,.pdf,.doc,.docx" onChange={(event) => readFileAsDataUrl("mediaUrl", event.target.files?.[0])} /></label>
            <label className="field"><span>Image caption</span><input value={form.imageCaption} onChange={(event) => setFormField("imageCaption", event.target.value)} placeholder="Campaign poster, audio lesson, book cover" /></label>
          </div>
          <label className="field"><span>More text <small>optional</small></span><textarea rows="4" value={form.detailsIntro} onChange={(event) => setFormField("detailsIntro", event.target.value)} placeholder="Add deeper explanation, classroom notes, or article text." /></label>
          <button className="button primary" type="submit">{editingId ? "Save content changes" : "Publish content"}</button>
        </form>
      )}

      <div className="filter-bar" aria-label="Awareness filters">
        <label>
          <span className="sr-only">{isFrench ? "Age" : "Age group"}</span>
          <select value={age} onChange={(event) => setAge(event.target.value)}>
            {availableAgeGroups.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">{isFrench ? "Sujet" : "Topic"}</span>
          <select value={topic} onChange={(event) => setTopic(event.target.value)}>
            {availableTopics.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">{isFrench ? "Recherche" : "Search"}</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isFrench ? "Chercher le contenu" : "Search awareness content"} />
        </label>
      </div>

      <div className="support-grid awareness-grid" aria-live="polite">
        {visibleLessons.map((lesson) => {
          const contentLabel = getContentType(lesson);
          const mediaUrl = getMediaUrl(lesson);
          const youtubeId = getYoutubeId(lesson);

          return (
          <article className="support-card awareness-card" key={lesson.id || lesson.title}>
            <figure className="awareness-thumb">
              <img
                src={getThumbnailSrc(lesson)}
                alt={lesson.thumbnailAlt || lesson.thumbnail_alt || ""}
              />
              {youtubeId && (
                <button className="play-overlay" type="button" onClick={() => setActiveVideo(lesson)} aria-label={`Play ${lesson.title}`}>
                  <span aria-hidden="true" />
                </button>
              )}
              {!youtubeId && contentLabel === "Podcast/Audio" && (
                <a className="audio-overlay" href={mediaUrl} target="_blank" rel="noreferrer" aria-label={`Listen to ${lesson.title}`}>
                  <span className="audio-icon" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                </a>
              )}
              <figcaption>{lesson.imageCaption || lesson.image_caption || contentLabel}</figcaption>
            </figure>
            <div className="pill-row">
              <span className="pill">{contentLabel}</span>
              <span className="pill">{lesson.age}</span>
              <span className="pill">{lesson.topic}</span>
              <span className="pill">Published {lesson.publishedAt}</span>
            </div>
            <h3>{lesson.title}</h3>
            <p>{lesson.summary}</p>
            <ul className="lesson-points">
              {lesson.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
            {mediaUrl && youtubeId && (
              <button className="media-link" type="button" onClick={() => setActiveVideo(lesson)}>
                {getMediaLabel(lesson)}
              </button>
            )}
            {mediaUrl && !youtubeId && contentLabel !== "Video" && (
              <a className="media-link" href={mediaUrl} target="_blank" rel="noreferrer">
                {getMediaLabel(lesson)}
              </a>
            )}
            {contentLabel === "Notes" && (
              <button className="media-link" type="button" onClick={() => setActiveNote(lesson)}>
                Read more
              </button>
            )}
            {["Article", "Educational Book"].includes(contentLabel) && !mediaUrl && (
              <button className="media-link" type="button" onClick={() => setActiveNote(lesson)}>
                {contentLabel === "Article" ? "Read article" : "Open book notes"}
              </button>
            )}
            {canManage && (
              <div className="official-actions awareness-actions">
                <button className="button secondary" type="button" onClick={() => editLesson(lesson)}>Edit</button>
                <button className="delete-story-button" type="button" onClick={() => deleteLesson(lesson)}>Delete</button>
              </div>
            )}
          </article>
          );
        })}
      </div>

      {activeNote && createPortal((
        <div className="lesson-modal" role="dialog" aria-modal="true" aria-labelledby="lesson-modal-title">
          <button className="lesson-modal-backdrop" type="button" onClick={() => setActiveNote(null)} aria-label="Close lesson" />
          <div className="lesson-modal-panel">
            <div className="lesson-modal-head">
              <button className="lesson-back-button" type="button" onClick={() => setActiveNote(null)} aria-label="Back to awareness">
                <span aria-hidden="true">‹</span>
                Back
              </button>
              <div>
                <p className="eyebrow">{activeNote.age} | {activeNote.topic}</p>
                <h3 id="lesson-modal-title">{activeNote.title}</h3>
              </div>
            </div>

            <div className="lesson-modal-body">
              <section className="lesson-detail-intro">
                <img src={getThumbnailSrc(activeNote)} alt={activeNote.thumbnailAlt || activeNote.thumbnail_alt || ""} />
                <p>{activeNote.details?.intro || activeNote.summary}</p>
              </section>

              <section className="lesson-detail-section">
                <h4>What this means</h4>
                <ul>
                  {(activeNote.details?.explanation || activeNote.points).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>

              <section className="lesson-detail-section">
                <h4>Examples</h4>
                <div className="scenario-list">
                  {(activeNote.details?.examples || []).map((example) => (
                    <details key={example.situation}>
                      <summary>{example.situation}</summary>
                      <p>{example.response}</p>
                    </details>
                  ))}
                </div>
              </section>

              <section className="lesson-detail-section">
                <h4>Try it</h4>
                <div className="practice-grid">
                  {(activeNote.details?.practice || []).map((item) => (
                    <label key={item}>
                      <input type="checkbox" />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="lesson-detail-section">
                <h4>Quick reflection</h4>
                <textarea placeholder="Type a private thought or answer here. This is not saved." />
                <div className="reflection-list">
                  {(activeNote.details?.check || []).map((item) => <span key={item}>{item}</span>)}
                </div>
              </section>
            </div>
          </div>
        </div>
      ), document.body)}

      {activeVideo && createPortal((
        <div className="video-modal" role="dialog" aria-modal="true" aria-labelledby="video-modal-title">
          <button className="video-modal-backdrop" type="button" onClick={() => setActiveVideo(null)} aria-label="Close video" />
          <div className="video-modal-panel">
            <div className="video-modal-head">
              <h3 id="video-modal-title">{activeVideo.title}</h3>
              <button type="button" onClick={() => setActiveVideo(null)} aria-label="Close video">x</button>
            </div>
            <iframe
              title={activeVideo.title}
              src={`https://www.youtube.com/embed/${getYoutubeId(activeVideo)}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      ), document.body)}
    </section>
  );
}
