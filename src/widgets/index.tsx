import { declareIndexPlugin, ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';
import { buildDocumentList, buildJsonTree } from '../utils/build-json-tree';
import { publish } from '../utils/publish';

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
    action: () => publish(plugin),
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
  await plugin.app.registerWidget('publication_sidebar', WidgetLocation.RightSidebar, {
    widgetTabTitle: 'Rem Wiki',
    dimensions: { height: 'auto', width: '100%' },
  });
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
