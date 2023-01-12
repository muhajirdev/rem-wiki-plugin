import { usePlugin, renderWidget, useTracker } from '@remnote/plugin-sdk';
import { publish } from '../utils/publish';
import { getPublicSiteByUsername } from '../utils/urls';

const WelcomeText = () => <h1 className="text-xl">Welcome to Rem Wiki</h1>;

const PublicSiteInformation = ({ username }: { username: string }) => (
  <div className="border-gray-400">
    <p>
      Your username is <span>{username}</span>
    </p>
    <p>Your digital garden will be published to {getPublicSiteByUsername(username)}</p>
  </div>
);

const UpdateYourUsername = () => {
  return (
    <div>
      <p>
        Please set your username in <br />
        <code>{'Settings -> Plugin Settings -> rem-wiki -> Your username'}</code>
      </p>
      <p>After you put your username, close this plugin tab, and re open it</p>
    </div>
  );
};

export const PublicationSidebar = () => {
  const plugin = usePlugin();

  let username = useTracker((reactivePlugin) =>
    reactivePlugin.settings.getSetting<string>('username')
  );

  const onClick = () => {
    publish(plugin);
  };

  return (
    <div className="p-4">
      <WelcomeText />
      {!username && <UpdateYourUsername />}

      {username && (
        <div>
          <PublicSiteInformation username={username} />
          <button onClick={onClick} className="px-4 py-2 bg-black rounded-lg text-white">
            Publish your Digital Garden
          </button>
        </div>
      )}
    </div>
  );
};

renderWidget(PublicationSidebar);
