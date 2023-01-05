import { RNPlugin } from '@remnote/plugin-sdk';
import { BASE_API_URL } from '../constants';
import { buildDocumentList, buildJsonTree } from './build-json-tree';

/**
 * TODO: for optimization, fetch list of all published Ids from backend, and compare the the `updatedAt` value
 *       only publish the ones that the `updatedAt` are different, and the one the Id doesn't exist yet in the database
 */

export const publish = async (plugin: RNPlugin) => {
  const powerup = await plugin.powerup.getPowerupByCode('public-digital-garden');
  const rems = await powerup?.taggedRem();
  const rootRem = rems?.[0];

  if (!rootRem) {
    return plugin.app.toast(
      `No Rem is tagged with powerup 'Public Digital Garden. Please tag one your rem with it first`
    );
  }

  if (rootRem) {
    await plugin.app.toast('Publishing Digital Garden');
    const documentList = await buildDocumentList(plugin)(rootRem);
    console.log(documentList);
    const jsonTree = await buildJsonTree(plugin)(rootRem, [], undefined, true);
    console.log({ jsonTree });

    let username = await plugin.settings.getSetting<string>('username');

    if (!username) {
      return plugin.app.toast('Please set your username before publishing your digital garden');
    }

    await fetch(`${BASE_API_URL}/publish`, {
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
