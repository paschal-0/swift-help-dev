import React, { useEffect } from 'react';
import { Image, ImageBackground, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.replace('GetStarted');
    }, 1800);

    return () => clearTimeout(timeout);
  }, [navigation]);

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ImageBackground
        source={require('../../assets/get-started-bg.jpg')}
        resizeMode="cover"
        className="flex-1"
        imageStyle={{ opacity: 0.96 }}
      >
        <View className="absolute inset-0 bg-slate-900/45" />

        <View className="flex-1 justify-between px-6 pt-5 pb-10">
          <View className="flex-row items-center gap-1.5">
            <Image source={require('../../assets/swifthelp-logo.png')} className="h-11 w-11" />
            <Text className="text-[22px] font-semibold text-[#1e88e5]">Swifthelp</Text>
          </View>

          <View className="mb-[120px] gap-3.5">
            <Text className="text-[42px] font-extrabold leading-[44px] text-white">
              Care starts with a secure connection
            </Text>
            <Text className="max-w-[280px] text-[18px] leading-7 text-white/90">
              Secure account setup for patients, professionals, and organizations.
            </Text>
          </View>

          <View className="items-center">
            <View className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
              <View className="h-full w-[58%] rounded-full bg-[#1e88e5]" />
            </View>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}
