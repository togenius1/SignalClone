import {StyleSheet, Text, View, Pressable} from 'react-native';
import React from 'react';
import {Auth, DataStore} from 'aws-amplify';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {generateKeyPair} from '../utils/crypto';

const Settings = () => {
  // Logout Function
  const logOut = async () => {
    await DataStore.clear();
    Auth.signOut();
  };

  const updateKeyPair = async () => {
    // generate private/public key
    const {publicKey, secretKey} = generateKeyPair();

    // save private key to Async storage
    // save public key to UserModel in Datastore
  };

  return (
    <View>
      <Text>Setting</Text>
      <Pressable
        onPress={updateKeyPair}
        style={{
          backgroundColor: 'white',
          height: 50,
          margin: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text>Update keypair</Text>
      </Pressable>

      <Pressable
        onPress={logOut}
        style={{
          backgroundColor: 'white',
          height: 50,
          margin: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text>Logout</Text>
      </Pressable>
    </View>
  );
};

export default Settings;

const styles = StyleSheet.create({});
