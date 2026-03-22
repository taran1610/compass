"use client";

export function LandingAbout() {
  return (
    <section id="about" className="py-24 md:py-32 px-4 bg-[#0D0D0D]">
      <div className="container mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
          Building the{" "}
          <span className="text-[#6366F1]">
            AI layer
          </span>{" "}
          for product decisions.
        </h2>
        <p className="mt-6 text-lg text-[#9CA3AF] leading-relaxed">
          We believe every product decision should be backed by data, not gut feelings. Compass helps teams move from raw, scattered feedback to clear product strategy — automatically.
        </p>
        <p className="mt-4 text-[#9CA3AF] leading-relaxed">
          Founded by product leaders and AI engineers who experienced the pain of manual discovery firsthand, Compass is designed for the way modern product teams actually work.
        </p>
      </div>
    </section>
  );
}
