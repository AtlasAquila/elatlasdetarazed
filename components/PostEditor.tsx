"use client";

import { useActionState } from "react";
import { savePost, type PostFormState } from "@/app/actions/posts";
import { BLOG_CATEGORIES, type PostKind } from "@/lib/post-shared";
import type { Post } from "@/lib/posts";

export function PostEditor({ post, saved, kind = "clima" }: { post?: Post; saved?: boolean; kind?: PostKind }) {
  const [state, action, pending] = useActionState<PostFormState, FormData>(savePost, saved ? { message: "Guardado." } : {});
  const effectiveKind = post?.kind ?? kind;
  const isBlog = effectiveKind === "blog";
  return (
    <form action={action} className="form">
      <input type="hidden" name="id" value={post?.id ?? ""} />
      <input type="hidden" name="kind" value={effectiveKind} />
      <div className="field">
        <label htmlFor="title">Título</label>
        <input id="title" name="title" className="input" required defaultValue={post?.title} placeholder={isBlog ? "El mito de Perséfone" : "Luna llena en Aries"} />
      </div>
      <div className="grid-2" style={{ gap: 20 }}>
        {isBlog ? (
          <div className="field">
            <label htmlFor="category">Temática</label>
            <select id="category" name="category" className="input" required defaultValue={post?.category ?? ""}>
              <option value="" disabled>
                Elige una temática
              </option>
              {Object.entries(BLOG_CATEGORIES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="week_start">Semana (lunes)</label>
            <input id="week_start" name="week_start" type="date" className="input" defaultValue={post?.week_start ?? ""} />
          </div>
        )}
        <div className="field">
          <label htmlFor="slug">Dirección web (opcional)</label>
          <input id="slug" name="slug" className="input" defaultValue={post?.slug} placeholder="se crea a partir del título" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="excerpt">Resumen (una o dos frases)</label>
        <input id="excerpt" name="excerpt" className="input" defaultValue={post?.excerpt} maxLength={300} />
      </div>
      <div className="field">
        <label htmlFor="body">Texto</label>
        <textarea id="body" name="body" className="textarea" required defaultValue={post?.body} />
        <span className="small muted">
          Deja una línea en blanco entre párrafos. «## » al principio de una línea crea un subtítulo; «- » crea una lista; **así** va en negrita.
        </span>
      </div>
      {state.error && (
        <p className="notice notice-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="notice notice-ok" role="status">
          {state.message}
        </p>
      )}
      <div className="actions">
        <button type="submit" name="intent" value="publish" className="btn btn-primary" disabled={pending}>
          {post?.published ? "Guardar cambios" : "Publicar"}
        </button>
        <button type="submit" name="intent" value="draft" className="btn btn-ghost" disabled={pending}>
          {post?.published ? "Pasar a borrador" : "Guardar borrador"}
        </button>
      </div>
    </form>
  );
}
