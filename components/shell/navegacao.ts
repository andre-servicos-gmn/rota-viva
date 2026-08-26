import {
  CalendarRange,
  Columns3,
  MessagesSquare,
  Route,
  Ticket,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type ItemNav = {
  href: string;
  rotulo: string;
  icone: LucideIcon;
  /** Fase em que a tela ganha conteúdo real — usado no aviso de área em construção. */
  fase: number;
};

export const NAVEGACAO: ItemNav[] = [
  { href: "/chat", rotulo: "Chat", icone: MessagesSquare, fase: 1 },
  { href: "/reservas", rotulo: "Minhas reservas", icone: Ticket, fase: 3 },
  { href: "/comparador", rotulo: "Comparador", icone: Columns3, fase: 4 },
  { href: "/roteiro", rotulo: "Roteiro", icone: Route, fase: 4 },
  { href: "/perfil", rotulo: "Perfil", icone: UserRound, fase: 4 },
];

export const NAV_INTERNA: ItemNav = {
  href: "/atendente",
  rotulo: "Painel do atendente",
  icone: CalendarRange,
  fase: 3,
};
