import { usePlugin, renderWidget, useTracker } from '@remnote/plugin-sdk';
import { publish } from '../utils/publish';

export const SampleWidget = () => {
  const plugin = usePlugin();

  let name = useTracker(() => plugin.settings.getSetting<string>('name'));
  let likesPizza = useTracker(() => plugin.settings.getSetting<boolean>('pizza'));
  let favoriteNumber = useTracker(() => plugin.settings.getSetting<number>('favorite-number'));

  const onClick = () => {
    publish(plugin);
  };

  return (
    <div className="p-2 m-2 rounded-lg rn-clr-background-light-positive rn-clr-content-positive">
      <button className="px-4 py-2 bg-black rounded-lg text-white">
        Publish your Digital Garden
      </button>
    </div>
  );
};

renderWidget(SampleWidget);
