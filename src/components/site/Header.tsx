import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import logo from "@/assets/logo.webp";
import {
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
  ArrowLeft,
} from "lucide-react";

import {
  navItems,
  toPersianDigits,
} from "@/data/shop";

import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";

import {
  getCurrentUser,
  isLoggedIn,
  type UserProfile,
} from "@/data/auth";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  const { cartCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16);
    };

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const loadUser = () => {
      const currentUser = getCurrentUser();

      setUser(currentUser);
      setLoggedIn(isLoggedIn());
    };

    loadUser();

    window.addEventListener("storage", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
    };
  }, []);

  const closeMobileMenu = () => {
    setOpen(false);
  };

  const handleSearchSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const query = searchQuery.trim();

    if (!query) {
      return;
    }

    setSearchOpen(false);
    setOpen(false);

    navigate({
      to: "/shop",
      search: {
        q: query,
        category: "",
      },
    });
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? [
              "border-border",
              "bg-background/90",
              "shadow-[0_12px_40px_-24px_rgba(0,0,0,0.9)]",
              "backdrop-blur-2xl",
            ]
          : [
              "border-transparent",
              "bg-background/55",
              "backdrop-blur-md",
            ],
      )}
    >
      {/* نوار ظریف برند */}
      <div
        className={cn(
          "h-px w-full bg-gradient-to-l from-transparent via-primary/70 to-transparent transition-opacity duration-300",
          scrolled ? "opacity-100" : "opacity-40",
        )}
      />

      <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* =========================
            لوگو
           ========================= */}
<img
  src={logo}
  className="h-20 w-auto object-contain"
/>

        {/* =========================
            منوی دسکتاپ
           ========================= */}
        <nav className="hidden justify-center lg:flex">
          <ul className="flex items-center gap-1 rounded-xl border border-border/70 bg-surface/45 p-1 backdrop-blur-md">
            {navItems.map((item) => {
              if (
                item.href === "/" ||
                item.href === "/shop"
              ) {
                return (
                  <li key={item.label}>
                    <Link
                      to={item.href}
                      activeOptions={{
                        exact: true,
                      }}
                      activeProps={{
                        className:
                          "bg-surface-elevated text-foreground shadow-sm",
                      }}
                      className="relative block rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-surface hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="relative block rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-surface hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* =========================
            اکشن‌ها
           ========================= */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* جستجو */}
          <button
            type="button"
            onClick={() =>
              setSearchOpen((value) => !value)
            }
            aria-label="جستجو"
            aria-expanded={searchOpen}
            className={cn(
              "group grid h-10 w-10 place-items-center rounded-xl border transition-all duration-200",
              searchOpen
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:bg-surface hover:text-foreground",
            )}
          >
            <Search className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
          </button>

          {/* پروفایل */}
          <Link
            to="/profile"
            aria-label="حساب کاربری"
            className={cn(
              "group relative grid h-10 w-10 place-items-center rounded-xl border border-transparent text-muted-foreground transition-all duration-200",
              "hover:border-border hover:bg-surface hover:text-foreground",
            )}
          >
            <User className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />

            {loggedIn && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
            )}
          </Link>

          {/* سبد خرید */}
          <Link
            to="/cart"
            aria-label="سبد خرید"
            className="group relative grid h-10 w-10 place-items-center rounded-xl border border-transparent text-muted-foreground transition-all duration-200 hover:border-border hover:bg-surface hover:text-foreground"
          >
            <ShoppingCart className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />

            {cartCount > 0 && (
              <span className="absolute -left-1 -top-1 grid h-[19px] min-w-[19px] place-items-center rounded-full border-2 border-background bg-primary px-1 text-[9px] font-black text-primary-foreground shadow-[0_0_15px_-4px_var(--primary)] num">
                {toPersianDigits(cartCount)}
              </span>
            )}
          </Link>

          {/* منوی موبایل */}
          <button
            type="button"
            onClick={() =>
              setOpen((value) => !value)
            }
            aria-label="منو"
            aria-expanded={open}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-xl border transition-all duration-200 lg:hidden",
              open
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:bg-surface hover:text-foreground",
            )}
          >
            {open ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* =========================
          جستجو
         ========================= */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300",
          searchOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/70 bg-background/90">
            <form
              onSubmit={handleSearchSubmit}
              className="mx-auto flex max-w-7xl gap-2 px-4 py-3 sm:px-6 lg:px-8"
            >
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  autoFocus={searchOpen}
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value,
                    )
                  }
                  placeholder="نام قطعه، برند یا محصول را جستجو کنید..."
                  className="w-full rounded-xl border border-border bg-surface py-3 pl-4 pr-11 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-4 focus:ring-primary/5"
                />
              </div>

              <button
                type="submit"
                className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-[0_10px_30px_-18px_var(--primary)] transition-all hover:scale-[1.01] hover:shadow-[0_14px_35px_-16px_var(--primary)]"
              >
                جستجو
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* =========================
          منوی موبایل
         ========================= */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 lg:hidden",
          open
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <nav className="border-t border-border/70 bg-background/95 backdrop-blur-2xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              {/* وضعیت حساب */}
              <Link
                to="/profile"
                onClick={closeMobileMenu}
                className="group flex items-center gap-3 border-b border-border py-4"
              >
                <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-surface transition-colors group-hover:border-primary/40">
                  <User className="h-5 w-5 text-muted-foreground group-hover:text-primary" />

                  {loggedIn && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black">
                    {loggedIn && user
                      ? `${user.firstName} ${user.lastName}`
                      : "حساب کاربری"}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {loggedIn
                      ? "مشاهده حساب و سفارش‌ها"
                      : "ورود / ایجاد حساب"}
                  </p>
                </div>

                <ChevronIcon />
              </Link>

              {/* لینک‌ها */}
              <ul className="py-2">
                {navItems.map((item) => {
                  if (
                    item.href === "/" ||
                    item.href === "/shop"
                  ) {
                    return (
                      <li key={item.label}>
                        <Link
                          to={item.href}
                          onClick={closeMobileMenu}
                          activeOptions={{
                            exact: true,
                          }}
                          activeProps={{
                            className:
                              "bg-surface text-foreground",
                          }}
                          className="flex items-center justify-between rounded-xl px-3 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                        >
                          {item.label}
                          <ChevronIcon />
                        </Link>
                      </li>
                    );
                  }

                  return (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        onClick={closeMobileMenu}
                        className="flex items-center justify-between rounded-xl px-3 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                      >
                        {item.label}
                        <ChevronIcon />
                      </a>
                    </li>
                  );
                })}
              </ul>

              {/* لینک‌های سریع */}
              <div className="grid grid-cols-2 gap-2 border-t border-border py-3">
                <Link
                  to="/shop"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-3 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                >
                  <Search className="h-4 w-4" />
                  فروشگاه
                </Link>

                <Link
                  to="/cart"
                  onClick={closeMobileMenu}
                  className="relative flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-3 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                >
                  <ShoppingCart className="h-4 w-4" />
                  سبد خرید

                  {cartCount > 0 && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-black text-primary-foreground num">
                      {toPersianDigits(cartCount)}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

function ChevronIcon() {
  return (
    <ArrowLeft className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:-translate-x-1" />
  );
}