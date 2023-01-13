import { usePlugin, renderWidget, useTracker } from '@remnote/plugin-sdk';
import { publish } from '../utils/publish';
import { getPublicSiteByUsername } from '../utils/urls';

const WelcomeText = () => <h1 className="text-xl">Welcome to Rem Wiki</h1>;

const UpdateYourUsername = () => {
  return (
    <div>
      <p>
        Please set API key in <br />
        <code>{'Settings -> Plugin Settings -> rem-wiki -> Your API key'}</code>
      </p>
      <p>To create your API Key go to https://rem.wiki and sign up</p>
    </div>
  );
};

export const PublicationSidebar = () => {
  const plugin = usePlugin();

  let apiKey = useTracker((reactivePlugin) => reactivePlugin.settings.getSetting<string>('apiKey'));

  const onClick = () => {
    publish(plugin);
  };

  return (
    <div className="p-4">
      <WelcomeText />
      {!apiKey && <UpdateYourUsername />}

      {apiKey && (
        <div>
          <button onClick={onClick} className="px-4 py-2 bg-black rounded-lg text-white">
            Publish your Digital Garden
          </button>
        </div>
      )}
    </div>
  );
};

renderWidget(PublicationSidebar);
