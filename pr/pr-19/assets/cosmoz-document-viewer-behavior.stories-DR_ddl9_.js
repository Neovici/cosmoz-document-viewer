import{b as m}from"./iframe-BYkMVtM7.js";import{c as u,u as s,g as o,p}from"./shared-BXl6Q-0G.js";import"./preload-helper-PPVm8Dsz.js";const{expect:l}=__STORYBOOK_MODULE_TEST__,z={title:"CosmozDocumentViewer/Behavior",component:"cosmoz-document-viewer",decorators:[u],parameters:{docs:{description:{component:`Behavior stories: vitest fixtures, not documentation. Each story's
play() IS the test, run against the bare component; excluded from the
docs sidebar. Reader-facing stories: cosmoz-document-viewer.stories.ts.`}}}},r={name:"Page jump + tracking",parameters:{excludeFromSidebar:!0},render:()=>m`<cosmoz-document-viewer .pages=${p}></cosmoz-document-viewer>`,play:async({canvasElement:e,step:t})=>{await s(()=>o(e)?.ready===!0);const c=o(e);await t("Writing currentPage jumps and reports back",async()=>{c.currentPage=12,await s(()=>c.currentPage===12,1e4)})}},n={parameters:{excludeFromSidebar:!0},render:()=>m`<cosmoz-document-viewer .pages=${p}></cosmoz-document-viewer>`,play:async({canvasElement:e,step:t})=>{await s(()=>o(e)?.ready===!0);const c=o(e);await t("Setting zoom widens pages past the viewport",async()=>{c.zoom=1.5,await s(()=>{const d=c.shadowRoot.querySelector(".scroll-container");return d.scrollWidth>d.clientWidth},1e4)})}},i=[],w=e=>`data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1753"><text x="440" y="920" font-size="120">${e}</text></svg>`)}`,g=Array.from({length:60},(e,t)=>()=>(i.push(t),Promise.resolve(w(t)))),a={name:"Lazy rendering (spy)",parameters:{excludeFromSidebar:!0},render:()=>m`<cosmoz-document-viewer .pages=${g}></cosmoz-document-viewer>`,play:async({canvasElement:e,step:t})=>{await s(()=>o(e)?.ready===!0),await t("Only the mounted window resolves initially",()=>{l(i.length).toBeGreaterThan(0),l(i.length).toBeLessThan(12)}),await t("Scrolling resolves pages on demand",async()=>{o(e).shadowRoot.querySelector(".scroll-container").scrollTop=999999,await s(()=>Math.max(...i)>55,1e4),l(i.length).toBeLessThan(35)})}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  name: 'Page jump + tracking',
  parameters: {
    excludeFromSidebar: true
  },
  render: () => html\`<cosmoz-document-viewer .pages=\${pdfPages}></cosmoz-document-viewer>\`,
  play: async ({
    canvasElement,
    step
  }) => {
    await until(() => getViewer(canvasElement)?.ready === true);
    const viewer = getViewer(canvasElement);
    await step('Writing currentPage jumps and reports back', async () => {
      viewer.currentPage = 12;
      // The jump settles the strip; scroll tracking publishes the page
      // at the viewport midpoint.
      await until(() => viewer.currentPage === 12, 10_000);
    });
  }
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  parameters: {
    excludeFromSidebar: true
  },
  render: () => html\`<cosmoz-document-viewer .pages=\${pdfPages}></cosmoz-document-viewer>\`,
  play: async ({
    canvasElement,
    step
  }) => {
    await until(() => getViewer(canvasElement)?.ready === true);
    const viewer = getViewer(canvasElement);
    await step('Setting zoom widens pages past the viewport', async () => {
      viewer.zoom = 1.5;
      await until(() => {
        const sc = viewer.shadowRoot.querySelector('.scroll-container');
        return sc.scrollWidth > sc.clientWidth;
      }, 10_000);
    });
  }
}`,...n.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: 'Lazy rendering (spy)',
  parameters: {
    excludeFromSidebar: true
  },
  render: () => html\`<cosmoz-document-viewer .pages=\${spyPages}></cosmoz-document-viewer>\`,
  play: async ({
    canvasElement,
    step
  }) => {
    await until(() => getViewer(canvasElement)?.ready === true);
    await step('Only the mounted window resolves initially', () => {
      expect(rasterCalls.length).toBeGreaterThan(0);
      expect(rasterCalls.length).toBeLessThan(12); // out of 60
    });
    await step('Scrolling resolves pages on demand', async () => {
      getViewer(canvasElement).shadowRoot.querySelector('.scroll-container').scrollTop = 999_999;
      await until(() => Math.max(...rasterCalls) > 55, 10_000);
      // Still bounded — the strip resolves per range, never the document.
      expect(rasterCalls.length).toBeLessThan(35);
    });
  }
}`,...a.parameters?.docs?.source}}};const S=["CurrentPageTracking","Zoom","LazyRenders"];r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  name: 'Page jump + tracking',
  parameters: {
    excludeFromSidebar: true
  },
  render: () => html\`<cosmoz-document-viewer .pages=\${pdfPages}></cosmoz-document-viewer>\`,
  play: async ({
    canvasElement,
    step
  }) => {
    await until(() => getViewer(canvasElement)?.ready === true);
    const viewer = getViewer(canvasElement);
    await step('Writing currentPage jumps and reports back', async () => {
      viewer.currentPage = 12;
      // The jump settles the strip; scroll tracking publishes the page
      // at the viewport midpoint.
      await until(() => viewer.currentPage === 12, 10_000);
    });
  }
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  parameters: {
    excludeFromSidebar: true
  },
  render: () => html\`<cosmoz-document-viewer .pages=\${pdfPages}></cosmoz-document-viewer>\`,
  play: async ({
    canvasElement,
    step
  }) => {
    await until(() => getViewer(canvasElement)?.ready === true);
    const viewer = getViewer(canvasElement);
    await step('Setting zoom widens pages past the viewport', async () => {
      viewer.zoom = 1.5;
      await until(() => {
        const sc = viewer.shadowRoot.querySelector('.scroll-container');
        return sc.scrollWidth > sc.clientWidth;
      }, 10_000);
    });
  }
}`,...n.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: 'Lazy rendering (spy)',
  parameters: {
    excludeFromSidebar: true
  },
  render: () => html\`<cosmoz-document-viewer .pages=\${spyPages}></cosmoz-document-viewer>\`,
  play: async ({
    canvasElement,
    step
  }) => {
    await until(() => getViewer(canvasElement)?.ready === true);
    await step('Only the mounted window resolves initially', () => {
      expect(rasterCalls.length).toBeGreaterThan(0);
      expect(rasterCalls.length).toBeLessThan(12); // out of 60
    });
    await step('Scrolling resolves pages on demand', async () => {
      getViewer(canvasElement).shadowRoot.querySelector('.scroll-container').scrollTop = 999_999;
      await until(() => Math.max(...rasterCalls) > 55, 10_000);
      // Still bounded — the strip resolves per range, never the document.
      expect(rasterCalls.length).toBeLessThan(35);
    });
  }
}`,...a.parameters?.docs?.source}}};export{r as CurrentPageTracking,a as LazyRenders,n as Zoom,S as __namedExportsOrder,z as default};
