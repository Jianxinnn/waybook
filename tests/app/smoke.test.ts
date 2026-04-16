import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import Page from '../../src/app/page'

describe('home page', () => {
  it('renders the Waybook landing copy', async () => {
    const rendered = await Page()
    const html = renderToString(rendered)

    expect(html).toContain('Waybook')
    expect(html).toContain('personal research secretary')
  })
})
