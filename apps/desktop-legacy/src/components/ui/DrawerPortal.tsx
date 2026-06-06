import { createPortal } from "react-dom";

type Props = { children: React.ReactNode };

export function DrawerPortal({ children }: Props) {
  return createPortal(children, document.body);
}
