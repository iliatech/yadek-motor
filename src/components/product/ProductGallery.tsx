import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
  alt: string;
};

export function ProductGallery({
  images,
  alt,
}: Props) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="surface-panel flex aspect-square items-center justify-center rounded-2xl">
        <div className="px-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-border bg-surface text-muted-foreground">
            <ImageOff className="h-6 w-6" />
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            تصویری برای این محصول موجود نیست
          </p>
        </div>
      </div>
    );
  }

  const current = images[active] ?? images[0];

  return (
    <div className="min-w-0">
      {/* تصویر اصلی */}
      <div className="surface-panel group relative aspect-square overflow-hidden rounded-2xl">
        <img
          key={current}
          src={current}
          alt={`${alt} - تصویر ${active + 1}`}
          width={1000}
          height={1000}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        {/* گرادینت ظریف پایین تصویر */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/25 to-transparent" />

        {/* شمارنده تصاویر */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-4 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-md">
            <span className="num">
              {active + 1}
            </span>

            <span className="mx-1">از</span>

            <span className="num">
              {images.length}
            </span>
          </div>
        )}
      </div>

      {/* تصاویر کوچک */}
      {images.length > 1 && (
        <div className="mt-4 -mx-1 overflow-x-auto px-1 pb-2">
          <div className="flex min-w-max gap-3">
            {images.map((image, index) => {
              const isActive = index === active;

              return (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`نمایش تصویر ${index + 1} از ${alt}`}
                  aria-pressed={isActive}
                  className={cn(
                    "group/thumb relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl border bg-surface transition-all duration-200 sm:w-24",
                    isActive
                      ? "border-primary ring-2 ring-primary/20 shadow-[var(--shadow-accent)]"
                      : "border-border hover:-translate-y-0.5 hover:border-primary/50",
                  )}
                >
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    width={200}
                    height={200}
                    className={cn(
                      "h-full w-full object-cover transition-all duration-300",
                      isActive
                        ? "scale-105"
                        : "opacity-70 group-hover/thumb:scale-105 group-hover/thumb:opacity-100",
                    )}
                  />

                  {isActive && (
                    <span className="pointer-events-none absolute inset-0 border-2 border-primary/30" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}