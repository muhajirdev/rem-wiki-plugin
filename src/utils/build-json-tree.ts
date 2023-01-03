import { Rem, ReactRNPlugin } from '@remnote/plugin-sdk';

type NodeType = 'node' | 'doc';
type NodeText =
  | {
      type: 'text';
      content: string;
    }
  | {
      type: 'link';
      content: NodeText[];
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

// TODO:
// - resolve portal

export const createUtils = (plugin: ReactRNPlugin) => {
  return {
    buildDocumentList: buildDocumentList(plugin),
  };
};

let documentMapping: DocumentMapping = {};
export const buildDocumentList = (plugin: ReactRNPlugin) => async (rem: Rem) => {
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
  (plugin: ReactRNPlugin) =>
  async (rem: Rem): Promise<NodeText[]> => {
    const nodeTexts: NodeText[] = [];

    if (await rem.isPowerupSlot()) return [];

    for (const element of rem.text) {
      if (typeof element === 'string') {
        if (element === 'Status') {
          console.log('status', {
            rem,
            element,
            isPowerupSlot: await rem.isPowerupSlot(),
            isSlot: await rem.isSlot(),
          });
        }
        nodeTexts.push({ type: 'text', content: element });
      }
      if (element?.i === 'q') {
        const refRem = await plugin.rem.findOne(element._id);
        if (refRem) {
          const text = await buildText(plugin)(refRem);
          if (text.length > 0) {
            nodeTexts.push({ type: 'link', content: text });
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
 * Note: Remember that a doc inside another doc, will be just a node with empty children. Make sure this acknowledged in the front for th epublic page
 */
export const buildJsonTree =
  (plugin: ReactRNPlugin) =>
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

    const children = await rem.getChildrenRem();
    const childrenTree = await Promise.all(
      children.map((child) => buildJsonTree(plugin)(child, _breadcumbs, callbacks))
    );

    const childrenTreeWithoutNull: Node[] = childrenTree.filter((val) => !!val) as Node[];

    // remopve children from `doc` so we can build list of that's not deeply nested (no doc inside doc)
    const childrenWithDocEmptyChildren = childrenTreeWithoutNull.map((child) => {
      if (child.type === 'doc') {
        const node = {
          id: child.id,
          title,
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

    if (rem._id === 'NZLKRTHKpTZDTWEAM') {
      console.log({ node });
    }

    if (text.length === 0 && childrenTreeWithoutNull.length === 0) {
      return null;
    }

    callbacks?.[type]?.(node);

    return node;
  };
