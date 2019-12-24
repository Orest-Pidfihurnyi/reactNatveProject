import React from 'react';
import {
  TouchableOpacity,
  TouchableNativeFeedback,
  View,
} from 'react-native';
import T from 'prop-types';
import s from './styles';
import { isAndroid } from '../../utils';

function HeaderBackIcon({ onPress, children }) {
  return isAndroid ? (
    <View style={s.containerAndroid}>
      <TouchableNativeFeedback onPress={onPress}>
        {children}
      </TouchableNativeFeedback>
    </View>
  ) : (
    <TouchableOpacity style={s.containerIos} onPress={onPress}>
      {children}
    </TouchableOpacity>
  );
}

HeaderBackIcon.propTypes = {
  onPress: T.func,
  children: T.node,
};

export default HeaderBackIcon;
