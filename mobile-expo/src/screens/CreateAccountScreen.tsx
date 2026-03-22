import React, { useMemo, useState } from 'react';
import {
  Modal,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons';

import type { RootStackParamList, UserRole } from '../types/navigation';

const roleContent: Record<
  UserRole,
  {
    accountTitle: string;
    setupText: string;
    heroTitle: string;
    heroBody: string;
    heroWidth: number;
  }
> = {
  patient: {
    accountTitle: 'Create your account',
    setupText: 'Set up your secure account to get started',
    heroTitle: 'Care starts with a secure connection',
    heroBody: 'Secure account setup for AI-guided support.',
    heroWidth: 255,
  },
  professional: {
    accountTitle: 'Create your professional account',
    setupText: 'Set up your secure workspace to get started',
    heroTitle: 'Professional care begins with a secure workspace',
    heroBody: 'Secure account setup for consultations, schedules, and patient care.',
    heroWidth: 292,
  },
  organisation: {
    accountTitle: 'Create your organisation account',
    setupText: 'Set up your secure organisation workspace to get started',
    heroTitle: 'Healthcare operations start with a secure foundation',
    heroBody: 'Secure account setup for teams, staffing, and coordinated care operations.',
    heroWidth: 292,
  },
};

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAccount'>;

const countryOptions = [
  { code: '+234', flag: 'NG', label: 'Nigeria' },
  { code: '+1', flag: 'US', label: 'United States' },
  { code: '+44', flag: 'GB', label: 'United Kingdom' },
] as const;

export function CreateAccountScreen({ route }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    fullName: '',
    email: '',
    countryCode: '+234',
    phone: '',
    password: '',
  });

  const role = route.params.role;
  const content = useMemo(() => roleContent[role], [role]);

  return (
    <SafeAreaView className="flex-1 bg-slate-200">
      <ScrollView bounces={false} contentContainerClassName="grow bg-slate-200">
        <ImageBackground
          source={require('../../assets/get-started-bg.jpg')}
          resizeMode="cover"
          className="min-h-[300px] justify-end"
          imageStyle={{ opacity: 0.98 }}
        >
          <View className="absolute inset-0 bg-slate-900/35" />
          <View className="min-h-[300px] justify-end px-[22px] pb-7">
            <Text
              className="text-[40px] font-extrabold leading-10 text-[#F8FAFC]"
              style={{ maxWidth: content.heroWidth }}
            >
              {content.heroTitle}
            </Text>
            <Text className="mt-3 max-w-[300px] text-[13px] leading-[18px] text-white/95">
              {content.heroBody}
            </Text>
          </View>
        </ImageBackground>

        <View className="-mt-[18px] flex-1 rounded-t-[34px] bg-[#F8FAFC] px-4 pt-[18px] pb-7">
          <View className="items-center gap-2">
            <Text className="text-center text-[28px] font-normal leading-8 text-slate-700">
              {content.accountTitle}
            </Text>
            <Text className="max-w-[260px] text-center text-[14px] leading-5 text-slate-900">
              {content.setupText}
            </Text>
          </View>

          <View className="mt-[18px] flex-row self-center gap-[14px]">
            <SocialIconButton kind="facebook" />
            <SocialIconButton kind="apple" />
            <SocialIconButton kind="google" />
          </View>

          <View className="mt-[18px] flex-row items-center gap-[10px]">
            <View className="h-px flex-1 bg-[#556578]" />
            <Text className="text-base text-slate-700">Or</Text>
            <View className="h-px flex-1 bg-[#556578]" />
          </View>

          <View className="mt-[18px] gap-[14px] rounded-[30px] border border-white/80 bg-white px-4 py-5">
            <Field label="Full Name">
              <TextInput
                value={formValues.fullName}
                onChangeText={(fullName) => setFormValues((current) => ({ ...current, fullName }))}
                placeholder="eg John Doe"
                placeholderTextColor="#94A3B8"
                className="h-[47px] rounded-xl border border-[#94A3B8] px-[18px] text-[18px] text-slate-700"
              />
            </Field>

            <Field label="Email address">
              <TextInput
                value={formValues.email}
                onChangeText={(email) => setFormValues((current) => ({ ...current, email }))}
                placeholder="eg john@dig.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                className="h-[47px] rounded-xl border border-[#94A3B8] px-[18px] text-[18px] text-slate-700"
              />
            </Field>

            <Field label="Phone number">
              <View className="h-[47px] flex-row overflow-hidden rounded-xl border border-[#94A3B8]">
                <Pressable
                  onPress={() => setIsCountryModalOpen(true)}
                  className="min-w-[98px] flex-row items-center justify-center gap-2 border-r border-[#94A3B8] bg-[#EAF4FF] px-3"
                >
                  <Text className="text-[16px] font-semibold text-slate-700">
                    {countryOptions.find((item) => item.code === formValues.countryCode)?.flag}
                  </Text>
                  <Text className="text-[16px] text-slate-700">{formValues.countryCode}</Text>
                  <AntDesign name="down" size={12} color="#64748B" />
                </Pressable>

                <TextInput
                  value={formValues.phone}
                  onChangeText={(phone) => setFormValues((current) => ({ ...current, phone }))}
                  placeholder="Phone number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  className="flex-1 px-[18px] text-[18px] text-slate-700"
                />
              </View>
            </Field>

            <Field label="Password">
              <View className="h-[47px] flex-row items-center rounded-xl border border-[#94A3B8] px-[18px]">
                <TextInput
                  value={formValues.password}
                  onChangeText={(password) => setFormValues((current) => ({ ...current, password }))}
                  placeholder="Not more than 8 characters"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  className="flex-1 text-[18px] text-slate-700"
                />
                <Pressable onPress={() => setShowPassword((current) => !current)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#0F172A"
                  />
                </Pressable>
              </View>
            </Field>

            <Text className="mt-1 text-xs font-semibold leading-4 text-black">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>

            <Pressable className="mt-1 h-[50px] items-center justify-center rounded-[18px] bg-[#1565C0]">
              <Text className="text-[18px] font-medium text-[#E3F2FD]">Next</Text>
            </Pressable>
          </View>

          <Text className="mt-[18px] text-center text-[15px] text-black">
            Already have an account? <Text className="font-bold text-[#1565C0]">Log in</Text>
          </Text>
        </View>

        <Modal
          visible={isCountryModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsCountryModalOpen(false)}
        >
          <Pressable
            onPress={() => setIsCountryModalOpen(false)}
            className="flex-1 items-center justify-center bg-black/35 px-6"
          >
            <Pressable className="w-full rounded-[24px] bg-white p-4">
              <Text className="mb-3 text-[18px] font-semibold text-slate-800">Select country</Text>
              {countryOptions.map((item) => (
                <Pressable
                  key={item.code}
                  onPress={() => {
                    setFormValues((current) => ({ ...current, countryCode: item.code }));
                    setIsCountryModalOpen(false);
                  }}
                  className="flex-row items-center justify-between rounded-xl px-3 py-3"
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-[16px] font-semibold text-slate-700">{item.flag}</Text>
                    <Text className="text-[16px] text-slate-700">{item.label}</Text>
                  </View>
                  <Text className="text-[16px] text-slate-500">{item.code}</Text>
                </Pressable>
              ))}
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-[18px] text-black">{label}</Text>
      {children}
    </View>
  );
}

function SocialIconButton({ kind }: { kind: 'facebook' | 'apple' | 'google' }) {
  return (
    <Pressable className="h-[42px] w-[42px] items-center justify-center rounded-full border border-slate-300/30 bg-white">
      {kind === 'facebook' ? <FontAwesome name="facebook" size={20} color="#1877F2" /> : null}
      {kind === 'apple' ? <Ionicons name="logo-apple" size={20} color="#111827" /> : null}
      {kind === 'google' ? <AntDesign name="google" size={18} color="#EA4335" /> : null}
    </Pressable>
  );
}
