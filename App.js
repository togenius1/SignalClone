import React, {useEffect, useState} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {withAuthenticator} from 'aws-amplify-react-native';
import {Auth, DataStore, Hub} from 'aws-amplify';
import {setPRNG, box} from 'tweetnacl';

import SignalNavigator from './navigation/SignalNavigator';
import {Message, User} from './src/models';

import {PRNG, generateKeyPair, encrypt, decrypt} from './utils/crypto';

setPRNG(PRNG);

const obj = {hello: 'world'};
const pairA = generateKeyPair();
const pairB = generateKeyPair();

const sharedA = box.before(pairB.publicKey, pairA.secretKey);
const sharedB = box.before(pairA.publicKey, pairB.secretKey);

const encrypted = encrypt(sharedA, obj);
const decrypted = decrypt(sharedB, encrypted);
console.log(obj, encrypted, decrypted);

// console.log(randomBytes(secretbox.nonceLength));

function App() {
  const [user, setUser] = useState();

  // crypto.getRandomValues

  useEffect(() => {
    const listener = Hub.listen('datastore', async hubData => {
      const {event, data} = hubData.payload;
      if (
        event === 'outboxMutationProcessed' &&
        data.model === Message &&
        !['DELIVERED', 'READ'].includes(data.element.status)
      ) {
        // set the message status to delivered
        DataStore.save(
          Message.copyOf(data.element, updated => {
            updated.status = 'DELIVERED';
          }),
        );
      }
    });

    // Remove listener
    return () => listener();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const subscription = DataStore.observe(User, user.id).subscribe(msg => {
      if (msg.model === User && msg.opType === 'UPDATE') {
        setUser(currUser => msg.element);
      }
    });

    return () => subscription.unsubscribe();
  }, [user]);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      updateLastOnline();
    }, 1 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchUser = async () => {
    const userData = await Auth.currentAuthenticatedUser();
    const user = await DataStore.query(User, userData.attributes.sub);
    if (user) {
      setUser(user);
    }
  };

  const updateLastOnline = async () => {
    if (!user) {
      return;
    }
    const response = await DataStore.save(
      User.copyOf(user, updated => {
        updated.lastOnlineAt = +new Date(); // seconds
      }),
    );
    setUser(response);
  };

  return (
    <SafeAreaProvider>
      <SignalNavigator />
      <StatusBar />
    </SafeAreaProvider>
  );
}

export default withAuthenticator(App);
