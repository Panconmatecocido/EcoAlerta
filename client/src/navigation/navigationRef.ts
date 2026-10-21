import { createNavigationContainerRef } from '@react-navigation/native';

export type RootStackParamList = {
  MainApp: undefined;
  Login: undefined;
  Register: undefined;
  AgentApp: undefined;
  AdminApp: undefined;
  CollaboratorApp: undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
