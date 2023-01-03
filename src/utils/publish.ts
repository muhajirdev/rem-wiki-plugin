import { RNPlugin } from '@remnote/plugin-sdk';
import { buildDocumentList, buildJsonTree } from './build-json-tree';

const BASE_URL = 'https://rem.wiki/api';

/**
 * TODO: for optimization, fetch list of all published Ids from backend, and compare the the `updatedAt` value
 *       only publish the ones that the `updatedAt` are different, and the one the Id doesn't exist yet in the database
 */

export const publish = async (plugin: RNPlugin) => {
  await plugin.app.toast('Publishing Digital Garden');
  const powerup = await plugin.powerup.getPowerupByCode('public-digital-garden');
  const rems = await powerup?.taggedRem();
  const rootRem = rems?.[0];
  console.log(rootRem?._id);
  if (rootRem) {
    const documentList = await buildDocumentList(plugin)(rootRem);
    console.log(documentList);
    const jsonTree = await buildJsonTree(plugin)(rootRem, [], undefined, true);
    console.log({ jsonTree });

    let username = await plugin.settings.getSetting<string>('username');

    await fetch(`${BASE_URL}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        rootId: rootRem?._id,
        documentMappings: documentList,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        plugin.app.toast('Published');
        console.log('Success:', data);
      })
      .catch((error) => {
        plugin.app.toast('Failed to publish digital garden ');
        console.error('Error:', error);
      });
  }
};
