import type { ReactNode } from 'react';

type ButtonProps = {
  children: ReactNode;
  kind?: string;
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
};

/** The single button used across every page. Renders a link when `href` is given. */
export function Button({ children, kind = 'primary', onClick, href, type = 'button', disabled = false }: ButtonProps) {
  if (href) return <a className={`btn ${kind}`} href={href} onClick={onClick}>{children}</a>;
  return <button className={`btn ${kind}`} type={type} onClick={onClick} disabled={disabled}>{children}</button>;
}

export const Arrow = () => <span aria-hidden="true">→</span>;
