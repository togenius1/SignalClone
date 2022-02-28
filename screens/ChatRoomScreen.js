import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {DataStore, SortDirection} from 'aws-amplify';
import {ChatRoom, Message as MessageModel} from '../src/models';

import Message from '../components/message/Message';
// import chatRoomData from '../assets/dummy-data/Chats';
import MessageInput from '../components/messageInput';

const ChatRoomScreen = () => {
  const [messages, setMessages] = useState([]);
  const [messageReplyTo, setMessageReplyTo] = useState(null);
  const [chatRoom, setChatRoom] = useState(null);

  const route = useRoute();

  useEffect(() => {
    fetchChatRoom();
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [chatRoom]);

  useEffect(() => {
    const subscription = DataStore.observe(MessageModel).subscribe(msg => {
      // console.log(msg.model, msg.opType, msg.element);
      if (msg.model === MessageModel && msg.opType === 'INSERT') {
        setMessages(existingMessages => [msg.element, ...existingMessages]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchChatRoom = async () => {
    if (!route.params?.id) {
      console.warn('No chatroom id provided');
      return;
    }
    const chatRoom = await DataStore.query(ChatRoom, route.params.id);
    if (!chatRoom) {
      console.error("Couldn't find a chat room with this id");
    } else {
      setChatRoom(chatRoom);
    }
  };

  const fetchMessages = async () => {
    if (!chatRoom) {
      return;
    }
    const fetchedMessages = await DataStore.query(
      MessageModel,
      message => message.chatroomID('eq', chatRoom?.id),
      {
        sort: message => message.createdAt(SortDirection.DESCENDING),
      },
    );
    // console.log(fetchedMessages);
    setMessages(fetchedMessages);
  };

  if (!chatRoom) {
    return <ActivityIndicator />;
  }

  return (
    <SafeAreaView style={styles.page}>
      <FlatList
        // data={chatRoomData.messages}
        data={messages}
        renderItem={({item}) => (
          <Message
            message={item}
            setAsMessageReply={() => setMessageReplyTo(item)}
          />
        )}
        inverted
      />
      <MessageInput
        chatRoom={chatRoom}
        messageReplyTo={messageReplyTo}
        removeMessageReplyTo={() => setMessageReplyTo(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: 'white',
    flex: 1,
  },
});

export default ChatRoomScreen;
