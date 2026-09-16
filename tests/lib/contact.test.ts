import { describe, expect, it } from "vitest";
import { parseContact } from "@/lib/contact/input";
const valid = {
  email: " Camille@Example.fr ",
  subject: "question",
  message: "  Bonjour, comment préparer mon budget ?  ",
  website: "",
};
describe("un message de contact", () => {
  it("normalise l’adresse et conserve le texte du message", () => {
    expect(parseContact(valid)).toEqual({
      email: "camille@example.fr",
      subject: "question",
      message: "Bonjour, comment préparer mon budget ?",
    });
  });
  it.each([
    null,
    {},
    { ...valid, email: "invalide" },
    { ...valid, email: "a\r\n@example.fr" },
    { ...valid, email: "a".repeat(250) + "@example.fr" },
    { ...valid, subject: "intrus" },
    { ...valid, message: "  " },
    { ...valid, message: "x".repeat(2001) },
    { ...valid, message: 12 },
  ])("refuse une demande invalide", (input) => {
    expect(() => parseContact(input)).toThrow();
  });
  it("reconnaît le champ piège sans stocker ni envoyer de message", () => {
    expect(
      parseContact({ ...valid, website: "https://spam.example" }),
    ).toBeNull();
  });
  it("accepte les accents et les retours à la ligne sans interpréter du HTML", () => {
    expect(
      parseContact({
        ...valid,
        message: "Été : budget\n<script>texte</script>",
      })?.message,
    ).toBe("Été : budget\n<script>texte</script>");
  });
});
