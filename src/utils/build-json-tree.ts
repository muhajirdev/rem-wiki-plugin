import { Rem, RNPlugin } from '@remnote/plugin-sdk';

type NodeType = 'node' | 'doc';
type NodeText =
  | {
      type: 'text';
      content: string;
    }
  | {
      type: 'link';
      content: NodeText[];
      id: string;
    };

type Node = {
  id: string;
  title: string;
  text: NodeText[];
  fontSize: 'H1' | 'H2' | 'H3' | undefined;
  children: Node[];
  type: NodeType;
  breadcumbs: Breadcumb[];
};

type DocumentMapping = {
  [key: string]: Node;
};

type Breadcumb = {
  title: string;
  id: string;
  type: NodeType;
};

export const createUtils = (plugin: RNPlugin) => {
  return {
    buildDocumentList: buildDocumentList(plugin),
  };
};

let documentMapping: DocumentMapping = {};
export const buildDocumentList = (plugin: RNPlugin) => async (rem: Rem) => {
  documentMapping = {}; // reset

  await buildJsonTree(plugin)(
    rem,
    [],
    {
      doc: (node) => {
        documentMapping[node.id] = node;
      },
      node: (node) => {},
    },
    true
  );

  return documentMapping;
};

type CallbacksByType = {
  [key in NodeType]: (node: Node) => void;
};

const buildText =
  (plugin: RNPlugin) =>
  async (rem: Rem): Promise<NodeText[]> => {
    const nodeTexts: NodeText[] = [];

    if (await rem.isPowerupSlot?.()) return [];

    for (const element of rem.text) {
      if (typeof element === 'string') {
        nodeTexts.push({ type: 'text', content: element });
      }
      if (element?.i === 'q') {
        // 'q' meaning a rem reference https://plugins.remnote.com/api/modules#richtextelementreminterface
        const refRem = await plugin.rem.findOne(element._id);
        if (refRem) {
          const text = await buildText(plugin)(refRem);
          if (text.length > 0) {
            nodeTexts.push({ type: 'link', content: text, id: refRem._id });
          }
        }
      }
    }

    return nodeTexts;
  };

// buildtitle based on NodeText[]
const buildTitle = (texts: NodeText[]): string => {
  let title = '';

  texts.forEach((t) => {
    if (t.type === 'text') {
      title += t.content;
    }
    if (t.type === 'link') {
      title = title + buildTitle(t.content);
    }
  });

  return title;
};

/**
 * This function doesn't actually build the nested json tree. It doesn't attach doc inside another doc.
 * But will continue to traverse the node
 *
 * Note: Remember that a doc inside another doc, will be just a node with empty children. Make sure this acknowledged in the frontend page
 */
export const buildJsonTree =
  (plugin: RNPlugin) =>
  async (rem: Rem, breadcumbs: Breadcumb[], callbacks?: CallbacksByType, root = false) => {
    const text = await buildText(plugin)(rem);
    const type = (await rem.isDocument()) ? 'doc' : 'node';
    const title = buildTitle(text);
    const fontSize = await rem.getFontSize();

    const _breadcumbs: Breadcumb[] = [
      ...breadcumbs,
      {
        title,
        id: rem._id,
        type,
      },
    ];

    // when the rem is a portal, treat is a doc so that in rem-wiki. It will just be treated as a link
    // when user click it, he will be navigated to the rem page

    // here, because a portal can contains more than one node, we return array of node (see `portalChildren.map`)
    // so we need to flatten this part in the parent section. see the `flat` near buildJsonTree below
    const isPortal = rem.type === 6; // https://plugins.remnote.com/api/enums/REM_TYPE#portal
    if (isPortal) {
      const portalChildren = await rem.getPortalDirectlyIncludedRem();
      if (portalChildren.length === 0) {
        return null;
      }
      const firstNodeOfPortal = portalChildren[0];
      const portalText = await buildText(plugin)(firstNodeOfPortal);
      return portalChildren
        .map((portalNode) => {
          return {
            id: portalNode._id,
            fontSize: undefined,
            type: 'doc',
            title: buildTitle(portalText),
            children: [],
            text: portalText,
            breadcumbs: breadcumbs,
          };
        })
        .filter((node) => !!node.title); // filter out empty title
    }

    const children = await rem.getChildrenRem();
    const childrenTree = (
      await Promise.all(
        children.map((child) => buildJsonTree(plugin)(child, _breadcumbs, callbacks))
      )
    ).flat();

    const childrenTreeWithoutNull: Node[] = childrenTree.filter((val) => !!val) as Node[];

    // remopve children from `doc` so we can build list of that's not deeply nested (no doc inside doc)
    const childrenWithDocEmptyChildren = childrenTreeWithoutNull.map((child) => {
      if (child.type === 'doc') {
        const node = {
          id: child.id,
          title: child.title,
          text: child.text,
          fontSize,
          children: [],
          type: child.type,
          breadcumbs: breadcumbs,
        };
        return node;
      }
      return child;
    });

    const node: Node = {
      id: rem._id,
      title,
      text,
      children: childrenWithDocEmptyChildren,
      fontSize,
      type: type,
      breadcumbs: breadcumbs,
    };

    if (text.length === 0 && childrenTreeWithoutNull.length === 0) {
      return null;
    }

    callbacks?.[type]?.(node);

    return node;
  };
