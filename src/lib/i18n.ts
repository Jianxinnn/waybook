export type Lang = 'en' | 'zh';

type SearchParamReader = { get(name: string): string | null };
type SearchParamRecord = Record<string, string | string[] | undefined>;

export function resolveLang(
  searchParams: SearchParamRecord | SearchParamReader | undefined | null
): Lang {
  if (!searchParams) return 'en';
  const raw =
    typeof (searchParams as SearchParamReader).get === 'function'
      ? (searchParams as SearchParamReader).get('lang')
      : (() => {
          const val = (searchParams as SearchParamRecord).lang;
          return typeof val === 'string' ? val : Array.isArray(val) ? val[0] : null;
        })();
  return raw === 'zh' ? 'zh' : 'en';
}

export function withLangQuery(href: string, lang: Lang) {
  const [pathname, query = ''] = href.split('?');
  const params = new URLSearchParams(query);
  if (lang === 'zh') params.set('lang', 'zh');
  else params.delete('lang');
  const next = params.toString();
  return next ? `${pathname}?${next}` : pathname;
}

import type { ReviewScope } from '@/types/review';

export function buildWorkspaceHref(href: string, scope: ReviewScope | null, lang: Lang) {
  const [pathname, query = ''] = href.split('?');
  const params = new URLSearchParams(query);
  if (scope) {
    params.set('scopeKind', scope.scopeKind);
    params.set('scopeValue', scope.scopeValue);
    params.set('scopeLabel', scope.scopeLabel);
  }
  if (lang === 'zh') params.set('lang', 'zh');
  const next = params.toString();
  return next ? `${pathname}?${next}` : pathname;
}

interface Dict {
  shell: {
    eyebrow: string;
    tagline: string;
    nav: { today: string; pulse: string; projects: string; timeline: string; knowledge: string; reviews: string };
    langToggle: { en: string; zh: string };
  };
  today: {
    title: string;
    description: string;
    sectionScope: string;
    scopeHint: (label: string) => string;
    sectionActivity: string;
    activityHint: string;
    sectionProjects: string;
    projectsHint: string;
    sectionEvidence: string;
    evidenceHint: string;
    sectionDecision: string;
    decisionHint: string;
    openTimeline: string;
    openReviews: string;
    metricEvents: string;
    metricEventsHint: string;
    metricProjects: string;
    metricProjectsHint: string;
    metricConnectors: string;
    metricConnectorsHint: string;
    dailyBrief: string;
    weeklyOutlook: string;
    promotionHeading: string;
    promotionHint: string;
    sourceMix: string;
    days14: string;
  };
  projects: {
    title: string;
    description: string;
    sectionPortfolio: string;
    portfolioHint: string;
    sectionThreads: string;
    threadsHint: string;
    noProjects: string;
    noThreads: string;
    sectionScope: string;
    scopeHint: (label: string) => string;
  };
  projectDetail: {
    eyebrow: string;
    description: (projectKey: string) => string;
    sectionEvidence: string;
    sectionActiveThreads: string;
    sectionStalledThreads: string;
    sectionRepeated: string;
    repeatedEmpty: string;
    noActiveThreads: string;
    noStalledThreads: string;
    noEntities: string;
    activitySpark: string;
  };
  timeline: {
    title: string;
    description: string;
    sectionFilters: string;
    filtersHint: string;
    sectionStream: string;
    streamHint: string;
    noEvents: string;
    todayLabel: string;
    yesterdayLabel: string;
    events: (n: number) => string;
    topSources: string;
  };
  entities: {
    title: string;
    description: string;
    sectionScope: string;
    scopeHint: (label: string) => string;
    sectionAtlas: string;
    atlasHint: string;
    noEntities: string;
    openEntity: string;
    typeLabel: Record<string, string>;
  };
  reviews: {
    title: string;
    description: string;
    sectionScope: string;
    scopeHint: (label: string) => string;
    sectionFrontPage: string;
    frontPageHint: string;
    sectionFeed: string;
    feedHint: string;
    noReviews: string;
    openDraft: string;
    promotions: (n: number) => string;
    nextSteps: (n: number) => string;
    labelDaily: string;
    labelBrief: string;
    labelWeekly: string;
  };
  review: {
    latest: string;
    pulse: string;
    promotionCandidates: string;
    suggestedNextSteps: string;
  };
  pulse: {
    title: string;
    lead: (label: string) => string;
    sectionToday: string;
    todayMeta: (events: number, threads: number, entities: number) => string;
    emptyToday: string;
    sectionWeek: string;
    weekMeta: (events: number, projects: number) => string;
    emptyWeek: string;
    tableProject: string;
    tableTotal: string;
    sectionMonth: string;
    monthMeta: (events: number, deepDays: number) => string;
    shipped: string;
    shippedEmpty: string;
    stalled: string;
    stalledEmpty: string;
    newProjects: string;
    newProjectsEmpty: string;
    repeated: string;
    repeatedEmpty: string;
    monthReviews: string;
    weight: string;
    times: (n: number) => string;
  };
  lifeline: {
    heading: string;
    empty: string;
    counts: (moving: number, waiting: number, dormant: number, done: number) => string;
    statusLabel: { inProgress: string; waiting: string; dormant: string; completed: string };
    roleLabel: { first: string; peak: string; last: string };
  };
  scope: {
    portfolio: string;
    project: string;
    repo: string;
  };
  status: {
    active: string;
    stalled: string;
    dormant: string;
  };
  provenance: {
    primary: string;
    derived: string;
    synthetic: string;
  };
  common: {
    events: string;
    knowledge: string;
    threads: string;
    waiting: string;
    importance: string;
    actor: { user: string; agent: string; system: string };
  };
}

export const dict: Record<Lang, Dict> = {
  en: {
    shell: {
      eyebrow: 'Waybook Workspace',
      tagline: 'An editorial research desk for active projects, evidence, and review-ready context.',
      nav: {
        today: 'Today',
        pulse: 'Pulse',
        projects: 'Projects',
        timeline: 'Timeline',
        knowledge: 'Knowledge',
        reviews: 'Reviews'
      },
      langToggle: { en: 'EN', zh: '中文' }
    },
    today: {
      title: 'Today',
      description:
        'A research desk for the current working set: active projects, recent evidence, and decision support grounded in the latest workspace snapshot.',
      sectionScope: 'Scope',
      scopeHint: (label) => `Currently reading the ${label} surface.`,
      sectionActivity: 'Research Pulse',
      activityHint: 'Daily event volume and connector mix for the last 14 days.',
      sectionProjects: 'Active Projects',
      projectsHint:
        'Project surfaces summarize the most active threads, current knowledge density, and the freshest evidence across the workspace.',
      sectionEvidence: 'Recent Evidence',
      evidenceHint: 'Latest research activity flowing in from every connector, ordered for editorial review.',
      sectionDecision: 'Decision Support',
      decisionHint: 'Daily and weekly review outputs stay close to the evidence so the next move is easy to inspect.',
      openTimeline: 'Open timeline',
      openReviews: 'Open reviews',
      metricEvents: 'Events in scope',
      metricEventsHint: 'Evidence normalized into the editorial workspace.',
      metricProjects: 'Projects in scope',
      metricProjectsHint: 'Active project surfaces assembled from timeline and knowledge views.',
      metricConnectors: 'Connectors live',
      metricConnectorsHint: 'Evidence from git, assistants, experiments, and more.',
      dailyBrief: 'Daily Brief',
      weeklyOutlook: 'Weekly Outlook',
      promotionHeading: 'Promotion Opportunities',
      promotionHint: 'Secretary suggestions that can be promoted into durable project or topic knowledge.',
      sourceMix: 'Source mix',
      days14: '14 days'
    },
    projects: {
      title: 'Projects in Motion',
      description:
        'A portfolio view of every active project, with activity sparklines and thread intelligence derived from recent evidence.',
      sectionPortfolio: 'Project Surfaces',
      portfolioHint: 'Each tile shows continuous research progress over the last two weeks.',
      sectionThreads: 'Active Threads',
      threadsHint: 'Live threads across the workspace, ranked by latest activity.',
      noProjects: 'No projects have been surfaced yet. Run the ingest pipeline to build the portfolio.',
      noThreads: 'No active threads yet.',
      sectionScope: 'Scope',
      scopeHint: (label) => `Currently reading the ${label} surface.`
    },
    projectDetail: {
      eyebrow: 'Project Detail',
      description: (projectKey) =>
        `Continuous research progress, thread intelligence, and repeated patterns for ${projectKey}.`,
      sectionEvidence: 'Recent Evidence',
      sectionActiveThreads: 'Active Threads',
      sectionStalledThreads: 'Stalled Threads',
      sectionRepeated: 'Repeated Patterns',
      repeatedEmpty: 'No repeated patterns have surfaced yet.',
      noActiveThreads: 'No active threads in this project right now.',
      noStalledThreads: 'Nothing stalled — good signal.',
      noEntities: 'Knowledge compilation has not yet produced entities for this project.',
      activitySpark: 'Activity · last 14 days'
    },
    timeline: {
      title: 'Research Timeline',
      description:
        'Evidence from every connector, normalized into one chronology for reading, filtering, and verification.',
      sectionFilters: 'Active Filters',
      filtersHint: 'The current timeline view is narrowed to the following evidence constraints.',
      sectionStream: 'Latest Research Activity',
      streamHint:
        'Every event is grouped into a single editorial surface so recent work can be reviewed without hopping between tools.',
      noEvents: 'No timeline events have been collected yet.',
      todayLabel: 'Today',
      yesterdayLabel: 'Yesterday',
      events: (n) => `${n} event${n === 1 ? '' : 's'}`,
      topSources: 'Top sources'
    },
    entities: {
      title: 'Compiled Knowledge',
      description:
        'A compiled atlas of durable research surfaces — projects, topics, experiments, and derived summaries.',
      sectionScope: 'Scope',
      scopeHint: (label) => `Currently reading the ${label} surface.`,
      sectionAtlas: 'Knowledge Atlas',
      atlasHint: 'Entities differ by type — project surfaces, thematic topics, and run-level experiments each have their own layout.',
      noEntities: 'No entities have been compiled yet.',
      openEntity: 'Open entity',
      typeLabel: {
        project: 'Project Surface',
        topic: 'Topic',
        experiment: 'Experiment',
        decision: 'Decision',
        method: 'Method',
        artifact: 'Artifact'
      }
    },
    reviews: {
      title: 'Reviews',
      description:
        'Scope-aware editorial briefs: daily pulse, daily review, and weekly outlook — each grounded in real evidence.',
      sectionScope: 'Scope',
      scopeHint: (label) => `Currently reading the ${label} surface.`,
      sectionFrontPage: 'Editorial Front Page',
      frontPageHint: 'The freshest brief in the current scope, with linked evidence and promotion candidates.',
      sectionFeed: 'Review Feed',
      feedHint: 'All drafts in this scope, newest first.',
      noReviews: 'No review drafts exist yet. Run the secretary job to generate one.',
      openDraft: 'Open draft',
      promotions: (n) => `${n} promotion candidate${n === 1 ? '' : 's'}`,
      nextSteps: (n) => `${n} suggested next step${n === 1 ? '' : 's'}`,
      labelDaily: 'daily review',
      labelBrief: 'daily brief',
      labelWeekly: 'weekly review'
    },
    review: {
      latest: 'Latest',
      pulse: 'Editorial pulse',
      promotionCandidates: 'Promotion candidates',
      suggestedNextSteps: 'Suggested next steps'
    },
    pulse: {
      title: 'Pulse',
      lead: (label) =>
        `Daily, weekly, and monthly rhythms — the real cadence of research inside ${label}.`,
      sectionToday: 'Today',
      todayMeta: (events, threads, entities) =>
        `${events} events · ${threads} threads · ${entities} knowledge`,
      emptyToday: 'Nothing above the importance floor moved today.',
      sectionWeek: 'Week Heatmap',
      weekMeta: (events, projects) => `${events} events · ${projects} projects`,
      emptyWeek: 'No research activity this week.',
      tableProject: 'Project',
      tableTotal: 'total',
      sectionMonth: 'Month Arc',
      monthMeta: (events, deepDays) => `${events} events · ${deepDays} deep-work days`,
      shipped: 'Shipped',
      shippedEmpty: 'No explicit shipping signals this month.',
      stalled: 'Stalled',
      stalledEmpty: 'No long-stalled threads.',
      newProjects: 'New projects',
      newProjectsEmpty: 'No new projects this month.',
      repeated: 'Repeated patterns',
      repeatedEmpty: 'No repeated patterns.',
      monthReviews: 'Weekly reviews',
      weight: 'weight',
      times: (n) => `${n} times`
    },
    lifeline: {
      heading: 'Project Lifeline',
      empty: 'No thread data yet to draw the lifeline.',
      counts: (moving, waiting, dormant, done) =>
        `${moving} moving · ${waiting} waiting · ${dormant} dormant · ${done} done`,
      statusLabel: {
        inProgress: 'in progress',
        waiting: 'waiting',
        dormant: 'dormant',
        completed: 'completed'
      },
      roleLabel: { first: 'first', peak: 'peak', last: 'last' }
    },
    scope: { portfolio: 'Portfolio', project: 'Project', repo: 'Repository' },
    status: { active: 'active', stalled: 'stalled', dormant: 'dormant' },
    provenance: { primary: 'primary', derived: 'derived', synthetic: 'synthetic' },
    common: {
      events: 'events',
      knowledge: 'knowledge',
      threads: 'threads',
      waiting: 'Waiting for the next piece of research evidence.',
      importance: 'importance',
      actor: { user: 'human', agent: 'agent', system: 'system' }
    }
  },
  zh: {
    shell: {
      eyebrow: 'Waybook 研究工作台',
      tagline: '面向活跃项目、证据与评审上下文的编辑式研究桌面。',
      nav: {
        today: '今日',
        pulse: '脉搏',
        projects: '项目',
        timeline: '时间线',
        knowledge: '知识',
        reviews: '评审'
      },
      langToggle: { en: 'EN', zh: '中文' }
    },
    today: {
      title: '今日概览',
      description: '当前工作集的研究桌面：活跃项目、最新证据，以及基于工作区最新快照的决策支持。',
      sectionScope: '作用域',
      scopeHint: (label) => `正在以 ${label} 的视角阅读工作区。`,
      sectionActivity: '研究脉搏',
      activityHint: '最近 14 天的每日事件量与连接器构成。',
      sectionProjects: '活跃项目',
      projectsHint: '每个项目卡展示最活跃的线索、当前的知识密度与最新证据。',
      sectionEvidence: '最新证据',
      evidenceHint: '来自所有连接器的研究活动，按时间聚合以便编辑式阅读。',
      sectionDecision: '决策支持',
      decisionHint: '每日与每周评审紧贴证据，下一步决策可以直接核查到源头。',
      openTimeline: '打开时间线',
      openReviews: '打开评审',
      metricEvents: '作用域内事件',
      metricEventsHint: '已规范化进入编辑式工作区的证据。',
      metricProjects: '作用域内项目',
      metricProjectsHint: '由时间线与知识视图拼装的活跃项目表面。',
      metricConnectors: '在线连接器',
      metricConnectorsHint: '来自 git、助手、实验等多源的证据。',
      dailyBrief: '每日简报',
      weeklyOutlook: '本周展望',
      promotionHeading: '晋升候选',
      promotionHint: '秘书建议的、可提升为持久项目或主题知识的候选。',
      sourceMix: '来源构成',
      days14: '14 天'
    },
    projects: {
      title: '项目动态',
      description: '项目组合视图：展示最近两周的持续研究进展与由证据派生的线索智能。',
      sectionPortfolio: '项目表面',
      portfolioHint: '每一块瓷砖展示最近两周的持续研究进展。',
      sectionThreads: '活跃线索',
      threadsHint: '工作区全局的活跃线索，按最新活动排序。',
      noProjects: '尚未收录项目。运行采集流水线以构建项目组合。',
      noThreads: '暂无活跃线索。',
      sectionScope: '作用域',
      scopeHint: (label) => `正在阅读 ${label} 的项目组合。`
    },
    projectDetail: {
      eyebrow: '项目详情',
      description: (projectKey) => `${projectKey} 的持续研究进展、线索智能与重复模式。`,
      sectionEvidence: '最新证据',
      sectionActiveThreads: '活跃线索',
      sectionStalledThreads: '停滞线索',
      sectionRepeated: '重复模式',
      repeatedEmpty: '暂未浮现重复模式。',
      noActiveThreads: '当前项目暂无活跃线索。',
      noStalledThreads: '没有停滞线索 — 信号良好。',
      noEntities: '该项目尚未编译出知识实体。',
      activitySpark: '活动 · 最近 14 天'
    },
    timeline: {
      title: '研究时间线',
      description: '来自各连接器的证据，归一到同一条时间线，便于阅读、过滤与核查。',
      sectionFilters: '当前过滤器',
      filtersHint: '当前时间线视图被以下证据约束收窄。',
      sectionStream: '最新研究活动',
      streamHint: '所有事件汇入同一个编辑式轨道，无需在工具间跳转即可审阅近期工作。',
      noEvents: '尚未收集到任何时间线事件。',
      todayLabel: '今天',
      yesterdayLabel: '昨天',
      events: (n) => `${n} 条事件`,
      topSources: '主要来源'
    },
    entities: {
      title: '编译知识',
      description: '由研究活动编译而成的持久表面：项目、主题、实验与派生摘要构成的图谱。',
      sectionScope: '作用域',
      scopeHint: (label) => `正在阅读 ${label} 的知识图谱。`,
      sectionAtlas: '知识图谱',
      atlasHint: '不同实体类型拥有不同的版式：项目表面、主题文章、实验卡各自独立呈现。',
      noEntities: '尚未编译出任何实体。',
      openEntity: '打开实体',
      typeLabel: {
        project: '项目表面',
        topic: '主题',
        experiment: '实验',
        decision: '决策',
        method: '方法',
        artifact: '成果'
      }
    },
    reviews: {
      title: '评审',
      description: '作用域感知的编辑式简报：每日脉搏、每日评审、周度展望，全部基于真实证据。',
      sectionScope: '作用域',
      scopeHint: (label) => `正在阅读 ${label} 的评审。`,
      sectionFrontPage: '编辑头版',
      frontPageHint: '当前作用域下最新的简报，附带证据链路与晋升候选。',
      sectionFeed: '评审流',
      feedHint: '当前作用域下的全部草稿，按时间倒序。',
      noReviews: '尚无评审草稿。运行秘书任务以生成一份。',
      openDraft: '打开草稿',
      promotions: (n) => `${n} 个晋升候选`,
      nextSteps: (n) => `${n} 条建议下一步`,
      labelDaily: '每日评审',
      labelBrief: '每日简报',
      labelWeekly: '周度评审'
    },
    review: {
      latest: '最新',
      pulse: '编辑脉搏',
      promotionCandidates: '晋升候选',
      suggestedNextSteps: '建议下一步'
    },
    pulse: {
      title: '脉搏',
      lead: (label) => `日、周、月三层节奏 — 在 ${label} 中查看研究工作的真实节拍。`,
      sectionToday: '今日',
      todayMeta: (events, threads, entities) =>
        `${events} 事件 · ${threads} 线索 · ${entities} 知识`,
      emptyToday: '今天暂无满足重要度阈值的事件或线索变化。',
      sectionWeek: '本周热力',
      weekMeta: (events, projects) => `${events} 事件 · ${projects} 项目`,
      emptyWeek: '本周暂无研究活动。',
      tableProject: '项目',
      tableTotal: '合计',
      sectionMonth: '本月走向',
      monthMeta: (events, deepDays) => `${events} 事件 · ${deepDays} 深度工作日`,
      shipped: '已完成',
      shippedEmpty: '本月暂无明显交付。',
      stalled: '停滞',
      stalledEmpty: '无长时间停滞线索。',
      newProjects: '新项目',
      newProjectsEmpty: '本月无新项目。',
      repeated: '重复模式',
      repeatedEmpty: '无重复模式。',
      monthReviews: '本月评审',
      weight: '权重',
      times: (n) => `${n} 次`
    },
    lifeline: {
      heading: '项目生命线',
      empty: '尚无线索数据以绘制项目生命线。',
      counts: (moving, waiting, dormant, done) =>
        `${moving} 推进 · ${waiting} 等待 · ${dormant} 休眠 · ${done} 完成`,
      statusLabel: {
        inProgress: '推进中',
        waiting: '等待',
        dormant: '休眠',
        completed: '完成'
      },
      roleLabel: { first: '起点', peak: '峰值', last: '最新' }
    },
    scope: { portfolio: '总体', project: '项目', repo: '仓库' },
    status: { active: '活跃', stalled: '停滞', dormant: '休眠' },
    provenance: { primary: '一手', derived: '派生', synthetic: '合成' },
    common: {
      events: '事件',
      knowledge: '知识',
      threads: '线索',
      waiting: '正在等待下一份研究证据。',
      importance: '重要度',
      actor: { user: '人', agent: '智能体', system: '系统' }
    }
  }
};

export function useDict(lang: Lang) {
  return dict[lang];
}
