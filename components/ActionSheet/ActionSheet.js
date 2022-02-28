import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import ActionSheet from 'react-native-actions-sheet';

const CustomActionSheet = React.forwardRef(({children, title}, ref) => {
  return (
    <ActionSheet
      ref={ref}
      headerAlwaysVisible={true}
      gestureEnabled={true}
      initialOffsetFromBottom={0.8}
      defaultOverlayOpacity={0.3}
      // CustomHeaderComponent={
      //   <View style={[styles.header, {backgroundColor: '#4ac'}]}>
      //     <Text style={styles.title}>{title}</Text>
      //   </View>
      // }
    >
      <View>{children}</View>
    </ActionSheet>
  );
});

export default CustomActionSheet;

const styles = StyleSheet.create({
  // header: {
  //   height: 50,
  //   justifyContent: 'center',
  //   padding: 5,
  // },
  // title: {
  //   color: '#FFF',
  //   fontSize: 22,
  // },
  // containerStyle: {
  //   borderRadius: 0,
  // },
});
