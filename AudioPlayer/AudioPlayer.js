import React, {useState, useEffect} from 'react';
import {StyleSheet, Text, View, Pressable, Dimensions} from 'react-native';
import Icon from 'react-native-vector-icons/dist/Ionicons';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

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
audioRecorderPlayer.setSubscriptionDuration(0.1); // optional. Default is 0.1

const AudioPlayer = ({soundURI}) => {
  const [sound, setSound] = useState(state);
  const [paused, setPaused] = useState(true);
  // const [audioDuration, setAudioDuration] = useState(0);

  useEffect(() => {
    // Load sound
    // loadSound();
    const loadSound = async () => {
      if (!soundURI) {
        return;
      }
      const uri = await soundURI;
      setSound(uri);
    };
    //unload sound
    () => {
      audioRecorderPlayer.removeRecordBackListener();
      setSound({
        recordSecs: 0,
      });
    };
  }, [soundURI]);

  // Get Sound duration
  // const getDuration = () => {
  // const minutes = Math.floor(audioDuration / (60 * 1000));
  // const seconds = Math.floor((audioDuration % (60 * 1000)) / 1000);

  // return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  // return sound.playTime;
  // };

  // Playing audio
  const onStartPlay = async () => {
    if (!sound) {
      return;
    }
    // console.log('onStartPlay');

    // const path = 'hello.m4a';
    // const path = sound;

    const msg = await audioRecorderPlayer.startPlayer(soundURI);
    const volume = await audioRecorderPlayer.setVolume(1.0);
    // console.log(`file: ${msg}`, `volume: ${volume}`);

    audioRecorderPlayer.addPlayBackListener(e => {
      setSound({
        currentPositionSec: e.currentPosition,
        currentDurationSec: e.duration,
        playTime: audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
        duration: audioRecorderPlayer.mmssss(Math.floor(e.duration)),
      });

      // setAudioDuration(e.duration || 0);
    });

    setPaused(false);
  };

  // Pause
  const onPausePlay = async e => {
    await audioRecorderPlayer.pausePlayer();
    setPaused(true);
  };

  // Stop play
  const onStopPlay = async e => {
    console.log('onStopPlay');
    audioRecorderPlayer.stopPlayer();
    audioRecorderPlayer.removePlayBackListener();

    setPaused(true);
  };

  // Play Progress
  const screenWidth = Dimensions.get('screen').width;

  let playWidth =
    (sound.currentPositionSec / sound.currentDurationSec) *
      (screenWidth - 230) || 1;

  if (!playWidth) {
    playWidth = 0;
  }

  return (
    <View style={styles.sendAudioContainer}>
      <Pressable onPress={paused ? onStartPlay : onPausePlay}>
        <Icon
          name={paused ? 'play-outline' : 'pause-outline'}
          size={24}
          color="gray"
        />
      </Pressable>

      {/* <View style={styles.audioProgressBG}>
        <View style={[styles.audioProgressFG, {width: playWidth}]} />
      </View> */}
      <View style={{backgroundColor: 'lightgrey'}}>
        <Text>{sound.playTime}</Text>
      </View>
    </View>
  );
};

export default AudioPlayer;

const styles = StyleSheet.create({
  sendAudioContainer: {
    marginVertical: 5,
    padding: 10,
    width: Dimensions.get('screen').width - 250,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: 'lightgrey',
    borderRadius: 10,
    backgroundColor: 'white',
  },
  audioProgressBG: {
    height: 3,
    flex: 1,
    backgroundColor: 'lightgrey',
    borderRadius: 5,
    margin: 10,
  },
  audioProgressFG: {
    height: 4,
    borderRadius: 10,
    backgroundColor: '#3777f0',

    position: 'absolute',
    top: -3,
    // left: '50%',
  },
});
