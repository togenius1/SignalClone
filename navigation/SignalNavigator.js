import React, {useState, useEffect} from 'react';
import {Text, View, Image, useWindowDimensions, Pressable} from 'react-native';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/dist/Feather';

import HomeScreen from '../screens/HomeScreen';
import UsersScreen from '../screens/UsersScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import NotFoundScreen from '../screens/NotFoundScreen';
import ChatRoomHeader from './ChatRoomHeader';
import GroupInfoScreen from '../screens/GroupInfoScreen';
import SettingsScreen from '../screens/Settings';

const HomeHeader = props => {
  const {width} = useWindowDimensions();
  const navigation = useNavigation();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        width,
        padding: 10,
        alignItems: 'center',
      }}>
      <Image
        source={{
          uri: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/avatars/vadim.jpg',
        }}
        style={{width: 30, height: 30, borderRadius: 30}}
      />
      <Text style={{flex: 1, textAlign: 'center', marginLeft: 50}}>
        {props.children}
      </Text>
      <Pressable
        onPress={() => {
          navigation.navigate('Settings');
        }}>
        <Icon
          name="settings"
          size={24}
          color="grey"
          style={{marginHorizontal: 10}}
        />
      </Pressable>
      <Pressable
        onPress={() => {
          navigation.navigate('Users');
        }}>
        <Icon
          name="edit-2"
          size={24}
          color="grey"
          style={{marginHorizontal: 10}}
        />
      </Pressable>
    </View>
  );
};

const Stack = createNativeStackNavigator();

function SignalStackScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{headerTitle: HomeHeader}}
      />
      <Stack.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={({route}) => ({
          headerTitle: () => <ChatRoomHeader id={route.params?.id} />,
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen
        name="GroupInfoScreen"
        component={GroupInfoScreen}
        options={({route}) => ({
          headerTitle: 'Users',
          // headerTitle: () => <ChatRoomHeader id={route.params?.id} />,
          // headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen
        name="Users"
        component={UsersScreen}
        options={{title: 'Users'}}
      />

      <Stack.Screen name="Settings" component={SettingsScreen} />

      <Stack.Screen
        name="NotFound"
        component={NotFoundScreen}
        options={{title: 'Oops!'}}
      />
    </Stack.Navigator>
  );
}

export default function SignalNavigator() {
  return (
    <NavigationContainer
    // theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      <SignalStackScreen />
    </NavigationContainer>
  );
}
