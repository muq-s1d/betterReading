export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
      <h1
        className="text-4xl tracking-tight"
        style={{ fontFamily: "var(--font-lora), serif" }}
      >
        betterReading
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
        scaffold ✓ — ready for Phase 2
      </p>
    </main>
  );
}
