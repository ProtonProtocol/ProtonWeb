# Proton Web SDK

Installation

This project relies on rn-nodeify.

```
yarn add @proton/react-native-sdk
yarn add rn-nodeify
```

Afterwards run

```
./node_modules/.bin/rn-nodeify --hack --install
```

and add the following to your package.json:

```
"postinstall": "./node_modules/.bin/rn-nodeify --yarn --hack 'assert,buffer,crypto,dns,domain,events,stream'; node ./bin/postInstall",
```

Usage

```javascript
// sample class
import {
  ConnectWallet,
  LinkSession,
  ProtonLink,
} from '@proton/react-native-sdk';

class ProtonSDK {
  chainId: string;
  endpoints: string[];
  requestAccount: string;
  session: LinkSession;
  link: ProtonLink;

  constructor() {
    this.chainId =
      '71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd';
    this.endpoints = ['https://testnet.protonchain.com']; // Multiple for fault tolerance
    this.requestAccount = 'taskly'; // optional
    this.session = null;
    this.link = null;
  }

  login = async () => {
    const { session, link } = await ConnectWallet({
      linkOptions: { chainId: this.chainId, endpoints: this.endpoints },
      transportOptions: {
        requestAccount: this.requestAccount,
        getReturnUrl: () => 'taskly://main',
      },
    });

    this.link = link;
    this.session = session;
    return { auth: session.auth, accountData: session.accountData[0] };
  };

  sendTransaction = async (actions: Action) => {
    return this.session.transact({ actions: actions }, { broadcast: true });
  };

  logout = async () => {
    await this.link.removeSession(this.requestAccount, this.session.auth);
    this.session = null;
    this.link = null;
  };

  restoreSession = async () => {
    try {
      const { link, session } = await ConnectWallet({
        linkOptions: {
          chainId: this.chainId,
          endpoints: this.endpoints,
          restoreSession: true,
        },
        transportOptions: {
          requestAccount: this.requestAccount,
          getReturnUrl: () => 'taskly://main',
        },
      });
      this.link = link;
      this.session = session;
      console.log('session', this.session);
      if (session) {
        return {
          auth: this.session.auth,
          accountData: this.session.accountData[0],
        };
      } else {
        return { auth: { actor: '', permission: '' }, accountData: {} };
      }
    } catch (e) {
      return e;
    }
  };
}

// Usage
const protonSDK = new ProtonSDK();

// usage login()
try {
  const { auth, accountData } = await protonSDK.login();
  rootStore.setActor(auth.actor);
  rootStore.setPermission(auth.permission);
  rootStore.setName(accountData.name);
  rootStore.setAvatar(accountData.avatar);

  // do something like go to a subscription page
  navigation.navigate('subscription');
} catch (ex) {
  // login failed
  Alert.alert('Error', ex.message);
}

// send transaction
try {
  const actions = [
    {
      account: 'xtokens',
      name: 'transfer',
      authorization: [
        {
          actor: rootStore.actor,
          permission: rootStore.permission,
        },
      ],
      data: {
        from: rootStore.actor,
        to: protonSDK.requestAccount,
        quantity: '5.000000 XUSDT',
        memo: 'Taskly',
      },
    },
  ];
  const tx = await protonSDK.sendTransaction(actions);

  // navigate to the subscriped page
  navigation.navigate('subscribed');
} catch (ex) {
  // the transaction failed
  Alert.alert('Error', ex.message);
}

// usage logout
protonSDK.logout();
navigation.navigate('welcome');

// usage restoreSession

try {
  await protonSDK.restoreSession();
} catch (ex) {
  console.warn(ex.message);
}

if (protonSDK.session !== null) {
  console.log('session still exists');
} else {
  console.log('session does not exits anymore');
}
```
