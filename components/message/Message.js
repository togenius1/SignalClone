import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/dist/Ionicons';
import {Auth, DataStore, Storage} from 'aws-amplify';
import {User} from '../../src/models';
import {S3Image} from 'aws-amplify-react-native';
import {box} from 'tweetnacl';

import AudioPlayer from '../../AudioPlayer/AudioPlayer';
import {Message as MessageModel} from '../../src/models';
import MessageReply from '../MessageReply/MessageReply';
import ActionSheet from '../ActionSheet/ActionSheet';
import {stringToUint8Array, getMySecretKey, decrypt} from '../../utils/crypto';

const blue = '#3777f0';
const grey = 'lightgrey';

const Message = props => {
  const {setAsMessageReply, message: propMessage} = props;

  const [message, setMessage] = useState(propMessage);
  const [decryptedContent, setDecryptedContent] = useState('');
  const [repliedTo, setRepliedTo] = useState();
  const [user, setUser] = useState();
  const [isMe, setIsMe] = useState(null);
  const [soundURI, setSoundURI] = useState(null);
  const [isDeleted, setIsDeleted] = useState(false);

  const {width} = useWindowDimensions();
  const actionSheetRef = useRef(null);

  const Sheets = {
    replySheet: 'reply_sheet_id',
    // deleteSheet: 'delete_sheet_id',
  };

  useEffect(() => {
    DataStore.query(User, message.userID).then(setUser);
  }, [message.userID]);

  useEffect(() => {
    if (message?.replyToMessageID) {
      DataStore.query(MessageModel, message.replyToMessageID).then(
        setRepliedTo,
      );
    }
  }, [message]);

  useEffect(() => {
    setMessage(propMessage);
  }, [propMessage]);

  useEffect(() => {
    const subscription = DataStore.observe(MessageModel, message.id).subscribe(
      msg => {
        if (msg.model === MessageModel) {
          if (msg.opType === 'UPDATE') {
            setMessage(message => ({...message, ...msg.element}));
          } else if (msg.opType === 'DELETE') {
            setIsDeleted(true);
          }
        }
      },
    );
    return () => subscription.unsubscribe();
  }, [message]);

  useEffect(() => {
    const setAsRead = () => {
      if (isMe === false && message.status !== 'READ') {
        DataStore.save(
          MessageModel.copyOf(message, updated => {
            updated.status = 'READ';
          }),
        );
      }
    };
    setAsRead();
  }, [isMe, message]);

  useEffect(() => {
    if (message.audio) {
      Storage.get(message.audio).then(setSoundURI);
    }
  }, [message]);

  useEffect(() => {
    if (!message?.content || !user?.publicKey) {
      return;
    }

    const decryptMessage = async () => {
      const myKey = await getMySecretKey();
      if (!myKey) {
        return;
      }
      // decrypt message.content
      const sharedKey = box.before(stringToUint8Array(user.publicKey), myKey);
      // console.log('sharedKey', sharedKey);
      const decrypted = decrypt(sharedKey, message.content);
      // console.log('decrypted', decrypted);
      setDecryptedContent(decrypted.message);
    };

    decryptMessage();
  }, [message, user]);

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

  const deleteMessage = async () => {
    await DataStore.delete(message);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Confirm delete',
      'Are you sure you want to delete the message?',
      [
        {
          text: 'Delete',
          onPress: deleteMessage,
          style: 'destructive',
        },
        {
          text: 'Cancel',
        },
      ],
    );
  };

  const onDeletePress = () => {
    actionSheetRef.current?.hide();
    confirmDelete();
  };

  const onReplyPress = async () => {
    actionSheetRef.current?.hide();
    // Alert.alert('Reply Pressed');
    setAsMessageReply();
  };

  const onCancelPress = () => {
    actionSheetRef.current?.hide();
  };

  const openActionMenu = () => {
    actionSheetRef.current?.show();
  };

  if (!user) {
    return <ActivityIndicator />;
  }
  // console.log(message);
  return (
    <Pressable onLongPress={openActionMenu}>
      <View
        style={[
          styles.container,
          isMe ? styles.rightContainer : styles.leftContainer,
          {width: soundURI ? '75%' : 'auto'},
        ]}>
        {repliedTo && <MessageReply message={repliedTo} />}
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

          {!!decryptedContent && (
            <Text style={{color: isMe ? 'black' : 'white'}}>
              {isDeleted ? 'message deleted' : decryptedContent}
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

      {
        <ActionSheet
          id={Sheets.replySheet}
          ref={actionSheetRef}
          title={'Title'}>
          <View style={styles.actionSheetContainer}>
            <TouchableOpacity onPress={onReplyPress}>
              <Text style={styles.actionSheetText}>Reply</Text>
            </TouchableOpacity>
            {isMe && (
              <TouchableOpacity onPress={onDeletePress}>
                <Text style={{...styles.actionSheetText, color: 'red'}}>
                  Delete
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onCancelPress}>
              <Text style={styles.actionSheetText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ActionSheet>
      }
    </Pressable>
  );
};

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
  actionSheetContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionSheetText: {
    fontSize: 22,
    color: '#3777f0',
    marginBottom: 16,
  },
});

export default Message;
