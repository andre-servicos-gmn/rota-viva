import { redirect } from "next/navigation";

// O produto começa no chat: a raiz não tem conteúdo próprio.
export default function Raiz() {
  redirect("/chat");
}
