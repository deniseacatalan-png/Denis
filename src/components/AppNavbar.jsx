"use client";

import { useId, useState } from "react";

function AppNavbarItem({ item, onItemSelect, closeMenu }) {
  const className = [
    item.variant === "cta" ? "site-nav-cta" : "site-nav-link",
    item.active ? "is-active" : ""
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = () => {
    if (item.disabled) return;
    onItemSelect?.(item);
    closeMenu();
  };

  if (item.href) {
    return (
      <a
        href={item.href}
        className={className}
        aria-current={item.active ? "page" : undefined}
        onClick={() => closeMenu()}
      >
        {item.label}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      aria-current={item.active ? "page" : undefined}
      disabled={item.disabled}
      onClick={handleClick}
    >
      {item.label}
    </button>
  );
}

export default function AppNavbar({
  ariaLabel = "Navegación principal",
  brandLabel = "Denise Catalán",
  brandHref,
  logoAlt = "Logo Denise Catalán",
  logoUrl,
  onBrandClick,
  onItemSelect,
  items = []
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuId = useId();

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function handleBrandClick(event) {
    if (!onBrandClick) {
      closeMenu();
      return;
    }

    event.preventDefault();
    onBrandClick();
    closeMenu();
  }

  const brandContent = (
    <>
      {logoUrl ? <img src={logoUrl} alt={logoAlt} /> : null}
      <span>{brandLabel}</span>
    </>
  );

  return (
    <header className="site-navbar">
      <nav className={`site-nav ${isMenuOpen ? "is-menu-open" : ""}`} aria-label={ariaLabel}>
        {brandHref || !onBrandClick ? (
          <a href={brandHref || "/"} className="site-nav-brand" aria-label="Ir al inicio" onClick={handleBrandClick}>
            {brandContent}
          </a>
        ) : (
          <button type="button" className="site-nav-brand" onClick={handleBrandClick} aria-label="Ir al inicio">
            {brandContent}
          </button>
        )}
        <button
          type="button"
          className="site-nav-menu-button"
          aria-controls={menuId}
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Cerrar menu" : "Abrir menu"}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>
        <div className="site-nav-links" id={menuId}>
          {items.map((item) => (
            <AppNavbarItem item={item} key={item.id} onItemSelect={onItemSelect} closeMenu={closeMenu} />
          ))}
        </div>
      </nav>
    </header>
  );
}
