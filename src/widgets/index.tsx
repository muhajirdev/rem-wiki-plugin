import { declareIndexPlugin, ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';
import { buildDocumentList, buildJsonTree } from '../utils/build-json-tree';

const BASE_URL = 'https://rem.wiki/api';

async function onActivate(plugin: ReactRNPlugin) {
  // Register settings
  await plugin.settings.registerStringSetting({
    id: 'username',
    title: 'Your username',
  });

  // A command that inserts text into the editor if focused.
  await plugin.app.registerCommand({
    id: 'publish-digital-garden',
    name: 'Publish Digital Garden',
    action: async () => {
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
            console.error('Error:', error);
          });
      }
    },
  });

  await plugin.app.registerPowerup(
    'Public Digital Garden',
    'public-digital-garden',
    'Rem marked with powerup will pe published publicly',
    {
      slots: [],
    }
  );

  // Register a sidebar widget.
  await plugin.app.registerWidget('sample_widget', WidgetLocation.RightSidebar, {
    dimensions: { height: 'auto', width: '100%' },
  });
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
