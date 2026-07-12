import { describe, expect, it } from "vitest";
import { parseJsonLdProducts } from "../src/extract/parse-products";

describe("parseJsonLdProducts", () => {
  it("extracts a Product node with a flat offer", () => {
    const products = parseJsonLdProducts([
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Veste technique Aro",
        image: "https://shop.example.com/aro.jpg",
        description: "Impermeable et respirante.",
        offers: { "@type": "Offer", price: "129.00", priceCurrency: "CHF" },
      },
    ]);

    expect(products).toEqual([
      {
        title: "Veste technique Aro",
        price: "CHF 129.00",
        imageUrl: "https://shop.example.com/aro.jpg",
        description: "Impermeable et respirante.",
      },
    ]);
  });

  it("unwraps products nested inside a @graph", () => {
    const products = parseJsonLdProducts([
      {
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "WebSite", name: "Shop" },
          { "@type": "Product", name: "Casquette", image: "https://shop.example.com/cap.jpg" },
        ],
      },
    ]);

    expect(products).toHaveLength(1);
    expect(products[0]?.title).toBe("Casquette");
  });

  it("skips non-Product nodes and nodes missing a required field", () => {
    const products = parseJsonLdProducts([
      { "@type": "Organization", name: "Shop Inc" },
      { "@type": "Product", name: "No image here" },
    ]);

    expect(products).toHaveLength(0);
  });

  it("takes the first image when image is an array", () => {
    const products = parseJsonLdProducts([
      { "@type": "Product", name: "T-shirt", image: ["https://shop.example.com/a.jpg", "https://shop.example.com/b.jpg"] },
    ]);

    expect(products[0]?.imageUrl).toBe("https://shop.example.com/a.jpg");
  });
});
