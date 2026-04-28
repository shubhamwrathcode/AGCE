import React from 'react';
import {View} from 'react-native';
import {AppSafeAreaView, Toolbar} from '../../shared';

const p2pOrder: React.FC = () => {
  return (
    <AppSafeAreaView>
      <Toolbar isLogo={false} isSecond title="Order" />
    </AppSafeAreaView>
  );
};

export default p2pOrder;
