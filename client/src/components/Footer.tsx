import { ArrowUpRight, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

const SUPPORT_EMAIL = "info@skillpath.com";
const DEVELOPER_URL = "https://masumdev.com";

const SOCIAL_LINKS = {
  linkedin: "https://www.linkedin.com/in/skillpath",
  x: "https://x.com/skillpath",
  github: "https://github.com/skillpath",
};

const FOOTER_LINKS = [
  {
    title: "Platform",
    links: [
      { label: "Explore courses", href: "/explore" },
      { label: "AI Study Planner", href: "/dashboard/study-plan" },
      { label: "AI Learning Chat", href: "/dashboard/chat" },
      { label: "My Courses", href: "/dashboard/courses" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About SkillPath", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Create an account", href: "/signup" },
      { label: "Log in", href: "/login" },
    ],
  },
];

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.42v1.57h.05c.48-.9 1.64-1.85 3.37-1.85 3.61 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.41a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.1 20.45H3.54V8.98H7.1v11.47Z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 .7A11.5 11.5 0 0 0 8.36 23.1c.58.1.79-.25.79-.56v-2.22c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.4-1.27.74-1.56-2.57-.29-5.27-1.28-5.27-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.16 1.18A10.9 10.9 0 0 1 12 6.1c.98 0 1.95.13 2.86.38 2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.71 5.39-5.29 5.68.42.36.79 1.07.79 2.16v3.24c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-zinc-800 bg-zinc-950 text-zinc-300">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-[40rem] max-w-full -translate-x-1/2 rounded-full bg-indigo-600/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-14 sm:px-6 sm:pt-16">
        <div className="grid gap-12 border-b border-zinc-800 pb-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link
              href="/"
              aria-label="SkillPath AI — Home"
              className="inline-flex rounded-xl bg-white px-4 py-3 transition-colors hover:bg-zinc-100"
            >
              <BrandLogo
                variant="horizontal"
                background="light"
                className="h-8 w-auto"
              />
            </Link>

            <p className="mt-5 max-w-md text-sm leading-6 text-zinc-400">
              An AI-powered learning platform that helps learners discover
              relevant courses, build personalized study roadmaps, and reach
              their goals with greater clarity.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-xs font-medium text-indigo-200">
              <Sparkles size={14} aria-hidden="true" />
              Smarter learning paths for everyone
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow SkillPath on LinkedIn"
                title="LinkedIn — @skillpath"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <LinkedInIcon className="h-[19px] w-[19px]" />
              </a>

              <a
                href={SOCIAL_LINKS.x}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow SkillPath on X"
                title="X — @skillpath"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <XIcon className="h-[17px] w-[17px]" />
              </a>

              <a
                href={SOCIAL_LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View SkillPath on GitHub"
                title="GitHub — @skillpath"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <GitHubIcon className="h-[19px] w-[19px]" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {FOOTER_LINKS.map((group) => (
              <div key={group.title}>
                <h2 className="text-sm font-semibold text-white">
                  {group.title}
                </h2>

                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-zinc-400 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="col-span-2 sm:col-span-1">
              <h2 className="text-sm font-semibold text-white">Get in touch</h2>

              <p className="mt-4 text-sm leading-6 text-zinc-400">
                Have questions, feedback, or partnership ideas? Connect with the
                SkillPath team.
              </p>

              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="mt-4 inline-flex max-w-full items-center gap-2 text-sm font-medium text-indigo-300 transition-colors hover:text-indigo-200"
              >
                <Mail size={16} className="shrink-0" aria-hidden="true" />
                <span className="break-all">{SUPPORT_EMAIL}</span>
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 pt-7 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SkillPath AI. All rights reserved.</p>

          <div className="flex flex-col gap-2 sm:items-end">
            <a
              href={DEVELOPER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex flex-wrap items-center gap-1.5 font-medium text-zinc-300 transition-colors hover:text-white"
            >
              <span>Designed &amp; developed by</span>

              <span className="text-indigo-300 transition-colors group-hover:text-indigo-200">
                MasumDev
              </span>

              <ArrowUpRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>

            <p className="text-xs text-zinc-600">
              Thoughtfully engineered for accessible, meaningful learning.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
