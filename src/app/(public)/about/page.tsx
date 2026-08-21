import type { Metadata } from "next";
import Image from "next/image";
import { Download } from "lucide-react";
import { ContactNavLink } from "@/components/navigation/ContactNavLink";
import { ExperienceList } from "@/components/public/ExperienceList";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { SHOW_CONTACT, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `About R.J. Oliver — Senior Web Developer & UI/UX Designer. Resume and background for ${SITE_NAME}.`,
};

const RESUME_PDF_HREF = "/resume/RJ_Oliver_Resume_AIO_WP.pdf";
const OTHER_EXPERIENCE_PDF_HREF = "/resume/RJ-Oliver-Other-Experience.pdf";

type Role = {
  company: string;
  role: string;
  dates: string;
  location: string;
  bullets: readonly string[];
};

const EXPERIENCE: Role[] = [
  {
    company: "SmallBizNiz LLC",
    role: "Freelance — Custom Graphics, Web Design and Development",
    dates: "2015 – Present",
    location: "Small businesses, churches, and non-profits",
    bullets: [
      "Custom WordPress websites, including custom plugins, metaboxes, and more utilizing WP-JSON, ACF, JS, HTML, and PHP",
      "Developed custom websites and mobile applications using modern JavaScript frameworks — including Angular, React, and Vue built on Node.js tooling — as well as Flutter, tailored to each client's platform and performance requirements",
      "Website security management with Sucuri and other security plugins for blacklisting IPs and hardening",
      "Manual WordPress backups and migrations from host to host",
      "WordPress theme updates and optimization — removing spam comments, old plugins, and other items causing latency",
      "Uses Adobe CC for design software (Photoshop, Illustrator, XD, Firefly, etc.)",
    ],
  },
  {
    company: "Frendigo",
    role: "Senior Lead Developer",
    dates: "Jan 2026 – Present",
    location: "Remote",
    bullets: [
      "Architecting and building a 3-platform transportation marketplace SaaS (iOS, Android, web) using Flutter, Angular, and Node.js",
      "Developing Angular-based marketing, operations, partner, and training sites with a Node.js/Firebase backend and Google Maps API integration",
      "Implementing a subscription-based pricing engine (MPG, USDOT, EIA gas data) replacing per-trip commissions",
      "Managing full Agile sprint cycles, GitHub version control, and CI/CD pipelines",
      "Leveraging AI-assisted vibe coding to accelerate development of Flutter and Angular apps — using AI tools to scaffold components, debug logic, and rapidly iterate across the full stack",
    ],
  },
  {
    company: "Battelle",
    role: "Senior Web Developer, CTR DHA Public Health (USA)",
    dates: "Feb 2024 – Dec 2025",
    location: "Remote · Security Clearance Holder",
    bullets: [
      "Security Clearance Holder; led custom WordPress development (PHP, Laravel, WP-JSON REST API) for the Navy and Marine Corps Force Health Protection Command (NMCFHPC), shipping numerous interactive health-education pages with custom SVG animations and dashboards",
      "Managed Digital Asset Management (DAM), brand style guide (brand book) governance, and creative library organization for the Warfighter Wellness initiative, building landing pages from reusable, brand-compliant components and existing campaign materials",
      "Built reusable component libraries, custom post types, and bespoke jQuery/CSS3/HTML5 solutions for research and government-facing web properties",
      "Translated text-based requirements and Adobe Photoshop/Illustrator/XD mockups into functional, interactive components for content teams",
      "Managed and tracked tasks using SharePoint",
    ],
  },
  {
    company: "Shades of Light",
    role: "Senior Web Developer",
    dates: "Nov 2023 (30-Day Contract)",
    location: "Richmond, VA",
    bullets: [
      "Short-term front-end development engagement taken on while awaiting security clearance processing ahead of the Battelle role",
      "Worked in an Agile environment on a headless e-commerce website, integrating Algolia Search and Google Commerce",
      "Referenced Digital Asset Management (DAM) systems, brand style guides, and creative libraries to build and launch on-brand landing pages",
      "Used LogRocket for session monitoring and debugging",
      "Managed tasks and collaborated with the offshore development team at ChangeCX via JIRA",
      "Reviewed and implemented monthly SEO recommendations provided by a third-party agency",
    ],
  },
  {
    company: "Virginia Commonwealth University",
    role: "Senior Digital Developer",
    dates: "Dec 2019 – Oct 2023",
    location: "Richmond, VA",
    bullets: [
      "Led custom web development on Terminal Four (Java-based enterprise CMS) for multiple schools and organizations across the university — including the School of Dentistry, School of Business, the President's Office, Admissions, and Marketing & Communications — serving VCU's flagship web presence",
      "Maintained Digital Asset Management (DAM) systems, brand style guides, and creative libraries to support consistent landing page and email development across university schools and departments",
      "Authored reusable vanilla JS components and JSON-driven dynamic directories, eliminating reliance on third-party scripts",
      "Translated Adobe XD/Photoshop mockups into pixel-perfect, ADA-compliant functional components and custom content types",
      "Designed and deployed custom LISTSERV Maestro HTML email templates and managed email marketing campaigns",
      "Operated in an Agile team environment with iterative sprint planning, peer review, and stakeholder UAT cycles, using JIRA to track tasks and bugs",
    ],
  },
  {
    company: "VitaminT (VCU Contract)",
    role: "Senior Front-End Developer",
    dates: "Aug 2019 – Dec 2019",
    location: "Richmond, VA",
    bullets: [
      "Delivered custom front-end development for internal and external VCU college web initiatives",
      "Bridged design and development by rapidly converting wireframes into responsive, cross-browser compatible components",
    ],
  },
  {
    company: "Allianz Partners",
    role: "Senior Front-End Developer",
    dates: "Dec 2018 – Aug 2019",
    location: "Richmond, VA",
    bullets: [
      "Developed, optimized, and supported travel insurance offer widgets deployed across 20+ partner sites including Delta, Amtrak, Hotwire, Priceline, Hawaiian Airlines, Hilton, and Alaska Airlines",
      "Referenced brand style guides and creative libraries to build landing pages and HTML email campaigns supporting travel insurance offer widgets",
      "Built and A/B tested front-end designs on an Angular and Node.js platform to maximize conversion for travel insurance products",
      "Operated in an Agile environment with rapid iteration cycles driven by partner analytics and business KPIs, using JIRA to track and complete tasks",
    ],
  },
  {
    company: "Lumber Liquidators",
    role: "Front-End Developer & UI/UX Designer",
    dates: "Dec 2015 – Dec 2018",
    location: "Toano, VA",
    bullets: [
      "Hired to lead a full responsive redesign and ADA compliance overhaul of lumberliquidators.com, cutting reliance on third-party providers",
      "Worked in a Kanban environment on a Java-based platform; edited JSP templates to make the entire site — including checkout — fully responsive",
      "Designed and developed UX/UI for the Product Availability modal, enabling ZIP/city/state-based inventory search",
      "Redesigned and launched the new Product Page, featuring a fresh UX and multi-media gallery",
      "Built a proprietary HTML/JS Page Builder web application used by content teams for self-serve publishing",
      "Implemented a Mega Dropdown desktop navigation that doubles as an off-canvas drill-down menu on mobile",
    ],
  },
  {
    company: "Genworth Financial (via Techead)",
    role: "Senior Content Manager / Front-End Developer",
    dates: "Jul 2014 – Dec 2015",
    location: "Richmond, VA",
    bullets: [
      "Managed and developed content for genworth.com and the PRO Agent portal using Adobe CQ5 (now AEM), a Java-based enterprise platform",
      "Maintained Digital Asset Management (DAM), brand style guides, and creative libraries to ensure consistent, on-brand content across genworth.com and the PRO Agent portal",
      "Built custom AEM components and interactive JavaScript elements, most notably the award-recognized R70 Age Suit infographic",
      "Led front-end development to upgrade Genworth's Long Term Care site to a fully responsive experience",
      "Built pages from provided wireframes; tested across all browsers, then facilitated UAT; troubleshot cross-browser issues stemming from HTML/CSS markup",
      "Tagged content for tracking metrics using Eloqua and for SEO using Schema, OG meta tags, metadata, and canonicals",
    ],
  },
  {
    company: "Ayers Electronic Systems (via ApGility)",
    role: "Front-End Developer (Contract)",
    dates: "Dec 2014",
    location: "North Chesterfield, VA",
    bullets: [
      "Built a custom CMS for client AAR (Association of American Railroads) using CakePHP, Bootstrap, and Semantic UI within an Agile framework",
      "Created HTML email templates and website wireframes; built out approved designs using HTML, CSS, and jQuery",
    ],
  },
  {
    company: "Capital One (via Celerity)",
    role: "Web Content Manager (Full-Time Contractor)",
    dates: "Nov 2013 – Dec 2014",
    location: "Glen Allen, VA",
    bullets: [
      "Managed Digital Asset Management (DAM), brand style guides, and creative libraries to ensure consistent, on-brand content across acquired accounts",
      "Processed content using ContentOne and SharePoint Teamsite; deployed content to QA and PROD for 9 Agile teams during EOS replatforming",
      "Managed content owned by partners of Capital One's acquisition of HSBC accounts, including Menards, Polaris, Guitar Center, and Best Buy",
      "Maintained HTML for microsites using Adobe Dreamweaver; managed .properties, .xml, .metadata, images, .html, .css, and .js files",
      "Managed and tracked tasks using SharePoint",
    ],
  },
  {
    company: "Media General (MGFX)",
    role: "Graphic Artist (started as Graphic Design Intern, Jun 2012)",
    dates: "Jun 2012 – Dec 2013",
    location: "Glen Allen, VA",
    bullets: [
      "Produced graphics for 20+ TV stations using Adobe CS6 (Photoshop, Illustrator, After Effects)",
      "Maintained Digital Asset Management (DAM), brand style guides, and creative libraries across on-air graphics packages for 20+ TV stations",
      "Created 3D broadcast animations using Cinema 4D and animated satellite maps using Treo Maps",
    ],
  },
  {
    company: "Royall & Company",
    role: "Email Project Manager (4-Month Contract)",
    dates: "Nov 2012 – Feb 2013",
    location: "Richmond, VA",
    bullets: [
      "Referenced brand style guides (brand books) and creative libraries to build landing pages and email campaigns",
      "QA/tested HTML email campaigns for best practices, design standards, and link integrity",
      "Coordinated resolution of issues between copywriters, account managers, and web designers",
    ],
  },
];

const OTHER_EXPERIENCE_GROUPS: {
  title: string;
  roles: Role[];
}[] = [
  {
    title: "Sales & customer service",
    roles: [
      {
        company: "The Page Auto Group",
        role: "eCommerce, Customer Service & Front-End Support (Full Time)",
        dates: "Jul 2013 – Oct 2013",
        location: "Glen Allen, VA",
        bullets: [
          "Managed 5 eBay dealership stores end-to-end: order processing, customer communications, and shipping coordination",
          "Answered customer questions via phone and eBay Messages; troubleshot shipping errors across 5 warehouses",
          "Developed HTML email templates and an internal dashboard to streamline operations",
        ],
      },
      {
        company: "RadioShack, Optical World Optometrist & LensCrafters",
        role: "Sales Associate",
        dates: "2005 – 2010",
        location: "Charlottesville, VA",
        bullets: [
          "Held multiple sales roles across electronics and optical retail, earning multiple sales awards and recognition",
        ],
      },
      {
        company: "Household Finance Corporation (HSBC)",
        role: "Senior Account Executive",
        dates: "2002 – 2005",
        location: "Charlottesville, VA",
        bullets: [
          "Sold mortgage and auto loans, refinances, and GAP insurance products",
        ],
      },
    ],
  },
  {
    title: "People management & training",
    roles: [
      {
        company: "Capital One",
        role: "Test & Learn Sales Training Intern / WIKI Administrator",
        dates: "Oct 2010 – Nov 2012",
        location: "Glen Allen, VA",
        bullets: [
          "Traveled as a Sales Trainer to Coeur d'Alene, ID and San Angelo, TX to train third-party call centers on Credit Card Payment Protection and ancillary products",
          "Piloted and managed Test & Learn's One Place Confluence/WIKI for best practices and recognition",
          "Migrated content from Confluence to JIVE as the platform was replaced",
          "Added to the COF Broadcaster Group, managing access for video publishing on One Place TV",
          "Managed the departmental newsletter, published in JIVE as a photo gallery",
        ],
      },
      {
        company: "Music Resource Center",
        role: "Program Director",
        dates: "2000 – 2002",
        location: "Charlottesville, VA",
        bullets: [
          "Developed and facilitated training curriculum for at-risk teens in music production, songwriting, recording, and studio setup",
          "Maintained high-end studio equipment and managed studio and facilities inventory",
        ],
      },
      {
        company: "Taco Bell",
        role: "Manager",
        dates: "1999 – 2000",
        location: "Charlottesville, VA",
        bullets: [
          "Opened and closed the store, including nightly cash deposits",
          "Managed inventory and hired employees",
        ],
      },
    ],
  },
];

const TECH_GROUPS = [
  {
    label: "Programming languages",
    items:
      "HTML5, CSS3, JavaScript (ES6+), jQuery, PHP, Java (JSP editing), XML, ActionScript, C, C#",
  },
  {
    label: "AI tools",
    items: "ChatGPT, Cursor, Claude, Copilot, Gemini",
  },
  {
    label: "Frameworks & libraries",
    items:
      "Angular, React, Vue, Node.js, Flutter (Dart), Bootstrap, Foundation, Semantic UI, CakePHP, Laravel, PHP MVC",
  },
  {
    label: "CMS / platforms",
    items:
      "Terminal Four (Java), Adobe CQ5/AEM, WordPress (WP-JSON, headless), Expression Engine, Moodle, SharePoint Teamsite, Site Manager",
  },
  {
    label: "Digital asset management",
    items:
      "DAM Platforms, Brand Style Guides / Brand Books, Creative Library Management, Campaign Asset Reuse & Adaptation (Email, Web, Landing Pages, Digital Activation)",
  },
  {
    label: "Search & commerce",
    items: "Algolia Search, Google Commerce/CommerceTools, WooCommerce",
  },
  {
    label: "Design tools",
    items:
      "Adobe CC (Photoshop, XD, Illustrator, InDesign, Animate, Flash, After Effects, Premiere), Figma, Cinema 4D, ViaCad 2D/3D",
  },
  {
    label: "Analytics & monitoring",
    items:
      "LogRocket, Eloqua, Google Analytics (GA4), Akamai, SEO (Schema, OG Meta, Canonicals)",
  },
  {
    label: "Email marketing",
    items: "LISTSERV Maestro, MailChimp, Campaign Monitor",
  },
  {
    label: "Dev tools & DevOps",
    items:
      "Git, GitHub, SourceTree, Agile/Kanban, CI/CD pipelines, cPanel, IIS, Apache, WAMP/LAMP/XAMPP",
  },
  {
    label: "Database",
    items: "MySQL, SQL, phpMyAdmin, Sequel Pro, MS Access",
  },
  {
    label: "Audio / video",
    items:
      "Logic Pro X, Pro Tools, Digital Performer, GarageBand, MainStage 3, iMovie, Adobe Premiere, After Effects, Motion 5",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-10 md:gap-10">
        <div className="md:col-span-3">
          <div className="relative aspect-square w-full overflow-hidden bg-charcoal-soft">
            <Image
              src="/about/teddy-dev.png"
              alt="Illustration of a ninja bear coding at a desk — Dev Bear"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 30vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="md:col-span-7">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-copper">
            About
          </p>
          <h1 className="mt-3 font-display text-4xl text-charcoal sm:text-5xl md:text-6xl">
            R.J. Oliver
          </h1>
          <p className="mt-3 text-base text-ink-muted sm:text-lg">
            Senior Web Developer / UI-UX Designer · Graphic Design · Sales ·
            People Management &amp; Training
          </p>
          <p className="mt-2 text-sm text-copper">Active Security Clearance</p>

          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
            <span>Henrico, VA</span>
            <a
              href="https://linkedin.com/in/rafael-oliver-17b59628"
              target="_blank"
              rel="noopener noreferrer"
              className="text-copper transition-colors hover:text-copper-hover"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>

      <div className="mt-14">
        <Accordion defaultOpenId="summary">
          <AccordionItem id="summary" title="Professional summary">
            <p className="text-base leading-relaxed text-ink-muted sm:text-lg">
              Versatile professional with years of experience spanning Senior
              Web Development &amp; UI/UX Design, Graphic Design, and — earlier
              in career — Sales and People Management &amp; Training. Deep
              expertise in Agile/Kanban workflows, Angular, Node.js, Flutter, React, and
              headless CMS architectures, paired with a strong foundation in
              visual/brand design built through years as a graphic designer, and
              in client relations and team leadership carried over from earlier
              roles in sales and program management. Proven track record of
              leading cross-functional projects, mentoring offshore and internal
              teams, and translating complex design mockups into
              production-ready, ADA-compliant components across enterprise,
              government, and startup environments.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
              Hands-on experience managing Digital Asset Management (DAM)
              systems, brand books (style guides), creative libraries, and
              existing campaign materials to build digital deliverables. Strong
              understanding of brand governance, asset reuse, and adaptation
              workflows across email, web, landing pages, and digital activation
              channels. Proficient in Adobe XD and Figma.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
              {SITE_NAME} is the portfolio for selected work — thoughtful
              builds, digital products, and details worth lingering on.
            </p>
          </AccordionItem>

          <AccordionItem id="experience" title="Experience">
            <ExperienceList roles={EXPERIENCE} />
          </AccordionItem>

          <AccordionItem id="technology" title="Technology">
            <dl className="space-y-4">
              {TECH_GROUPS.map((group) => (
                <div key={group.label}>
                  <dt className="text-xs font-medium uppercase tracking-[0.14em] text-copper">
                    {group.label}
                  </dt>
                  <dd className="mt-1.5 text-base leading-relaxed text-ink-muted">
                    {group.items}
                  </dd>
                </div>
              ))}
            </dl>
          </AccordionItem>

          <AccordionItem id="education" title="Education">
            <p className="font-display text-xl text-charcoal">
              ECPI University — Glen Allen, VA
            </p>
            <p className="mt-1 text-base text-ink-muted">
              B.S. in Computer and Information Sciences, Concentration: Web
              Development
            </p>
            <p className="mt-1 text-sm text-ink-muted">Graduated June 2013</p>
          </AccordionItem>

          <AccordionItem id="other-experience" title="Other experience">
            <p className="text-base text-ink-muted">
              Sales &amp; customer service · People management &amp; training
            </p>

            <div className="mt-8 space-y-12">
              {OTHER_EXPERIENCE_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-copper">
                    {group.title}
                  </h3>
                  <ol className="mt-5 space-y-8">
                    {group.roles.map((job) => (
                      <li key={`${job.company}-${job.dates}`}>
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                          <h4 className="font-display text-xl text-charcoal">
                            {job.company}
                          </h4>
                          <p className="shrink-0 text-sm text-ink-muted">
                            {job.dates}
                          </p>
                        </div>
                        <p className="mt-1 text-sm font-medium text-copper">
                          {job.role}
                        </p>
                        <p className="mt-0.5 text-sm text-ink-muted">
                          {job.location}
                        </p>
                        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-base leading-relaxed text-ink-muted">
                          {job.bullets.map((bullet) => (
                            <li key={bullet} className="marker:text-copper/70">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>

            <a
              href={OTHER_EXPERIENCE_PDF_HREF}
              download="RJ_Oliver_Other_Experience.pdf"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-copper transition-colors hover:text-copper-hover"
            >
              <Download className="h-4 w-4" aria-hidden />
              Download other experience (PDF)
            </a>
          </AccordionItem>
        </Accordion>

        <div className="mt-14 border-t border-[var(--border-subtle)] pt-10">
          <p className="text-base text-ink-muted">
            Looking to collaborate or start a conversation about a future
            project?
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {SHOW_CONTACT ? (
              <ContactNavLink
                className={cn(
                  buttonVariants({ variant: "primary", size: "lg" }),
                )}
              >
                Get in touch
              </ContactNavLink>
            ) : null}
            <a
              href={RESUME_PDF_HREF}
              download="RJ_Oliver_Resume.pdf"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "inline-flex items-center gap-2",
              )}
            >
              <Download className="h-4 w-4" aria-hidden />
              Download resume
            </a>
            <a
              href={OTHER_EXPERIENCE_PDF_HREF}
              download="RJ_Oliver_Other_Experience.pdf"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "inline-flex items-center gap-2",
              )}
            >
              <Download className="h-4 w-4" aria-hidden />
              Other experience
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
