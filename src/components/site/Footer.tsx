import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Instagram,
  MapPin,
  Phone,
} from "lucide-react";

import { siteConfig } from "@/config/site";

const quickLinks = [
  {
    label: "فروشگاه",
    to: "/shop",
  },
  {
    label: "حساب کاربری",
    to: "/profile",
  },
  {
    label: "سبد خرید",
    to: "/cart",
  },
];

const infoLinks = [
  {
    label: "درباره ما",
    href: "#about",
  },
  {
    label: "تماس با ما",
    href: "#contact",
  },
  {
    label: "روش ارسال",
    href: "#shipping",
  },
  {
    label: "قوانین و مقررات",
    href: "#rules",
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-10 md:grid-cols-3">

          {/* Brand */}
          <div id="about">
            <Link
              to="/"
              className="inline-block text-xl font-bold tracking-tight"
            >
              {siteConfig.name}
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
              فروش تخصصی قطعات و لوازم یدکی موتورسیکلت با تمرکز بر
              کیفیت، اصالت کالا و ارائه خدمات مطمئن.
            </p>

            <Link
              to="/shop"
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
            >
              ورود به فروشگاه
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">
              دسترسی سریع
            </h3>

            <nav className="flex flex-col items-start gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 flex flex-wrap gap-4">
              {infoLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div id="contact">
            <h3 className="mb-4 text-sm font-semibold">
              ارتباط با ما
            </h3>

            <div className="space-y-4">

              {/* Mobile */}
              <a
                href={`tel:${siteConfig.phone.mobile}`}
                className="flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                dir="ltr"
              >
                <Phone className="h-4 w-4 shrink-0" />
                <span>{siteConfig.phone.mobile}</span>
              </a>

              {/* Landline */}
              <a
                href={`tel:${siteConfig.phone.landline}`}
                className="flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                dir="ltr"
              >
                <Phone className="h-4 w-4 shrink-0" />
                <span>{siteConfig.phone.landline}</span>
              </a>

              {/* Address */}
              <div className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                <MapPin className="mt-1 h-4 w-4 shrink-0" />

                <span>
                  {siteConfig.address.full}
                </span>
              </div>

              {/* Working Hours */}
              <div className="text-sm text-muted-foreground">
                ساعات کاری: ۱۰:۰۰ تا ۱۶:۰۰
              </div>

              {/* Instagram */}
              <a
                href={siteConfig.social.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                dir="ltr"
              >
                <Instagram className="h-4 w-4" />
                <span>
                  {siteConfig.social.instagram.username}
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name} — تمامی حقوق
            محفوظ است.
          </p>

          <p>
            تهران، میدان گمرک
          </p>
        </div>
      </div>
    </footer>
  );
}