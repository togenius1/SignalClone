import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Pressable,
  Platform,
  Image,
  PermissionsAndroid,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/dist/Ionicons';
import {Auth, DataStore, Storage} from 'aws-amplify';
import {Message, ChatRoom} from '../../src/models';
import EmojiSelector, {Categories} from 'react-native-emoji-selector';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

import {v4 as uuidv4} from 'uuid';

import MessageComponent from '../message/Message';
import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSet,
  AudioSourceAndroidType,
  PlayBackType,
  RecordBackType,
} from 'react-native-audio-recorder-player';
import RNFetchBlob from 'rn-fetch-blob';
import AudioPlayer from '../../AudioPlayer/AudioPlayer';

const state = {
  isLoggingIn: false,
  recordSecs: 0,
  recordTime: '00:00:00',
  currentPositionSec: 0,
  currentDurationSec: 0,
  playTime: '00:00:00',
  duration: '00:00:00',
};

// Record Audio
const audioRecorderPlayer = new AudioRecorderPlayer();
audioRecorderPlayer.setSubscriptionDuration(0.1); // optional. Default is 0.5

const MessageInput = ({chatRoom, messageReplyTo, removeMessageReplyTo}) => {
  const [message, setMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [soundURI, setSoundURI] = useState(null);
  const [sound, setSound] = useState(state);

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);

        console.log('write external stroage', grants);

        if (
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.RECORD_AUDIO'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.CAMERA'] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('Permissions granted');
        } else {
          console.log('All required permissions not granted');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }
  };

  const dirs = RNFetchBlob.fs.dirs;
  const path = Platform.select({
    ios: 'hello.m4a',
    android: `${dirs.CacheDir}/hello.mp3`,
  });

  const audioSet = {
    AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
    AudioSourceAndroid: AudioSourceAndroidType.MIC,
    AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
    AVNumberOfChannelsKeyIOS: 2,
    AVFormatIDKeyIOS: AVEncodingOption.aac,
  };
  // console.log('audioSet', audioSet);

  const onStartRecord = async () => {
    // const path = 'hello.m4a';

    const uri = await audioRecorderPlayer.startRecorder(path, audioSet);

    audioRecorderPlayer.addRecordBackListener(e => {
      console.log('record-back', e);
      setSound({
        recordSecs: e.currentPosition,
        recordTime: audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
      });
    });

    console.log(`uri: ${uri}`);
  };

  //Stop recording
  const onStopRecord = async () => {
    const uri = await audioRecorderPlayer.stopRecorder();
    audioRecorderPlayer.removeRecordBackListener();
    setSound({
      recordSecs: 0,
    });
    console.log(uri);

    setSoundURI(uri);
  };

  const captureImage = async type => {
    let options = {
      mediaType: type,
      maxWidth: 300,
      maxHeight: 550,
      quality: 1,
      videoQuality: 'low',
      durationLimit: 30,
      saveToPhotos: true,
    };

    let isPermitted = requestPermission();
    if (isPermitted) {
      launchCamera(options, response => {
        // console.log('Response = ', response);

        if (response.didCancel) {
          alert('User cancelled camera picker');
          return;
        } else if (response.errorCode == 'camera_unavailable') {
          alert('Camera not available on device');
          return;
        } else if (response.errorCode == 'permission') {
          alert('Permission not satisfied');
          return;
        } else if (response.errorCode == 'others') {
          alert(response.errorMessage);
          return;
        }
        setImage(response);
      });
    }
  };

  const chooseFile = type => {
    let options = {
      mediaType: type,
      maxWidth: 300,
      maxHeight: 550,
      quality: 1,
    };

    launchImageLibrary(options, response => {
      // console.log('Response = ', response);

      if (response.didCancel) {
        alert('User cancelled camera picker');
        return;
      } else if (response.errorCode == 'camera_unavailable') {
        alert('Camera not available on device');
        return;
      } else if (response.errorCode == 'permission') {
        alert('Permission not satisfied');
        return;
      } else if (response.errorCode == 'others') {
        alert(response.errorMessage);
        return;
      }
      setImage(response);
    });
  };

  const resetFields = () => {
    setMessage('');
    setIsEmojiPickerOpen(false);
    setImage(null);
    setProgress(0);
    setSoundURI(null);
    removeMessageReplyTo();
  };

  // Send Message
  const sendMessage = async () => {
    // console.warn('sending: ', message);
    const user = await Auth.currentAuthenticatedUser();
    const newMessage = await DataStore.save(
      new Message({
        content: message,
        userID: user.attributes.sub,
        chatroomID: chatRoom.id,
        status: 'SENT',
        replyToMessageID: messageReplyTo?.id,
      }),
    );

    updateLastMessage(newMessage);

    resetFields();
  };

  const updateLastMessage = async newMessage => {
    DataStore.save(
      ChatRoom.copyOf(chatRoom, updatedChatRoom => {
        updatedChatRoom.LastMessage = newMessage;
      }),
    );
  };

  // const onPlusClicked = () => {
  //   console.log('On plus clicked');
  // };

  const onPress = () => {
    if (image) {
      sendImage();
    } else if (soundURI) {
      sendAudio();
    } else if (message) {
      sendMessage();
    }
    // else {
    //   onPlusClicked();
    // }
  };

  const progressCallback = progress => {
    // console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
    setProgress(progress.loaded / progress.total);
  };

  const getBlob = async uri => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };

  const sendImage = async () => {
    // console.log('Image: ' + JSON.stringify(image.assets[0].uri));
    if (!image) {
      return;
    }
    const blob = await getBlob(image.assets[0].uri);
    const {key} = await Storage.put(`${uuidv4()}.png`, blob, {
      progressCallback,
    });

    // Send Message
    const user = await Auth.currentAuthenticatedUser();
    const newMessage = await DataStore.save(
      new Message({
        content: message,
        image: key,
        userID: user.attributes.sub,
        chatroomID: chatRoom.id,
      }),
    );

    updateLastMessage(newMessage);

    resetFields();
  };

  const sendAudio = async () => {
    console.log('soundURI: ' + soundURI);

    if (!soundURI) {
      return;
    }
    const uriParts = soundURI.split('.');
    const extension = uriParts[uriParts.length - 1];
    const blob = await getBlob(soundURI);
    const {key} = await Storage.put(`${uuidv4()}.${extension}`, blob, {
      progressCallback,
    });

    // Send Message
    const user = await Auth.currentAuthenticatedUser();
    const newMessage = await DataStore.save(
      new Message({
        content: message,
        audio: key,
        userID: user.attributes.sub,
        chatroomID: chatRoom.id,
      }),
    );

    updateLastMessage(newMessage);

    resetFields();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
      style={([styles.root], {height: isEmojiPickerOpen ? '50%' : 'auto'})}>
      {messageReplyTo && (
        <View
          style={{
            backgroundColor: '#f2f2f2',
            padding: 5,
            flexDirection: 'row',
            alignSelf: 'stretch',
            justifyContent: 'space-between',
          }}>
          <View style={{flex: 1}}>
            <View>
              <Text> Reply to: </Text>
              <MessageComponent message={messageReplyTo} />
            </View>
          </View>
          <Pressable onPress={() => removeMessageReplyTo()}>
            <Icon
              name="close-outline"
              size={24}
              color="dark"
              style={{margin: 5}}
            />
          </Pressable>
        </View>
      )}

      {image && (
        <View style={styles.sendImageContainer}>
          <Image
            source={{uri: image.assets[0].uri}}
            style={{width: 100, height: 100, borderRadius: 10}}
          />
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-start',
              alignSelf: 'flex-end',
            }}>
            <View
              style={{
                height: 5,
                borderRadius: 5,
                backgroundColor: '#3777f0',
                width: `${progress * 100}%`,
              }}
            />
          </View>

          <Pressable onPress={() => setImage(null)}>
            <Icon
              name="close-outline"
              size={24}
              color="black"
              style={{margin: 10}}
            />
          </Pressable>
        </View>
      )}
      {soundURI && <AudioPlayer soundURI={soundURI} />}
      <View style={styles.row}>
        <View style={styles.inputContainer}>
          <Pressable
            onPress={() => setIsEmojiPickerOpen(currentValue => !currentValue)}>
            <Icon
              style={styles.icon}
              name="happy-outline"
              size={24}
              color="#595959"
            />
          </Pressable>

          <TextInput
            style={styles.input}
            placeholder="Signal message..."
            value={message}
            onChangeText={setMessage}
          />
          <Pressable onPress={() => chooseFile('photo')}>
            <Icon
              style={styles.icon}
              name="image-outline"
              size={24}
              color="#595959"
            />
          </Pressable>
          <Pressable onPress={() => captureImage('photo')}>
            <Icon
              style={styles.icon}
              name="camera-outline"
              size={24}
              color="grey"
            />
          </Pressable>

          <Pressable onPressIn={onStartRecord} onPressOut={onStopRecord}>
            <Icon
              style={styles.icon}
              name={sound.recordSecs > 0 ? 'mic' : 'mic-outline'}
              size={24}
              color={sound.recordSecs > 0 ? 'red' : '#595959'}
            />
          </Pressable>
        </View>

        <Pressable style={styles.buttonContainer} onPress={onPress}>
          {message || image || soundURI ? (
            <Icon name="send-outline" size={18} color="white" />
          ) : (
            <Icon name="add-outline" size={24} color="white" />
          )}
        </Pressable>
      </View>
      {isEmojiPickerOpen && (
        <EmojiSelector
          onEmojiSelected={emoji =>
            setMessage(currentMessage => currentMessage + emoji)
          }
          columns={8}
        />
      )}
    </KeyboardAvoidingView>
  );
};

export default MessageInput;

const styles = StyleSheet.create({
  root: {
    padding: 10,
    // alignItems: 'center',
    // height: '50%',
  },
  row: {
    flexDirection: 'row',
  },
  inputContainer: {
    backgroundColor: '#f2f2f2',
    flex: 1,
    marginRight: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#dedede',
    alignItems: 'center',
    flexDirection: 'row',
    padding: 5,
  },
  icon: {
    marginHorizontal: 5,
  },
  input: {
    flex: 1,
  },
  buttonContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#3777f0',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 35,
  },
  sendImageContainer: {
    flexDirection: 'row',
    marginVertical: 10,
    marginLeft: 5,
    marginRight: 5,
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'lightgrey',
    borderRadius: 10,
  },
});