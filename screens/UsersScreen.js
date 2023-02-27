import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import {Auth, DataStore} from 'aws-amplify';
import {useNavigation} from '@react-navigation/native';

import UserItem from '../components/UserItem/UserItem';
import NewGroupButton from '../components/NewGroupButton';
import {User, ChatRoomUser, ChatRoom} from '../src/models';

const UsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [isNewGroup, setIsNewGroup] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const navigation = useNavigation();

  useEffect(() => {
    DataStore.query(User).then(setUsers);
  }, []);

  const addUserToChatRoom = async (user, chatRoom) => {
    DataStore.save(
      new ChatRoomUser({
        user,
        chatRoom,
      }),
    );
  };

  const createChatRoom = async users => {
    // TODO if there is already a chat room between these 2 users
    // then redirect to the existing chat room
    // otherwise, create a new chat with these users.

    // connect authenticated user with the chat ChatRoom
    const authUser = await Auth.currentAuthenticatedUser();
    const dbUser = await DataStore.query(User, authUser.attributes.sub);
    if (!dbUser) {
      Alert.alert('There was an error creating the group');
      return;
    }

    // Create a new chat room
    const newChatRoomData = {
      newMessages: 0,
      Admin: dbUser,
    };
    if (users.length > 1) {
      newChatRoomData.name = 'New group 2';
      newChatRoomData.imageUri =
        'https://genius-dummy.s3.ap-southeast-1.amazonaws.com/images/group.jpeg';
    }
    const newChatRoom = await DataStore.save(new ChatRoom(newChatRoomData));

    if (dbUser) {
      await addUserToChatRoom(dbUser, newChatRoom);
    }

    // connect users with the charRoom
    await Promise.all(users.map(user => addUserToChatRoom(user, newChatRoom)));

    navigation.navigate('ChatRoom', {
      id: newChatRoom.id,
    });
  };

  const isUserSelected = user => {
    return selectedUsers.some(selectedUser => selectedUser.id === user.id);
  };

  const onUserPress = async user => {
    if (isNewGroup) {
      if (isUserSelected(user)) {
        // remove it from selected
        setSelectedUsers(
          selectedUsers.filter(selectedUser => selectedUser.id !== user.id),
        );
      } else {
        setSelectedUsers([...selectedUsers, user]);
      }
    } else {
      await createChatRoom([user]);
    }
  };

  const SaveGroup = async () => {
    await createChatRoom(selectedUsers);
  };

  return (
    <SafeAreaView style={styles.page}>
      <FlatList
        data={users}
        renderItem={({item}) => (
          <UserItem
            user={item}
            onPress={() => onUserPress(item)}
            isSelected={isNewGroup ? isUserSelected(item) : undefined}
          />
        )}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <NewGroupButton onPress={() => setIsNewGroup(!isNewGroup)} />
        )}
      />
      {isNewGroup && (
        <Pressable style={styles.button} onPress={SaveGroup}>
          <Text style={styles.buttonText}>
            Save group ({selectedUsers.length})
          </Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
};

export default UsersScreen;

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    flex: 1,
  },
  button: {
    backgroundColor: '#3777f0',
    marginHorizontal: 10,
    padding: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
