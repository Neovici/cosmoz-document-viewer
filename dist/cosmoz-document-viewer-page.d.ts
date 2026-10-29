import '@neovici/cosmoz-spinner';
/** Width a page reports before it is measured; larger natural widths are
 *  capped at it, so the viewer's pre-ready estimate never needs re-scaling. */
export declare const DEFAULT_NATURAL_WIDTH = 1240;
interface Props {
    /** The page: a ready URL, or a renderer resolving one lazily. A renderer
     *  is invoked the first time one of its instances mounts; the result is
     *  memoized on the renderer itself. */
    page?: string | (() => Promise<string>);
    width?: number;
    /** Strip position, echoed in `page-ready` so the viewer maps a load's
     *  ratio onto the right page. */
    index?: number;
}
/** A rendered page element inside the viewer's virtualized strip. */
export type CosmozDocumentViewerPageElement = HTMLElement & Props;
type Host = HTMLElement & Props;
declare const CosmozDocumentViewerPage: (host: Host) => import("lit-html").TemplateResult<1>;
declare const cosmozDocumentViewerPage: import("@pionjs/pion/lib/component").ComponentConstructor<Props>;
export { CosmozDocumentViewerPage, cosmozDocumentViewerPage };
export type { Props as PageProps };
