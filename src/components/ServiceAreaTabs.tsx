"use client";

import { useState } from "react";

type ServiceArea = { name: string; description: string };

export function ServiceAreaTabs({ areas }: { areas: ServiceArea[] }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2">
        {areas.map((area, i) => (
          <button
            key={area.name}
            type="button"
            onClick={() => setActive(i)}
            className={`cursor-pointer rounded-full px-5 py-2.5 text-lg font-medium transition-colors ${
              active === i
                ? "bg-brand-navy text-white"
                : "bg-white text-brand-navy border border-slate-200 hover:border-brand-gold-dark"
            }`}
          >
            {area.name}
          </button>
        ))}
      </div>

      <p className="mt-8 max-w-3xl mx-auto text-center text-lg text-slate-600 leading-relaxed">
        {areas[active].description}
      </p>
    </div>
  );
}

export default ServiceAreaTabs;
