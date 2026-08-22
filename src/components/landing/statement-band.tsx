"use client";

import { motion } from "framer-motion";
import { reveal, riseIn } from "@/lib/motion";

/**
 * A quiet, wide statement between the busier panels: one sentence set large,
 * with the middle phrase leaning in the same typeface rather than switching to
 * a serif. It gives the page somewhere to breathe.
 */
export function StatementBand() {
  return (
    <section className="page-shell pb-16 lg:pb-24">
      <motion.div {...reveal} variants={riseIn} className="panel px-6 py-20 text-center lg:py-28">
        <h2 className="statement mx-auto max-w-4xl">
          One workspace for cities,{" "}
          <span className="display-oblique">days, budgets</span> and the people
          <br className="hidden sm:block" /> you are going with.
        </h2>

        <p className="mx-auto mt-7 max-w-xl text-[15px] leading-relaxed text-foreground-muted">
          No spreadsheet, no group chat archaeology, no five browser tabs open at once.
        </p>
      </motion.div>
    </section>
  );
}
