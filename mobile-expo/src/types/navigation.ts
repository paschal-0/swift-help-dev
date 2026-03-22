export type UserRole = 'patient' | 'professional' | 'organisation';

export type RootStackParamList = {
  Splash: undefined;
  GetStarted: undefined;
  CreateAccount: {
    role: UserRole;
  };
};
