import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/dist/Feather';
import {Auth, DataStore} from 'aws-amplify';
import {ChatRoom, ChatRoomUser, User} from '../src/models';
import moment from 'moment';

const ChatRoomHeader = ({id}) => {
  const {width} = useWindowDimensions();
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [chatRoom, setChatRoom] = useState(undefined);

  const navigation = useNavigation();

  useEffect(() => {
    if (!id) {
      return;
    }

    fetchUsers();
    fetchChatRoom();
  }, []);

  const fetchUsers = async () => {
    const fetchedUsers = (await DataStore.query(ChatRoomUser))
      .filter(chatRoomUser => chatRoomUser.chatRoom.id === id)
      .map(chatRoomUser => chatRoomUser.user);

    setAllUsers(fetchedUsers);

    const authUser = await Auth.currentAuthenticatedUser();
    setUser(
      fetchedUsers.find(user => user.id !== authUser.attributes.sub) || null,
    );
  };

  const fetchChatRoom = async () => {
    DataStore.query(ChatRoom, id).then(setChatRoom);
  };

  const getLastOnlineText = () => {
    if (!user?.lastOnlineAt) {
      return null;
    }
    // if lastOnlineAt is less than 5 minutes ago, show him as ONLINE
    const lastOnlineDiffMS = moment().diff(moment(user.lastOnlineAt));
    if (lastOnlineDiffMS < 5 * 60 * 1000) {
      // less than 5 minutes
      return 'online';
    } else {
      return `Last seen online ${moment(user.lastOnlineAt).fromNow()}`;
    }
  };

  const getUsernames = () => {
    return allUsers.map(user => user.name).join(', ');
  };

  const openInfo = () => {
    // redirect to info page
    navigation.navigate('GroupInfoScreen', {id});
  };

  const isGroup = allUsers.length > 2;

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: width - 25,
        marginLeft: -30,
        padding: 10,
        alignItems: 'center',
      }}>
      <Image
        source={{
          uri: chatRoom?.imageUri || user?.imageUri,
        }}
        style={{width: 30, height: 30, borderRadius: 30}}
      />

      <Pressable onPress={openInfo} style={{flex: 1, marginLeft: 10}}>
        <Text style={{fontWeight: 'bold'}}>{chatRoom?.name || user?.name}</Text>
        <Text numberOfLines={1}>
          {isGroup ? getUsernames() : getLastOnlineText()}
        </Text>
      </Pressable>

      <Icon
        name="camera"
        size={24}
        color="grey"
        style={{marginHorizontal: 10}}
      />
      <Icon
        name="edit-2"
        size={24}
        color="grey"
        style={{marginHorizontal: 10}}
      />
    </View>
  );
};

// const styles = StyleSheet.create({});

export default ChatRoomHeader;
