import { cn } from "@/lib/utils";

interface Slide {
  id: number;
  type: string;
  title: string;
  subtitle?: string;
  content?: string[];
  image_suggestion?: string;
  layout?: string;
}

interface ModernSlideProps {
  slide: Slide;
  slideIndex: number;
  totalSlides: number;
  designSettings?: {
    backgroundColor?: string;
    primaryColor?: string;
    fontFamily?: string;
  };
  isFullscreen?: boolean;
}

export const ModernSlide = ({
  slide,
  slideIndex,
  totalSlides,
  designSettings = {},
  isFullscreen = false,
}: ModernSlideProps) => {
  const {
    backgroundColor = "hsl(var(--card))",
    primaryColor = "hsl(var(--primary))",
  } = designSettings;

  // Get accent colors based on slide index
  const accentColors = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(var(--accent))",
  ];
  const accentColor = accentColors[slideIndex % accentColors.length];

  if (slide.type === "title") {
    return (
      <div
        className={cn(
          "relative w-full h-full flex flex-col items-center justify-center overflow-hidden",
          isFullscreen ? "p-16" : "p-8 md:p-12"
        )}
        style={{ backgroundColor }}
      >
        {/* Decorative geometric shapes */}
        <div
          className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 opacity-20"
          style={{ backgroundColor: accentColor }}
        />
        <div
          className="absolute bottom-0 left-0 w-24 h-24 md:w-36 md:h-36 rounded-full opacity-15"
          style={{ backgroundColor: primaryColor }}
        />
        <div
          className="absolute top-1/4 left-1/6 w-4 h-4 md:w-6 md:h-6 rotate-45 opacity-30"
          style={{ backgroundColor: "hsl(var(--accent))" }}
        />

        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <h1
            className={cn(
              "font-bold tracking-tight text-foreground mb-6",
              isFullscreen ? "text-5xl md:text-7xl" : "text-3xl md:text-5xl"
            )}
          >
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p
              className={cn(
                "text-muted-foreground font-medium",
                isFullscreen ? "text-2xl md:text-3xl" : "text-lg md:text-xl"
              )}
            >
              {slide.subtitle}
            </p>
          )}
        </div>

        {/* Slide number indicator */}
        <div className="absolute bottom-6 right-6 flex items-center gap-2">
          <div
            className="w-8 h-1 rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
          <span className="text-sm font-medium text-muted-foreground">
            {slideIndex + 1} / {totalSlides}
          </span>
        </div>
      </div>
    );
  }

  if (slide.type === "section") {
    return (
      <div
        className={cn(
          "relative w-full h-full flex items-center justify-center overflow-hidden",
          isFullscreen ? "p-16" : "p-8 md:p-12"
        )}
        style={{ backgroundColor: primaryColor }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 right-1/4 w-32 h-32 border-4 border-white rounded-full" />
          <div className="absolute bottom-1/3 left-1/3 w-24 h-24 border-4 border-white rotate-45" />
        </div>

        <div className="relative z-10 text-center">
          <h2
            className={cn(
              "font-bold text-white tracking-tight",
              isFullscreen ? "text-4xl md:text-6xl" : "text-2xl md:text-4xl"
            )}
          >
            {slide.title}
          </h2>
        </div>

        {/* Slide number */}
        <div className="absolute bottom-6 right-6">
          <span className="text-sm font-medium text-white/70">
            {slideIndex + 1} / {totalSlides}
          </span>
        </div>
      </div>
    );
  }

  // Content slide (default)
  return (
    <div
      className={cn(
        "relative w-full h-full flex flex-col overflow-hidden",
        isFullscreen ? "p-12 md:p-16" : "p-6 md:p-10"
      )}
      style={{ backgroundColor }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: accentColor }}
      />

      {/* Side accent */}
      <div
        className="absolute top-0 left-0 w-1.5 h-24"
        style={{ backgroundColor: accentColor }}
      />

      {/* Decorative circle */}
      <div
        className="absolute bottom-8 right-8 w-16 h-16 md:w-24 md:h-24 rounded-full opacity-10"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h2
          className={cn(
            "font-bold text-foreground tracking-tight",
            isFullscreen ? "text-3xl md:text-5xl" : "text-xl md:text-3xl"
          )}
        >
          {slide.title}
        </h2>
        {slide.subtitle && (
          <p
            className={cn(
              "text-muted-foreground mt-2",
              isFullscreen ? "text-xl" : "text-base"
            )}
          >
            {slide.subtitle}
          </p>
        )}
      </div>

      {/* Content */}
      {slide.content && slide.content.length > 0 && (
        <div className="flex-1 flex flex-col justify-center">
          <ul className={cn("space-y-3 md:space-y-5", isFullscreen && "space-y-6")}>
            {slide.content.map((item, index) => (
              <li
                key={index}
                className={cn(
                  "flex items-start gap-4",
                  isFullscreen ? "text-xl md:text-2xl" : "text-sm md:text-lg"
                )}
              >
                <span
                  className={cn(
                    "flex-shrink-0 w-2 h-2 rounded-full mt-2.5",
                    isFullscreen && "w-3 h-3"
                  )}
                  style={{ backgroundColor: accentColor }}
                />
                <span className="text-foreground leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Image suggestion badge */}
      {slide.image_suggestion && (
        <div className="mt-auto pt-4 border-t border-border/30">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Image suggérée : {slide.image_suggestion}
          </div>
        </div>
      )}

      {/* Slide number */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2">
        <div className="flex gap-1">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === slideIndex ? "bg-primary scale-110" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
