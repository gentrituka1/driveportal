"use client";

import Link from "next/link";

type NavItem = {
  href: string;
  label: string;
};

type TopBarProps = {
  title: string;
  subtitle?: string;
  navItems?: NavItem[];
  onLogout?: () => void;
};

export default function TopBar({ title, subtitle, navItems = [], onLogout }: TopBarProps) {
  return (
    <header className="panel flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 subtle">{subtitle}</p> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {navItems.map((item) => (
          <Link className="btn btn-secondary" key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}

        {onLogout ? (
          <button className="btn btn-secondary" onClick={onLogout} type="button">
            Logout
          </button>
        ) : null}
      </div>
    </header>
  );
}
