import {
  EnrollmentStatus,
  LessonProgressStatus,
  LessonType,
  PrismaClient,
  ResourceDifficulty,
  ResourceStatus,
  ResourceType,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

const iso = (value: string) => new Date(`${value}T12:00:00.000Z`);
const uuid = (group: number, item: number) =>
  `${group}0000000-0000-4000-8000-${item.toString().padStart(12, "0")}`;
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const users = [
  {
    id: uuid(1, 1),
    name: "Maya Patel",
    email: "maya.patel@learn-demo.example",
    role: UserRole.USER,
    avatarUrl: null,
  },
  {
    id: uuid(1, 2),
    name: "Daniel Kim",
    email: "daniel.kim@learn-demo.example",
    role: UserRole.USER,
    avatarUrl: null,
  },
  {
    id: uuid(1, 3),
    name: "Aisha Rahman",
    email: "admin@learn-demo.example",
    role: UserRole.ADMIN,
    avatarUrl: null,
  },
] as const;

const authors = [
  {
    id: uuid(2, 1),
    name: "Dr. Elena Marquez",
    slug: "elena-marquez",
    bio: "Applied AI researcher focused on reliable language-model systems and evaluation.",
  },
  {
    id: uuid(2, 2),
    name: "Marcus Chen",
    slug: "marcus-chen",
    bio: "Software architect who teaches developers to ship practical generative AI products.",
  },
  {
    id: uuid(2, 3),
    name: "Priya Nair",
    slug: "priya-nair",
    bio: "Automation consultant helping teams redesign everyday workflows with responsible AI.",
  },
  {
    id: uuid(2, 4),
    name: "Jon Bell",
    slug: "jon-bell",
    bio: "Product designer exploring multimodal tools, creative workflows, and design systems.",
  },
  {
    id: uuid(2, 5),
    name: "Sofia Alvarez",
    slug: "sofia-alvarez",
    bio: "Data scientist specializing in AI-assisted analysis, research, and decision support.",
  },
  {
    id: uuid(2, 6),
    name: "Owen Brooks",
    slug: "owen-brooks",
    bio: "Growth strategist teaching practical AI use in marketing and knowledge work.",
  },
] as const;

const categoryNames = [
  "Prompt Engineering",
  "AI Agents",
  "Generative AI",
  "AI for Developers",
  "Productivity",
  "Automation",
  "Data Analysis",
  "Marketing",
  "Design",
  "Research",
] as const;

const categories = categoryNames.map((name, index) => ({
  id: uuid(3, index + 1),
  name,
  slug: slugify(name),
  description: `Practical learning resources covering ${name.toLowerCase()} concepts, tools, and workflows.`,
}));

const tagNames = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "RAG",
  "LLM",
  "Agents",
  "Prompting",
  "Automation",
  "Coding",
  "No-Code",
  "TypeScript",
  "Vector Databases",
  "Evaluation",
  "Data",
  "Marketing",
  "Design",
  "Research",
  "Responsible AI",
] as const;

const tags = tagNames.map((name, index) => ({
  id: uuid(4, index + 1),
  name,
  slug: slugify(name),
}));

type ResourceSeed = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  type: ResourceType;
  difficulty: ResourceDifficulty;
  status: ResourceStatus;
  durationMinutes: number;
  authorSlug: string;
  categoryNames: string[];
  tagNames: string[];
  publishedAt: Date | null;
  isFeatured: boolean;
};

const resource = (
  item: number,
  data: Omit<ResourceSeed, "id">,
): ResourceSeed => ({ id: uuid(5, item), ...data });

const resources: ResourceSeed[] = [
  resource(1, { title: "Prompt Engineering Fundamentals", slug: "prompt-engineering-fundamentals", shortDescription: "Write clear, testable prompts for reliable everyday AI results.", type: ResourceType.COURSE, difficulty: ResourceDifficulty.BEGINNER, status: ResourceStatus.PUBLISHED, durationMinutes: 75, authorSlug: "elena-marquez", categoryNames: ["Prompt Engineering", "Generative AI"], tagNames: ["Prompting", "ChatGPT", "LLM"], publishedAt: iso("2026-08-12"), isFeatured: true }),
  resource(2, { title: "Build Your First AI Agent", slug: "build-your-first-ai-agent", shortDescription: "Create a tool-using agent with planning, memory, and safety boundaries.", type: ResourceType.COURSE, difficulty: ResourceDifficulty.INTERMEDIATE, status: ResourceStatus.PUBLISHED, durationMinutes: 110, authorSlug: "marcus-chen", categoryNames: ["AI Agents", "AI for Developers"], tagNames: ["Agents", "Coding", "LLM", "TypeScript"], publishedAt: iso("2026-07-28"), isFeatured: true }),
  resource(3, { title: "Introduction to RAG", slug: "introduction-to-rag", shortDescription: "Ground language-model answers in trusted documents and data.", type: ResourceType.COURSE, difficulty: ResourceDifficulty.INTERMEDIATE, status: ResourceStatus.PUBLISHED, durationMinutes: 95, authorSlug: "elena-marquez", categoryNames: ["AI for Developers", "Research"], tagNames: ["RAG", "Vector Databases", "LLM"], publishedAt: iso("2026-06-20"), isFeatured: true }),
  resource(4, { title: "Generative AI for Developers", slug: "generative-ai-for-developers", shortDescription: "Add structured generation and model workflows to modern applications.", type: ResourceType.COURSE, difficulty: ResourceDifficulty.INTERMEDIATE, status: ResourceStatus.PUBLISHED, durationMinutes: 120, authorSlug: "marcus-chen", categoryNames: ["Generative AI", "AI for Developers"], tagNames: ["Coding", "TypeScript", "LLM"], publishedAt: iso("2026-05-14"), isFeatured: false }),
  resource(5, { title: "AI Automation for Beginners", slug: "ai-automation-for-beginners", shortDescription: "Automate repetitive work with accessible AI tools and safe handoffs.", type: ResourceType.COURSE, difficulty: ResourceDifficulty.BEGINNER, status: ResourceStatus.PUBLISHED, durationMinutes: 80, authorSlug: "priya-nair", categoryNames: ["Automation", "Productivity"], tagNames: ["Automation", "No-Code", "ChatGPT"], publishedAt: iso("2026-04-02"), isFeatured: true }),
  resource(6, { title: "ChatGPT for Research", slug: "chatgpt-for-research", shortDescription: "Plan, analyze, and synthesize research while maintaining source discipline.", type: ResourceType.COURSE, difficulty: ResourceDifficulty.BEGINNER, status: ResourceStatus.PUBLISHED, durationMinutes: 70, authorSlug: "sofia-alvarez", categoryNames: ["Research", "Productivity"], tagNames: ["ChatGPT", "Research", "Prompting"], publishedAt: iso("2026-03-18"), isFeatured: false }),
  resource(7, { title: "AI for Data Analysis", slug: "ai-for-data-analysis", shortDescription: "Use AI to explore datasets, generate hypotheses, and communicate findings.", type: ResourceType.COURSE, difficulty: ResourceDifficulty.INTERMEDIATE, status: ResourceStatus.PUBLISHED, durationMinutes: 105, authorSlug: "sofia-alvarez", categoryNames: ["Data Analysis", "Generative AI"], tagNames: ["Data", "Coding", "ChatGPT"], publishedAt: iso("2026-02-06"), isFeatured: true }),
  resource(8, { title: "Building Reliable LLM Applications", slug: "building-reliable-llm-applications", shortDescription: "Design observable, testable LLM systems that fail safely.", type: ResourceType.COURSE, difficulty: ResourceDifficulty.ADVANCED, status: ResourceStatus.PUBLISHED, durationMinutes: 145, authorSlug: "elena-marquez", categoryNames: ["AI for Developers", "Generative AI"], tagNames: ["LLM", "Evaluation", "Responsible AI", "Coding"], publishedAt: iso("2025-12-11"), isFeatured: true }),
  resource(9, { title: "Multi-Agent Systems in Practice", slug: "multi-agent-systems-in-practice", shortDescription: "Coordinate specialized agents across complex, auditable workflows.", type: ResourceType.COURSE, difficulty: ResourceDifficulty.ADVANCED, status: ResourceStatus.PUBLISHED, durationMinutes: 150, authorSlug: "marcus-chen", categoryNames: ["AI Agents", "Automation"], tagNames: ["Agents", "Automation", "Evaluation"], publishedAt: iso("2025-10-23"), isFeatured: false }),
  resource(10, { title: "AI-Assisted TypeScript Development", slug: "ai-assisted-typescript-development", shortDescription: "Pair with AI while preserving type safety, tests, and engineering judgment.", type: ResourceType.COURSE, difficulty: ResourceDifficulty.INTERMEDIATE, status: ResourceStatus.PUBLISHED, durationMinutes: 100, authorSlug: "marcus-chen", categoryNames: ["AI for Developers", "Productivity"], tagNames: ["TypeScript", "Coding", "Claude"], publishedAt: iso("2025-08-19"), isFeatured: false }),
  resource(11, { title: "Designing with Generative AI", slug: "designing-with-generative-ai", shortDescription: "Integrate generative tools into an intentional product design process.", type: ResourceType.COURSE, difficulty: ResourceDifficulty.BEGINNER, status: ResourceStatus.ARCHIVED, durationMinutes: 85, authorSlug: "jon-bell", categoryNames: ["Design", "Generative AI"], tagNames: ["Design", "Gemini", "Prompting"], publishedAt: iso("2025-03-12"), isFeatured: false }),
  resource(12, { title: "Advanced RAG Evaluation", slug: "advanced-rag-evaluation", shortDescription: "Measure retrieval and answer quality with production-grade evaluation sets.", type: ResourceType.COURSE, difficulty: ResourceDifficulty.ADVANCED, status: ResourceStatus.DRAFT, durationMinutes: 135, authorSlug: "elena-marquez", categoryNames: ["AI for Developers", "Data Analysis"], tagNames: ["RAG", "Evaluation", "Vector Databases"], publishedAt: null, isFeatured: false }),
  resource(13, { title: "Claude for Long-Form Analysis", slug: "claude-for-long-form-analysis", shortDescription: "A practical workflow for analyzing lengthy documents with Claude.", type: ResourceType.GUIDE, difficulty: ResourceDifficulty.BEGINNER, status: ResourceStatus.PUBLISHED, durationMinutes: 25, authorSlug: "sofia-alvarez", categoryNames: ["Research", "Productivity"], tagNames: ["Claude", "Research", "LLM"], publishedAt: iso("2026-08-25"), isFeatured: true }),
  resource(14, { title: "Gemini Multimodal Workflow Guide", slug: "gemini-multimodal-workflow-guide", shortDescription: "Combine text, images, and files in practical Gemini workflows.", type: ResourceType.GUIDE, difficulty: ResourceDifficulty.INTERMEDIATE, status: ResourceStatus.PUBLISHED, durationMinutes: 30, authorSlug: "jon-bell", categoryNames: ["Generative AI", "Design"], tagNames: ["Gemini", "Design", "Automation"], publishedAt: iso("2026-08-02"), isFeatured: false }),
  resource(15, { title: "Choosing the Right LLM", slug: "choosing-the-right-llm", shortDescription: "Compare models using quality, latency, privacy, and cost requirements.", type: ResourceType.GUIDE, difficulty: ResourceDifficulty.INTERMEDIATE, status: ResourceStatus.PUBLISHED, durationMinutes: 35, authorSlug: "elena-marquez", categoryNames: ["AI for Developers", "Generative AI"], tagNames: ["LLM", "Evaluation", "ChatGPT", "Claude", "Gemini"], publishedAt: iso("2026-07-07"), isFeatured: true }),
  resource(16, { title: "Production Prompt Testing", slug: "production-prompt-testing", shortDescription: "Turn prompt experiments into repeatable regression tests.", type: ResourceType.GUIDE, difficulty: ResourceDifficulty.ADVANCED, status: ResourceStatus.PUBLISHED, durationMinutes: 40, authorSlug: "elena-marquez", categoryNames: ["Prompt Engineering", "AI for Developers"], tagNames: ["Prompting", "Evaluation", "Coding"], publishedAt: iso("2026-06-01"), isFeatured: false }),
  resource(17, { title: "No-Code AI Automation Playbook", slug: "no-code-ai-automation-playbook", shortDescription: "Map and automate a business workflow without writing application code.", type: ResourceType.GUIDE, difficulty: ResourceDifficulty.BEGINNER, status: ResourceStatus.PUBLISHED, durationMinutes: 28, authorSlug: "priya-nair", categoryNames: ["Automation", "Productivity"], tagNames: ["No-Code", "Automation", "Agents"], publishedAt: iso("2026-04-24"), isFeatured: true }),
  resource(18, { title: "Responsible AI Checklist", slug: "responsible-ai-checklist", shortDescription: "Review an AI feature for risk, transparency, privacy, and human oversight.", type: ResourceType.GUIDE, difficulty: ResourceDifficulty.BEGINNER, status: ResourceStatus.ARCHIVED, durationMinutes: 20, authorSlug: "elena-marquez", categoryNames: ["Generative AI", "Research"], tagNames: ["Responsible AI", "Evaluation"], publishedAt: iso("2025-02-14"), isFeatured: false }),
  resource(19, { title: "AI Marketing Campaign Blueprint", slug: "ai-marketing-campaign-blueprint", shortDescription: "Plan a focused campaign from audience research through content review.", type: ResourceType.GUIDE, difficulty: ResourceDifficulty.BEGINNER, status: ResourceStatus.PUBLISHED, durationMinutes: 32, authorSlug: "owen-brooks", categoryNames: ["Marketing", "Productivity"], tagNames: ["Marketing", "ChatGPT", "Automation"], publishedAt: iso("2026-03-03"), isFeatured: false }),
  resource(20, { title: "Vector Databases Explained", slug: "vector-databases-explained", shortDescription: "Understand embeddings, similarity search, indexing, and retrieval tradeoffs.", type: ResourceType.GUIDE, difficulty: ResourceDifficulty.INTERMEDIATE, status: ResourceStatus.PUBLISHED, durationMinutes: 38, authorSlug: "marcus-chen", categoryNames: ["AI for Developers", "Data Analysis"], tagNames: ["Vector Databases", "RAG", "Data"], publishedAt: iso("2025-11-06"), isFeatured: false }),
  resource(21, { title: "Research Synthesis with AI", slug: "research-synthesis-with-ai", shortDescription: "Synthesize evidence into structured findings without losing traceability.", type: ResourceType.GUIDE, difficulty: ResourceDifficulty.INTERMEDIATE, status: ResourceStatus.PUBLISHED, durationMinutes: 34, authorSlug: "sofia-alvarez", categoryNames: ["Research", "Data Analysis"], tagNames: ["Research", "Claude", "Responsible AI"], publishedAt: iso("2025-09-09"), isFeatured: false }),
  resource(22, { title: "Evaluating AI Agent Reliability", slug: "evaluating-ai-agent-reliability", shortDescription: "A draft field guide to testing tool use, recovery, and agent boundaries.", type: ResourceType.GUIDE, difficulty: ResourceDifficulty.ADVANCED, status: ResourceStatus.DRAFT, durationMinutes: 45, authorSlug: "elena-marquez", categoryNames: ["AI Agents", "AI for Developers"], tagNames: ["Agents", "Evaluation", "Responsible AI"], publishedAt: null, isFeatured: false }),
  resource(23, { title: "The Practical LLM Handbook", slug: "the-practical-llm-handbook", shortDescription: "A concise reference for selecting, prompting, and evaluating language models.", type: ResourceType.EBOOK, difficulty: ResourceDifficulty.INTERMEDIATE, status: ResourceStatus.PUBLISHED, durationMinutes: 180, authorSlug: "elena-marquez", categoryNames: ["Generative AI", "AI for Developers"], tagNames: ["LLM", "Prompting", "Evaluation"], publishedAt: iso("2026-07-16"), isFeatured: true }),
  resource(24, { title: "AI Productivity Field Guide", slug: "ai-productivity-field-guide", shortDescription: "Repeatable patterns for better writing, planning, meetings, and decisions.", type: ResourceType.EBOOK, difficulty: ResourceDifficulty.BEGINNER, status: ResourceStatus.PUBLISHED, durationMinutes: 150, authorSlug: "priya-nair", categoryNames: ["Productivity", "Automation"], tagNames: ["ChatGPT", "Claude", "Automation"], publishedAt: iso("2026-05-29"), isFeatured: false }),
  resource(25, { title: "RAG Architecture Patterns", slug: "rag-architecture-patterns", shortDescription: "Reference architectures for ingestion, retrieval, generation, and observability.", type: ResourceType.EBOOK, difficulty: ResourceDifficulty.ADVANCED, status: ResourceStatus.PUBLISHED, durationMinutes: 220, authorSlug: "marcus-chen", categoryNames: ["AI for Developers", "Data Analysis"], tagNames: ["RAG", "Vector Databases", "LLM"], publishedAt: iso("2026-01-22"), isFeatured: true }),
  resource(26, { title: "The AI Developer's Testing Manual", slug: "ai-developers-testing-manual", shortDescription: "Test nondeterministic AI features with datasets, rubrics, and observability.", type: ResourceType.EBOOK, difficulty: ResourceDifficulty.ADVANCED, status: ResourceStatus.PUBLISHED, durationMinutes: 200, authorSlug: "elena-marquez", categoryNames: ["AI for Developers", "Generative AI"], tagNames: ["Evaluation", "Coding", "Responsible AI"], publishedAt: iso("2025-07-03"), isFeatured: false }),
  resource(27, { title: "Generative Design Systems", slug: "generative-design-systems", shortDescription: "A visual guide to governed AI workflows inside product design systems.", type: ResourceType.EBOOK, difficulty: ResourceDifficulty.INTERMEDIATE, status: ResourceStatus.PUBLISHED, durationMinutes: 165, authorSlug: "jon-bell", categoryNames: ["Design", "Generative AI"], tagNames: ["Design", "Gemini", "Responsible AI"], publishedAt: iso("2025-05-21"), isFeatured: false }),
  resource(28, { title: "Enterprise AI Adoption Guide", slug: "enterprise-ai-adoption-guide", shortDescription: "A forthcoming guide to piloting and governing AI across an organization.", type: ResourceType.EBOOK, difficulty: ResourceDifficulty.INTERMEDIATE, status: ResourceStatus.DRAFT, durationMinutes: 190, authorSlug: "priya-nair", categoryNames: ["Automation", "Productivity"], tagNames: ["Automation", "Responsible AI", "No-Code"], publishedAt: null, isFeatured: false }),
];

const courseLessonTitles: Record<string, string[]> = {
  "prompt-engineering-fundamentals": ["How Models Interpret Instructions", "Anatomy of an Effective Prompt", "Adding Context and Constraints", "Iterative Prompt Refinement", "Capstone: A Reusable Prompt System"],
  "build-your-first-ai-agent": ["From Chatbots to Agents", "Defining Tools and Boundaries", "Planning a Multi-Step Task", "Memory and State", "Testing the Complete Agent"],
  "introduction-to-rag": ["Why Retrieval Matters", "Preparing a Document Corpus", "Embeddings and Similarity Search", "Building the Retrieval Pipeline", "Evaluating Grounded Answers"],
  "generative-ai-for-developers": ["Model APIs and Structured Output", "Designing a Generation Workflow", "Streaming and User Experience", "Handling Failures and Retries", "Shipping a Small AI Feature"],
  "ai-automation-for-beginners": ["Finding the Right Task to Automate", "Mapping Inputs and Outputs", "Building a No-Code Workflow", "Human Review and Error Handling", "Launching Your First Automation"],
  "chatgpt-for-research": ["Turning Questions into a Research Plan", "Finding and Organizing Evidence", "Working with Long Documents", "Checking Claims and Citations", "Writing a Traceable Synthesis"],
  "ai-for-data-analysis": ["Framing an Analysis Question", "Preparing Data for AI Assistance", "Exploratory Analysis with Code", "Validating AI-Generated Findings", "Communicating the Result"],
  "building-reliable-llm-applications": ["Reliability as a System Property", "Structured Outputs and Validation", "Evaluation Datasets and Rubrics", "Observability and Failure Analysis", "Production Readiness Review"],
  "multi-agent-systems-in-practice": ["When Multiple Agents Help", "Designing Agent Responsibilities", "Coordination and Shared State", "Failure Recovery and Escalation", "Evaluating the Full System"],
  "ai-assisted-typescript-development": ["A Safe AI Pairing Workflow", "Generating Typed Interfaces", "Refactoring with Constraints", "Writing and Reviewing Tests", "A Type-Safe Feature Exercise"],
  "designing-with-generative-ai": ["Choosing a Creative Use Case", "Building a Visual Prompt Brief", "Exploring Controlled Variations", "Critique, Selection, and Refinement", "Documenting a Repeatable Workflow"],
  "advanced-rag-evaluation": ["Evaluation Goals and Failure Modes", "Building a Representative Test Set", "Measuring Retrieval Quality", "Judging Answer Faithfulness", "Continuous Evaluation in Production"],
};

const courses = resources.filter((item) => item.type === ResourceType.COURSE);
const lessons = courses.flatMap((course, courseIndex) => {
  const titles = courseLessonTitles[course.slug];
  return titles.map((title, lessonIndex) => {
    const type = [LessonType.TEXT, LessonType.VIDEO, LessonType.TEXT, LessonType.LINK, LessonType.TEXT][lessonIndex];
    const durationMinutes = [10, 14, 16, 12, 18][lessonIndex];
    return {
      id: uuid(6, courseIndex * 100 + lessonIndex + 1),
      resourceId: course.id,
      title,
      slug: slugify(title),
      description: `${title} applied to ${course.title.toLowerCase()}.`,
      type,
      content: type === LessonType.TEXT ? `This lesson explains ${title.toLowerCase()} through a practical example, a review checklist, and a short exercise.` : null,
      videoUrl: null,
      externalUrl: null,
      durationMinutes,
      order: lessonIndex + 1,
      isPreview: lessonIndex === 0,
    };
  });
});

type EnrollmentPlan = {
  userId: string;
  courseId: string;
  statuses: LessonProgressStatus[];
  startedAt: Date;
  lastAccessedAt: Date;
  completedAt: Date | null;
};

const enrollmentPlans: EnrollmentPlan[] = [
  { userId: users[0].id, courseId: resources[0].id, statuses: [LessonProgressStatus.COMPLETED, LessonProgressStatus.COMPLETED, LessonProgressStatus.IN_PROGRESS, LessonProgressStatus.NOT_STARTED, LessonProgressStatus.NOT_STARTED], startedAt: iso("2026-08-18"), lastAccessedAt: iso("2026-09-03"), completedAt: null },
  { userId: users[0].id, courseId: resources[1].id, statuses: [LessonProgressStatus.COMPLETED, LessonProgressStatus.IN_PROGRESS, LessonProgressStatus.NOT_STARTED, LessonProgressStatus.NOT_STARTED, LessonProgressStatus.NOT_STARTED], startedAt: iso("2026-08-27"), lastAccessedAt: iso("2026-09-04"), completedAt: null },
  { userId: users[0].id, courseId: resources[3].id, statuses: [LessonProgressStatus.COMPLETED, LessonProgressStatus.COMPLETED, LessonProgressStatus.COMPLETED, LessonProgressStatus.IN_PROGRESS, LessonProgressStatus.NOT_STARTED], startedAt: iso("2026-07-09"), lastAccessedAt: iso("2026-08-30"), completedAt: null },
  { userId: users[0].id, courseId: resources[2].id, statuses: Array(5).fill(LessonProgressStatus.COMPLETED), startedAt: iso("2026-05-05"), lastAccessedAt: iso("2026-06-02"), completedAt: iso("2026-06-02") },
  { userId: users[1].id, courseId: resources[4].id, statuses: [LessonProgressStatus.COMPLETED, LessonProgressStatus.COMPLETED, LessonProgressStatus.IN_PROGRESS, LessonProgressStatus.NOT_STARTED, LessonProgressStatus.NOT_STARTED], startedAt: iso("2026-08-11"), lastAccessedAt: iso("2026-09-01"), completedAt: null },
  { userId: users[1].id, courseId: resources[5].id, statuses: Array(5).fill(LessonProgressStatus.COMPLETED), startedAt: iso("2026-04-01"), lastAccessedAt: iso("2026-04-20"), completedAt: iso("2026-04-20") },
];

const bookmarkPairs = [
  [users[0].id, resources[7].id],
  [users[0].id, resources[12].id],
  [users[0].id, resources[22].id],
  [users[0].id, resources[16].id],
  [users[1].id, resources[1].id],
  [users[1].id, resources[14].id],
  [users[1].id, resources[24].id],
  [users[1].id, resources[18].id],
] as const;

async function main() {
  await prisma.$transaction(
    async (tx) => {
      for (const user of users) {
        await tx.user.upsert({
          where: { id: user.id },
          update: { name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl, passwordHash: "DEV_ONLY_NOT_A_REAL_PASSWORD_HASH" },
          create: { ...user, passwordHash: "DEV_ONLY_NOT_A_REAL_PASSWORD_HASH" },
        });
      }

      for (const author of authors) {
        await tx.author.upsert({
          where: { id: author.id },
          update: { name: author.name, slug: author.slug, bio: author.bio, avatarUrl: null },
          create: { ...author, avatarUrl: null },
        });
      }

      for (const category of categories) {
        await tx.category.upsert({ where: { id: category.id }, update: category, create: category });
      }
      for (const tag of tags) {
        await tx.tag.upsert({ where: { id: tag.id }, update: tag, create: tag });
      }

      const authorIdBySlug = new Map<string, string>(authors.map((author) => [author.slug, author.id]));
      for (const item of resources) {
        const data = {
          title: item.title,
          slug: item.slug,
          shortDescription: item.shortDescription,
          description: `${item.shortDescription} Work through practical patterns, common failure modes, and a reusable workflow you can apply to real projects.`,
          thumbnailUrl: null,
          type: item.type,
          difficulty: item.difficulty,
          status: item.status,
          durationMinutes: item.durationMinutes,
          sourceUrl: null,
          isFeatured: item.isFeatured,
          authorId: authorIdBySlug.get(item.authorSlug)!,
          publishedAt: item.publishedAt,
        };
        await tx.learningResource.upsert({ where: { id: item.id }, update: data, create: { id: item.id, ...data } });
      }

      const resourceIds = resources.map((item) => item.id);
      await tx.learningResourceCategory.deleteMany({ where: { resourceId: { in: resourceIds } } });
      await tx.learningResourceTag.deleteMany({ where: { resourceId: { in: resourceIds } } });
      const categoryIdByName = new Map<string, string>(categories.map((category) => [category.name, category.id]));
      const tagIdByName = new Map<string, string>(tags.map((tag) => [tag.name, tag.id]));
      await tx.learningResourceCategory.createMany({
        data: resources.flatMap((item) => item.categoryNames.map((name) => ({ resourceId: item.id, categoryId: categoryIdByName.get(name)! }))),
      });
      await tx.learningResourceTag.createMany({
        data: resources.flatMap((item) => item.tagNames.map((name) => ({ resourceId: item.id, tagId: tagIdByName.get(name)! }))),
      });

      for (const lesson of lessons) {
        await tx.lesson.upsert({ where: { id: lesson.id }, update: lesson, create: lesson });
      }

      const lessonByCourse = new Map<string, typeof lessons>();
      for (const lesson of lessons) {
        const existing = lessonByCourse.get(lesson.resourceId) ?? [];
        existing.push(lesson);
        lessonByCourse.set(lesson.resourceId, existing);
      }

      for (const [planIndex, plan] of enrollmentPlans.entries()) {
        const courseLessons = lessonByCourse.get(plan.courseId)!.sort((a, b) => a.order - b.order);
        const completedCount = plan.statuses.filter((status) => status === LessonProgressStatus.COMPLETED).length;
        const progressPercentage = Math.round((completedCount / courseLessons.length) * 100);
        const enrollmentStatus = progressPercentage === 100 ? EnrollmentStatus.COMPLETED : EnrollmentStatus.ACTIVE;
        const enrollmentData = {
          status: enrollmentStatus,
          progressPercentage,
          startedAt: plan.startedAt,
          lastAccessedAt: plan.lastAccessedAt,
          completedAt: plan.completedAt,
        };
        await tx.enrollment.upsert({
          where: { userId_resourceId: { userId: plan.userId, resourceId: plan.courseId } },
          update: enrollmentData,
          create: { id: uuid(7, planIndex + 1), userId: plan.userId, resourceId: plan.courseId, ...enrollmentData },
        });

        for (const [lessonIndex, lesson] of courseLessons.entries()) {
          const status = plan.statuses[lessonIndex];
          const startedAt = status === LessonProgressStatus.NOT_STARTED ? null : new Date(plan.startedAt.getTime() + lessonIndex * 86_400_000);
          const completedAt = status === LessonProgressStatus.COMPLETED ? new Date(startedAt!.getTime() + 3_600_000) : null;
          const positionSeconds = status === LessonProgressStatus.IN_PROGRESS ? Math.floor(lesson.durationMinutes * 60 * 0.45) : 0;
          const progressData = { status, positionSeconds, startedAt, completedAt };
          await tx.lessonProgress.upsert({
            where: { userId_lessonId: { userId: plan.userId, lessonId: lesson.id } },
            update: progressData,
            create: { id: uuid(8, planIndex * 100 + lessonIndex + 1), userId: plan.userId, lessonId: lesson.id, ...progressData },
          });
        }
      }

      for (const [index, [userId, resourceId]] of bookmarkPairs.entries()) {
        await tx.bookmark.upsert({
          where: { userId_resourceId: { userId, resourceId } },
          update: {},
          create: { id: uuid(9, index + 1), userId, resourceId, createdAt: iso(`2026-08-${String(index + 10).padStart(2, "0")}`) },
        });
      }
    },
    { maxWait: 20_000, timeout: 120_000 },
  );

  const seedIds = {
    users: users.map((item) => item.id),
    authors: authors.map((item) => item.id),
    categories: categories.map((item) => item.id),
    tags: tags.map((item) => item.id),
    resources: resources.map((item) => item.id),
    lessons: lessons.map((item) => item.id),
  };
  const [userCount, authorCount, categoryCount, tagCount, resourceCount, lessonCount, enrollmentCount, progressCount, bookmarkCount] = await Promise.all([
    prisma.user.count({ where: { id: { in: seedIds.users } } }),
    prisma.author.count({ where: { id: { in: seedIds.authors } } }),
    prisma.category.count({ where: { id: { in: seedIds.categories } } }),
    prisma.tag.count({ where: { id: { in: seedIds.tags } } }),
    prisma.learningResource.count({ where: { id: { in: seedIds.resources } } }),
    prisma.lesson.count({ where: { id: { in: seedIds.lessons } } }),
    prisma.enrollment.count({ where: { userId: { in: seedIds.users } } }),
    prisma.lessonProgress.count({ where: { userId: { in: seedIds.users } } }),
    prisma.bookmark.count({ where: { userId: { in: seedIds.users } } }),
  ]);
  console.table({ User: userCount, Author: authorCount, Category: categoryCount, Tag: tagCount, LearningResource: resourceCount, Lesson: lessonCount, Enrollment: enrollmentCount, LessonProgress: progressCount, Bookmark: bookmarkCount });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
