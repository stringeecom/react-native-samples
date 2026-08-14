declare module 'react-native-incall-manager' {
  interface InCallManagerApi {
    startRingtone(ringtone: string): void;
    stopRingtone(): void;
  }

  const InCallManager: InCallManagerApi;
  export default InCallManager;
}
