import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Button, EmptyState, PageHeader } from "../../components/ui";
import "./Foro.css";

const API_URL = import.meta.env.VITE_API_URL;

type User = { id_usuario: number; nickname?: string; nombre_usuario?: string };
type Subforum = { id: number; slug: string; name: string; description: string | null };
type Author = {
  id_usuario: number;
  nickname?: string | null;
  nombre_usuario?: string | null;
  foto_perfil?: string | null;
};
type ForumPost = {
  id: number;
  subforum_id: number;
  id_usuario: number;
  title: string;
  body: string;
  image_url?: string | null;
  created_at: string;
  published_at?: string | null;
  subforum?: Subforum;
  usuario?: Author;
  score: number;
  my_vote: number;
  comments_count: number;
};
type ForumComment = {
  id: number;
  post_id: number;
  id_usuario: number;
  body: string;
  created_at: string;
  usuario?: Author;
  score: number;
  my_vote: number;
};
type SortMode = "hot" | "recent" | "top" | "commented";
type NormalizedImage = { dataUrl: string; width: number; height: number };

const SORTS: Array<{ key: SortMode; label: string }> = [
  { key: "hot", label: "Hot" },
  { key: "recent", label: "Recientes" },
  { key: "top", label: "Top" },
  { key: "commented", label: "Comentados" },
];

function getName(author?: Author | null) {
  return author?.nickname || author?.nombre_usuario || "Usuario";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function normalizeImage(file: File): Promise<NormalizedImage> {
  if (!file.type.match(/^image\/(png|jpe?g|webp)$/)) {
    throw new Error("Usa una imagen PNG, JPG o WebP");
  }

  const img = document.createElement("img");
  const url = URL.createObjectURL(file);

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("No se pudo leer la imagen"));
      img.src = url;
    });

    const maxSide = 1280;
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo procesar la imagen");
    ctx.drawImage(img, 0, 0, width, height);
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.84), width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || "Error de servidor");
  }
  return json;
}

export default function Foro({ user }: { user: User }) {
  const navigate = useNavigate();
  const { postId } = useParams();
  const [subforums, setSubforums] = useState<Subforum[]>([]);
  const [selectedSubforum, setSelectedSubforum] = useState("tottenham");
  const [sort, setSort] = useState<SortMode>("hot");
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [postForm, setPostForm] = useState({ title: "", body: "" });
  const [image, setImage] = useState<NormalizedImage | null>(null);
  const [imageError, setImageError] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const currentSubforum = useMemo(
    () => subforums.find((subforum) => subforum.slug === selectedSubforum) || subforums[0],
    [selectedSubforum, subforums],
  );
  const detailPostId = postId ? Number(postId) : null;

  const api = useCallback(async <T,>(path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const response = await fetch(`${API_URL}${path}`, { ...init, credentials: "include", headers });
    return parseJson<T>(response);
  }, []);

  const showNotice = (text: string, ok = true) => {
    setNotice({ text, ok });
    window.setTimeout(() => setNotice(null), 3200);
  };

  const loadSubforums = useCallback(async () => {
    const json = await api<{ data: Subforum[] }>("/api/foro/subforos");
    setSubforums(json.data || []);
    if (json.data?.length && !json.data.some((item) => item.slug === selectedSubforum)) {
      setSelectedSubforum(json.data[0].slug);
    }
  }, [api, selectedSubforum]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ sort });
      if (selectedSubforum) query.set("subforo", selectedSubforum);
      const json = await api<{ data: ForumPost[] }>(`/api/foro/posts?${query.toString()}`);
      setPosts(json.data || []);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "No se pudo cargar el foro", false);
    } finally {
      setLoading(false);
    }
  }, [api, selectedSubforum, sort]);

  const loadDetail = useCallback(async (postId: number) => {
    setDetailLoading(true);
    try {
      const json = await api<{ data: { post: ForumPost; comments: ForumComment[] } }>(`/api/foro/posts/${postId}`);
      setSelectedPost(json.data.post);
      setComments(json.data.comments || []);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "No se pudo cargar la discusion", false);
      setSelectedPostId(null);
    } finally {
      setDetailLoading(false);
    }
  }, [api]);

  useEffect(() => { void loadSubforums(); }, [loadSubforums]);
  useEffect(() => { void loadPosts(); }, [loadPosts]);
  useEffect(() => {
    if (detailPostId) void loadDetail(detailPostId);
    else {
      setSelectedPost(null);
      setComments([]);
    }
  }, [loadDetail, detailPostId]);

  const submitPost = async () => {
    if (!currentSubforum) return;
    if (postForm.title.trim().length < 4 || postForm.body.trim().length < 1) {
      showNotice("Completa título y contenido", false);
      return;
    }

    setPosting(true);
    try {
      const json = await api<{ data: ForumPost; pendingReview?: boolean }>("/api/foro/posts", {
        method: "POST",
        body: JSON.stringify({
          subforum_id: currentSubforum.id,
          title: postForm.title.trim(),
          body: postForm.body.trim(),
          image,
        }),
      });
      setPostForm({ title: "", body: "" });
      setImage(null);
      if (json.pendingReview) showNotice("Tu publicación quedó pendiente de revisión");
      else {
        showNotice("Publicación creada");
        await loadPosts();
        setCreateOpen(false);
        navigate(`/foro/${json.data.id}`);
      }
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "No se pudo publicar", false);
    } finally {
      setPosting(false);
    }
  };

  const submitComment = async () => {
    if (!selectedPost || commentText.trim().length < 1) return;
    setCommenting(true);
    try {
      const json = await api<{ data: ForumComment; pendingReview?: boolean }>(`/api/foro/posts/${selectedPost.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: commentText.trim() }),
      });
      setCommentText("");
      if (json.pendingReview) showNotice("Tu comentario quedo pendiente de revision");
      else setComments((prev) => [...prev, json.data]);
      await loadPosts();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "No se pudo comentar", false);
    } finally {
      setCommenting(false);
    }
  };

  const vote = async (kind: "post" | "comment", id: number, currentVote: number, next: 1 | -1) => {
    const value = currentVote === next ? 0 : next;
    const path = kind === "post" ? `/api/foro/posts/${id}/vote` : `/api/foro/comments/${id}/vote`;
    try {
      await api(path, { method: "POST", body: JSON.stringify({ value }) });
      await loadPosts();
      if (detailPostId) await loadDetail(detailPostId);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "No se pudo votar", false);
    }
  };

  const report = async (targetType: "post" | "comment", targetId: number) => {
    const reason = window.prompt("Motivo del reporte");
    if (!reason?.trim()) return;
    try {
      await api("/api/foro/reports", {
        method: "POST",
        body: JSON.stringify({ target_type: targetType, target_id: targetId, reason: reason.trim() }),
      });
      showNotice("Reporte enviado");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "No se pudo reportar", false);
    }
  };

  const removeOwn = async (kind: "post" | "comment", id: number) => {
    try {
      await api(kind === "post" ? `/api/foro/posts/${id}` : `/api/foro/comments/${id}`, { method: "DELETE" });
      showNotice(kind === "post" ? "Post eliminado" : "Comentario eliminado");
      if (kind === "post") {
        navigate("/foro");
        await loadPosts();
      } else if (detailPostId) {
        await loadDetail(detailPostId);
      }
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "No se pudo eliminar", false);
    }
  };

  const handleImage = async (file: File | null) => {
    setImageError("");
    if (!file) {
      setImage(null);
      return;
    }
    try {
      setImage(await normalizeImage(file));
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Imagen invalida");
      setImage(null);
    }
  };

  const createPostModal = createOpen
    ? createPortal(
        <div className="forum-create-backdrop" onClick={() => setCreateOpen(false)}>
          <section className="forum-composer forum-create-modal" onClick={(event) => event.stopPropagation()}>
            <div className="forum-create-head">
              <div>
                <Badge tone="accent">/{currentSubforum?.slug || "foro"}</Badge>
                <h2>Nueva discusion</h2>
              </div>
              <button type="button" aria-label="Cerrar" onClick={() => setCreateOpen(false)}>×</button>
            </div>
            <input
              className="ph-input"
              value={postForm.title}
              onChange={(event) => setPostForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Título de la discusión"
              maxLength={160}
            />
            <textarea
              value={postForm.body}
              onChange={(event) => setPostForm((prev) => ({ ...prev, body: event.target.value }))}
              placeholder="Que quieres debatir?"
              rows={5}
            />
            <div className="forum-image-row">
              <label className="forum-file">
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void handleImage(event.target.files?.[0] || null)} />
                Imagen opcional
              </label>
              {image && <button type="button" onClick={() => setImage(null)}>Quitar imagen</button>}
              {imageError && <span>{imageError}</span>}
            </div>
            {image && <img src={image.dataUrl} alt="Preview" className="forum-preview" />}
            <div className="forum-composer-actions">
              <span>{postForm.title.length}/160</span>
              <Button type="button" onClick={submitPost} disabled={posting}>{posting ? "Publicando..." : "Publicar"}</Button>
            </div>
          </section>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="forum-page">
      {createPostModal}
      {notice && <div className={notice.ok ? "forum-toast is-ok" : "forum-toast is-error"}>{notice.text}</div>}
      {!detailPostId && (
        <div className="forum-topbar">
          <PageHeader
            eyebrow="Foro"
            title="Discusiones PremierHub"
            subtitle="Publica, vota y comenta con la comunidad. El contenido sensible se revisa antes de aparecer."
          />
          <button type="button" className="forum-create-btn" onClick={() => setCreateOpen(true)}>
            Crear post
          </button>
        </div>
      )}

      {detailPostId ? (
        <div className="forum-layout forum-layout--detail">
          <main className="forum-detail-page">
            <button type="button" className="forum-back" onClick={() => navigate("/foro")}>
              Volver al foro
            </button>
            <aside className="forum-detail">
              {detailLoading || !selectedPost ? (
                <p className="forum-muted">Cargando detalle...</p>
              ) : (
                <div className="forum-thread">
                  <div className="forum-thread-head">
                    <Badge tone="navy">/{selectedPost.subforum?.slug}</Badge>
                    <h2>{selectedPost.title}</h2>
                    <p>{selectedPost.body}</p>
                    {selectedPost.image_url && <img src={selectedPost.image_url} alt="" className="forum-thread-image" />}
                  </div>
                  <div className="forum-comment-box">
                    <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Responder..." rows={3} />
                    <Button type="button" onClick={submitComment} disabled={commenting || !commentText.trim()}>{commenting ? "Enviando..." : "Comentar"}</Button>
                  </div>
                  <div className="forum-comments">
                    {comments.map((comment) => (
                      <article key={comment.id} className="forum-comment">
                        <div className="forum-comment-top">
                          <strong>{getName(comment.usuario)}</strong>
                          <span>{formatDate(comment.created_at)}</span>
                        </div>
                        <p>{comment.body}</p>
                        <div className="forum-comment-actions">
                          <button type="button" className={comment.my_vote === 1 ? "is-active" : ""} onClick={() => void vote("comment", comment.id, comment.my_vote, 1)}>▲</button>
                          <strong>{comment.score}</strong>
                          <button type="button" className={comment.my_vote === -1 ? "is-active" : ""} onClick={() => void vote("comment", comment.id, comment.my_vote, -1)}>▼</button>
                          <button type="button" onClick={() => void report("comment", comment.id)}>Reportar</button>
                          {comment.id_usuario === user.id_usuario && <button type="button" onClick={() => void removeOwn("comment", comment.id)}>Borrar</button>}
                        </div>
                      </article>
                    ))}
                    {comments.length === 0 && <p className="forum-muted">Sin comentarios todavia.</p>}
                  </div>
                </div>
              )}
            </aside>
          </main>
        </div>
      ) : (
        <div className="forum-layout">
          <aside className="forum-sidebar">
            <h2>Subforos</h2>
            {subforums.map((subforum) => (
              <button
                key={subforum.id}
                type="button"
                onClick={() => { setSelectedSubforum(subforum.slug); navigate("/foro"); }}
                className={selectedSubforum === subforum.slug ? "forum-subforum is-active" : "forum-subforum"}
              >
                <strong>{subforum.name}</strong>
                {subforum.description && <span>{subforum.description}</span>}
              </button>
            ))}
          </aside>

          <main className="forum-main">
          <div className="forum-toolbar">
            {SORTS.map((item) => (
              <button key={item.key} type="button" onClick={() => setSort(item.key)} className={sort === item.key ? "is-active" : ""}>
                {item.label}
              </button>
            ))}
          </div>

          {loading ? <p className="forum-muted">Cargando discusiones...</p> : posts.length === 0 ? (
            <EmptyState title="Aún no hay discusiones" description="Sé el primero en abrir una conversación en este subforo." />
          ) : (
            <div className="forum-feed">
              {posts.map((post) => (
                <article key={post.id} className="forum-post">
                  <div className="forum-votes">
                    <button type="button" className={post.my_vote === 1 ? "is-active" : ""} onClick={() => void vote("post", post.id, post.my_vote, 1)}>▲</button>
                    <strong>{post.score}</strong>
                    <button type="button" className={post.my_vote === -1 ? "is-active" : ""} onClick={() => void vote("post", post.id, post.my_vote, -1)}>▼</button>
                  </div>
                  <button type="button" className="forum-post-body" onClick={() => navigate(`/foro/${post.id}`)}>
                    <div className="forum-post-meta">
                      <span>/{post.subforum?.slug}</span>
                      <span>{getName(post.usuario)}</span>
                      <span>{formatDate(post.published_at || post.created_at)}</span>
                    </div>
                    <h3>{post.title}</h3>
                    <p>{post.body}</p>
                    {post.image_url && <img src={post.image_url} alt="" className="forum-post-image" />}
                    <div className="forum-post-footer">
                      <span>{post.comments_count} comentarios</span>
                      <span>Ver discusion</span>
                    </div>
                  </button>
                  <div className="forum-post-actions">
                    <button type="button" onClick={() => void report("post", post.id)}>Reportar</button>
                    {post.id_usuario === user.id_usuario && <button type="button" onClick={() => void removeOwn("post", post.id)}>Borrar</button>}
                  </div>
                </article>
              ))}
            </div>
          )}
          </main>
        </div>
      )}
    </div>
  );
}
