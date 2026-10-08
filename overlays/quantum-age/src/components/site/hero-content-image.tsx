type HeroImage = {
  src: string;
  alt: string;
  placement: string;
  align: string;
  width: string;
  aspect: string;
  focal: string;
};

const widthClass = {
  narrow: "max-w-xs",
  medium: "max-w-md",
  wide: "max-w-xl",
} as const;

const aspectClass = {
  auto: "h-auto",
  square: "aspect-square object-cover",
  landscape: "aspect-video object-cover",
} as const;

/** Approved content image. Renders nothing when no image is chosen, so the existing hero stays unchanged. */
export function HeroContentImage({ image, slot }: { image: HeroImage; slot: "with-copy" | "beside-mark" }) {
  if (!image.src || image.placement !== slot) return null;
  const width = widthClass[image.width as keyof typeof widthClass] ?? widthClass.medium;
  const aspect = aspectClass[image.aspect as keyof typeof aspectClass] ?? aspectClass.auto;
  return (
    // The file is chosen from this site's media library. next/image cannot know its size ahead of time.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.src}
      alt={image.alt}
      data-editable="heroImage"
      className={`mt-8 w-full ${width} ${aspect} ${image.align === "end" ? "ml-auto" : ""}`}
      style={{ objectPosition: image.focal }}
    />
  );
}
