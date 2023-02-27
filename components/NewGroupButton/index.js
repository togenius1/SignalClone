import {StyleSheet, View, Text, Pressable} from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/dist/FontAwesome';

const NewGroupButton = ({onPress}) => {
  return (
    <Pressable onPress={onPress}>
      <View style={{flexDirection: 'row', alignItems: 'center', padding: 10}}>
        <Icon name="users" size={24} color="black" />
        <Text style={{marginLeft: 10, fontWeight: 'bold', color: '#4f4f4f'}}>
          New group
        </Text>
      </View>
    </Pressable>
  );
};

export default NewGroupButton;

const styles = StyleSheet.create({});
