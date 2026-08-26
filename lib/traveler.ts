import { cookies } from "next/headers";
import { db } from "@/lib/db";

/**
 * Identidade na POC: não há autenticação.
 *
 * Um viajante de demonstração é criado na primeira visita e guardado num cookie.
 * Isso basta para "Minhas reservas", perfil e alertas funcionarem de ponta a ponta.
 * Em produção, isto vira sessão autenticada (e o painel do atendente vira rota
 * protegida por papel).
 */

const COOKIE = "rv_viajante";

export const VIAJANTE_DEMO = {
  email: "helena.braga@exemplo.com.br",
  nome: "Helena Braga",
  telefone: "+55 11 90000-0000",
} as const;

export async function viajanteAtual() {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;

  if (id) {
    const existente = await db.traveler.findUnique({ where: { id } });
    if (existente) return existente;
  }

  // Sem cookie válido: reaproveita o viajante de demonstração pelo e-mail.
  return db.traveler.upsert({
    where: { email: VIAJANTE_DEMO.email },
    update: {},
    create: {
      email: VIAJANTE_DEMO.email,
      nome: VIAJANTE_DEMO.nome,
      telefone: VIAJANTE_DEMO.telefone,
      prefs: JSON.stringify({
        assento: "corredor",
        ciaPreferida: null,
        restricaoAlimentar: null,
        fidelidade: [],
      }),
      documentos: "[]",
    },
  });
}

/**
 * Grava o cookie do viajante. Só pode ser chamado de Route Handler ou Server
 * Action — um Server Component não escreve cookie.
 */
export async function fixarViajante(id: string) {
  const jar = await cookies();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
