import { Code2, Mail } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

const SUPPORT_EMAIL = "masumgaibandha@gmail.com";
const GITHUB_URL = "https://github.com/masumgaibandha/skillpath-ai";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Link href="/" aria-label="SkillPath AI — Home">
            <BrandLogo variant="horizontal" background="light" className="h-8 w-auto" />
          </Link>
          <p className="mt-3 max-w-xs text-sm text-zinc-500">
            AI-powered course discovery and learning platform — browse real courses, enroll,
            and get a personalized study roadmap.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-zinc-900">Navigate</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-500">
            <li>
              <Link href="/" className="hover:text-indigo-600">
                Home
              </Link>
            </li>
            <li>
              <Link href="/explore" className="hover:text-indigo-600">
                Explore
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-indigo-600">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-indigo-600">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-zinc-900">Get in touch</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-500">
            <li>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-2 hover:text-indigo-600"
              >
                <Mail size={16} />
                {SUPPORT_EMAIL}
              </a>
            </li>
            <li>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-indigo-600"
              >
                <Code2 size={16} />
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-zinc-200 px-4 py-4 text-center text-xs text-zinc-400 sm:px-6">
        © {new Date().getFullYear()} SkillPath AI. All rights reserved.
      </div>
    </footer>
  );
}
