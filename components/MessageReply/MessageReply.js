import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/dist/Ionicons';
import {Auth, DataStore, Storage} from 'aws-amplify';
import {User} from '../../src/models';
import {S3Image} from 'aws-amplify-react-native';
import AudioPlayer from '../../AudioPlayer/AudioPlayer';
import {Message as MessageModel} from '../../src/models';

const blue = '#3777f0';
const grey = 'lightgrey';

const MessageReply = props => {
  const {message: propMessage} = props;

  const [message, setMessage] = useState(propMessage);
  const [user, setUser] = useState();
  const [isMe, setIsMe] = useState(null);
  const [soundURI, setSoundURI] = useState(null);

  const {width} = useWindowDimensions();

  useEffect(() => {
    DataStore.query(User, message.userID).then(setUser);
  }, []);

  useEffect(() => {
    setMessage(propMessage);
  }, [propMessage]);

  useEffect(() => {
    if (message.audio) {
      Storage.get(message.audio).then(setSoundURI);
    }
  }, [message]);

  useEffect(() => {
    const checkIfMe = async () => {
      if (!user) {
        return;
      }
      const authUser = await Auth.currentAuthenticatedUser();
      setIsMe(user.id === authUser.attributes.sub);
    };
    checkIfMe();
  }, [user]);

  if (!user) {
    return <ActivityIndicator />;
  }

  return (
    <View
      style={[
        styles.container,
        isMe ? styles.rightContainer : styles.leftContainer,
        {width: soundURI ? '75%' : 'auto'},
      ]}>
      <View style={styles.row}>
        {message.image && (
          <View style={{marginBottom: message.content ? 10 : 0}}>
            <S3Image
              imgKey={message.image}
              style={{width: width * 0.65, aspectRatio: 4 / 3}}
              resizeMode="contain"
            />
          </View>
        )}

        {soundURI && <AudioPlayer soundURI={soundURI} />}

        {!!message.content && (
          <Text style={{color: isMe ? 'black' : 'white'}}>
            {message.content}
          </Text>
        )}

        {isMe && !!message.status && message.status !== 'SENT' && (
          <Icon
            name={
              message.status === 'DELIVERED'
                ? 'checkmark-outline'
                : 'checkmark-done-outline'
            }
            size={16}
            color="green"
            style={{marginHorizontal: 5}}
          />
        )}
      </View>
    </View>
  );
};

export default MessageReply;

const styles = StyleSheet.create({
  container: {
    padding: 10,
    margin: 10,
    borderRadius: 10,
    maxWidth: '75%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageReply: {
    backgroundColor: 'grey',
    padding: 5,
    borderWidth: 3,
  },
  leftContainer: {
    backgroundColor: blue,
    marginLeft: 10,
    marginRight: 'auto',
  },
  rightContainer: {
    backgroundColor: grey,
    marginLeft: 'auto',
    marginRight: 10,
    alignItems: 'flex-end',
  },
});
