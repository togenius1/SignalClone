import React, {useState, useEffect} from 'react';
import {StyleSheet, Text, Pressable, View, FlatList} from 'react-native';
import {Auth, DataStore} from 'aws-amplify';

// import ChatRoomData from '../assets/dummy-data/ChatRooms';
import ChatRoomItem from '../components/ChatRoomItem/ChatRoomItem';
import {ChatRoomUser} from '../src/models';

const HomeScreen = () => {
  const [chatRooms, setChatRooms] = useState([]);

  useEffect(() => {
    const fetchChatRooms = async () => {
      const userData = await Auth.currentAuthenticatedUser();

      const chatRooms = (await DataStore.query(ChatRoomUser))
        .filter(
          chatRoomUser => chatRoomUser.user.id === userData.attributes.sub,
        )
        .map(chatRoomUser => chatRoomUser.chatRoom);

      setChatRooms(chatRooms);
    };
    fetchChatRooms();
  }, []);

  return (
    <View style={styles.page}>
      <FlatList
        data={chatRooms}
        renderItem={({item}) => <ChatRoomItem chatRoom={item} />}
        // keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    flex: 1,
  },
});

export default HomeScreen;
