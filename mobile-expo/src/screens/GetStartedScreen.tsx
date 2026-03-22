import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList, UserRole } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'GetStarted'>;

const optionCards: Array<{
  role: UserRole;
  title: string;
  description: string;
  buttonLabel: string;
  background: string;
  icon: number;
}> = [
  {
    role: 'patient',
    title: 'Patient',
    description:
      'Get AI-guided health support, book consultations, and manage your care in one secure place.',
    buttonLabel: 'Continue as patient',
    background: '#E3F2FD',
    icon: require('../../assets/patient-icon.png'),
  },
  {
    role: 'professional',
    title: 'Healthcare Professional',
    description:
      'Manage consultations, schedules, and patient interactions through a secure clinical workspace.',
    buttonLabel: 'Continue as professional',
    background: '#DCFCE7',
    icon: require('../../assets/professional-icon.png'),
  },
  {
    role: 'organisation',
    title: 'Organisation',
    description:
      'Set up your organization, manage teams, and coordinate staffing across your healthcare operations.',
    buttonLabel: 'Continue as organisation',
    background: '#E9EEF4',
    icon: require('../../assets/organisation-icon.png'),
  },
];

export function GetStartedScreen({ navigation }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCard = useMemo(() => optionCards[activeIndex], [activeIndex]);

  return (
    <SafeAreaView className="flex-1 bg-[#EDF4FB]">
      <View className="absolute -top-10 -left-[70px] h-[220px] w-[220px] rounded-full bg-[#bfdbfe]/60" />
      <View className="absolute top-[110px] -right-[90px] h-[240px] w-[240px] rounded-full bg-[#dbeafe]/75" />
      <View className="absolute -bottom-[60px] left-[70px] h-[220px] w-[220px] rounded-full bg-[#dcfce7]/75" />

      <ScrollView bounces={false} contentContainerClassName="grow px-4 pt-2.5 pb-5">
        <View className="items-center pt-1">
          <View className="rounded-full border border-[#BFDBFE] bg-white/75 px-3.5 py-1.5">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.8px] text-[#1565C0]">
              Get started
            </Text>
          </View>

          <Text className="mt-[18px] text-center text-4xl font-bold leading-9 text-slate-700">
            Welcome to{'\n'}
            <Text className="text-[#1E3A5F]">Swifthelp</Text>
          </Text>

          <Text className="mt-2.5 max-w-[300px] text-center text-[15px] leading-[22px] text-slate-600">
            Choose how you&apos;ll be using the platform so we can personalize your setup.
          </Text>
        </View>

        <View className="mt-[22px] flex-row gap-[5px] rounded-full border border-white/75 bg-white/65 p-[5px]">
          {optionCards.map((card, index) => {
            const isActive = activeIndex === index;

            return (
              <Pressable
                key={card.role}
                onPress={() => setActiveIndex(index)}
                className={`min-h-12 flex-1 items-center justify-center rounded-full px-2 py-2 ${isActive ? 'bg-[#1565C0]' : ''}`}
              >
                <Text
                  className={`text-center text-[11px] font-bold leading-[14px] ${isActive ? 'text-white' : 'text-slate-600'}`}
                >
                  {card.title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View key={activeCard.role} className="mt-3.5 min-h-[288px]">
          <Pressable
            onPress={() => navigation.navigate('CreateAccount', { role: activeCard.role })}
            className="flex-1"
          >
            <View
              className="absolute left-5 right-5 top-4 h-24 rounded-[28px] opacity-80"
              style={{ backgroundColor: activeCard.background }}
            />
            <View className="flex-1 rounded-[28px] border border-white/75 bg-white/70 px-[18px] py-[18px]">
              <View
                className="h-[60px] w-[60px] self-center items-center justify-center rounded-[18px] border border-white/85"
                style={{ backgroundColor: activeCard.background }}
              >
                <Image source={activeCard.icon} className="h-[34px] w-[34px]" resizeMode="contain" />
              </View>

              <Text className="mt-4 text-center text-[26px] font-semibold leading-8 text-slate-700">
                {activeCard.title}
              </Text>
              <Text className="mt-2.5 text-center text-[14px] leading-[21px] text-slate-600">
                {activeCard.description}
              </Text>

              <View className="mt-5 rounded-full bg-[#1565C0] px-4 py-3">
                <Text className="text-center text-[15px] font-semibold text-[#EFF6FF]">
                  {activeCard.buttonLabel}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
