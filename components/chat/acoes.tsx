"use client";

import * as React from "react";

/**
 * Ponte entre os cards de resultado e o chat.
 *
 * Um card de voo precisa poder dizer "reservar este" sem conhecer o useChat, e
 * favoritar sem saber que existe um comparador. Ambos passam por aqui.
 */

export type ItemFavorito = {
  tipo: "FLIGHT" | "HOTEL";
  refId: string;
  snapshot: unknown;
};

type Acoes = {
  /** Envia uma mensagem ao agente como se o usuário tivesse escrito. */
  perguntar: (texto: string) => void;
  /** Guarda a opção para comparar depois. */
  favoritar: (item: ItemFavorito) => void;
  favoritados: Set<string>;
  ocupado: boolean;
};

const Contexto = React.createContext<Acoes | null>(null);

export function ProvedorDeAcoes({
  valor,
  children,
}: {
  valor: Acoes;
  children: React.ReactNode;
}) {
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/**
 * Fora do chat (na tela de reservas, por exemplo) os cards continuam
 * renderizando: as ações viram no-op em vez de quebrar a árvore.
 */
export function useAcoes(): Acoes {
  return (
    React.useContext(Contexto) ?? {
      perguntar: () => {},
      favoritar: () => {},
      favoritados: new Set<string>(),
      ocupado: false,
    }
  );
}
