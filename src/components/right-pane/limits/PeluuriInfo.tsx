import { Lightbulb, Check, Phone } from "lucide-react";

export function PeluuriInfo() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-green-200 bg-green-50 p-4">
      {/* Watermark */}
      <div className="pointer-events-none absolute -right-3 -top-3 text-green-200 opacity-20">
        <Phone className="h-24 w-24" />
      </div>

      {/* Header */}
      <div className="mb-3 flex items-center gap-1.5">
        <Lightbulb className="h-3.5 w-3.5 text-green-600" />
        <span className="text-xs font-semibold uppercase tracking-wide text-green-700">
          Need Help?
        </span>
      </div>

      <p className="mb-4 text-sm text-green-800">
        If gambling is causing problems:
      </p>

      {/* Peluuri Helpline */}
      <div className="mb-4">
        <p className="mb-0.5 flex items-center gap-1.5 text-sm font-semibold text-green-900">
          <span>&#128222;</span>
          Peluuri Helpline
        </p>
        <a
          href="tel:0800100101"
          className="mb-0.5 block text-lg font-bold text-green-900 hover:underline"
        >
          0800 100 101
        </a>
        <p className="text-xs text-green-700">
          Mon-Fri 12:00-18:00
          <br />
          Free &amp; Anonymous
        </p>
      </div>

      {/* Website */}
      <div className="mb-4">
        <p className="mb-0.5 flex items-center gap-1.5 text-sm font-semibold text-green-900">
          <span>&#127760;</span>
          <a
            href="https://www.peluuri.fi"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            www.peluuri.fi
          </a>
        </p>
        <ul className="ml-5 space-y-0.5 text-xs text-green-700">
          <li>&bull; Chat support</li>
          <li>&bull; Self-help programs</li>
          <li>&bull; Counseling</li>
          <li>&bull; Peer support groups</li>
        </ul>
      </div>

      {/* All services info */}
      <div>
        <p className="mb-2 text-xs font-medium text-green-800">
          All services are:
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <div className="flex items-center gap-1 text-xs text-green-700">
            <Check className="h-3.5 w-3.5 text-success-600" />
            <span>Confidential</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-700">
            <Check className="h-3.5 w-3.5 text-success-600" />
            <span>Professional</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-700">
            <Check className="h-3.5 w-3.5 text-success-600" />
            <span>Available in English</span>
          </div>
        </div>
      </div>
    </div>
  );
}
