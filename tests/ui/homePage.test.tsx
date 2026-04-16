import { describe, expect, it } from 'vitest'
import HomePage from '../../src/app/page'

async function renderPage(
  page: (props?: any) => unknown | Promise<unknown>,
  props?: any,
) {
  const { renderToString } = await import('react-dom/server')
  const rendered = await Promise.resolve(page(props))

  return renderToString(rendered as Parameters<typeof renderToString>[0])
}

describe('dashboard home page', () => {
  it('uses the required dashboard labels as section headings', async () => {
    const html = await renderPage(HomePage)

    expect(html).toMatch(/<h2[^>]*>Today<\/h2>/)
    expect(html).toMatch(/<h2[^>]*>Projects In Motion<\/h2>/)
    expect(html).toMatch(/<h2[^>]*>Topics Emerging This Week<\/h2>/)
  })

  it('renders seeded project, topic, and timeline content from the shared pipeline', async () => {
    const html = await renderPage(HomePage)

    expect(html).toContain('Keep manual notes safe during Obsidian re-export.')
    expect(html).toContain('Waybook M1')
    expect(html).toContain('Obsidian')
    expect(html).toContain('Validate Obsidian export keeps manual notes')
    expect(html).toContain('href="/projects/waybook-m1"')
  })
})

describe('secondary dashboard routes', () => {
  it('renders a timeline page scaffold fed by real research events', async () => {
    const timelineModule = await import('../../src/app/timeline/page').catch(() => null)

    expect(timelineModule).not.toBeNull()

    const html = await renderPage(timelineModule!.default)

    expect(html).toContain('Timeline')
    expect(html).toContain('Recent research activity')
    expect(html).toContain('feat: wire seeded M1 happy path')
  })

  it('renders a project detail page for the seeded project entity', async () => {
    const projectModule = await import('../../src/app/projects/[slug]/page').catch(
      () => null,
    )

    expect(projectModule).not.toBeNull()

    const html = await renderPage(projectModule!.default, {
      params: Promise.resolve({ slug: 'waybook-m1' }),
    })

    expect(html).toContain('Project')
    expect(html).toContain('Waybook M1')
    expect(html).toContain('4 recorded research events across 4 sources.')
    expect(html).toContain('Topic links')
    expect(html).toContain('Obsidian')
  })
})
