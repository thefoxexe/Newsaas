import { describe, expect, it } from "vitest";
import { pickLogo } from "../src/extract/pick-logo";

describe("pickLogo", () => {
  it("prefers a high-definition favicon over everything else", () => {
    const logo = pickLogo(
      ["https://shop.example.com/favicon-512.png"],
      "https://shop.example.com/og.jpg",
      [{ src: "https://shop.example.com/header-logo.svg", alt: "logo" }],
    );

    expect(logo?.url).toBe("https://shop.example.com/favicon-512.png");
    expect(logo?.hasTransparency).toBe(true);
  });

  it("falls back to og:image when there is no icon", () => {
    const logo = pickLogo([], "https://shop.example.com/og.jpg", []);

    expect(logo?.url).toBe("https://shop.example.com/og.jpg");
    expect(logo?.hasTransparency).toBe(false);
  });

  it("falls back to a header <img> whose src or alt mentions logo", () => {
    const logo = pickLogo([], null, [
      { src: "https://shop.example.com/hero.jpg", alt: "hero banner" },
      { src: "https://shop.example.com/brand-logo.png", alt: "" },
    ]);

    expect(logo?.url).toBe("https://shop.example.com/brand-logo.png");
  });

  it("returns null when nothing matches", () => {
    const logo = pickLogo([], null, [{ src: "https://shop.example.com/hero.jpg", alt: "hero banner" }]);

    expect(logo).toBeNull();
  });
});
