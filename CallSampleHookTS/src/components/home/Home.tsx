import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  PermissionsAndroid,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {StringeeCall2, StringeeClientListener} from 'stringee-react-native-v2';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {setCallInfo, setClientInfo} from '../../redux/actions';
import StringeeCallManager from '../../stringee_manager/StringeeCallManager';
import AndroidPushManager from '../../stringee_manager/AndroidPushManager';
import StringeeClientManager from '../../stringee_manager/StringeeClientManager';
import {StringeeWrapper} from '../../stringee_wrapper';
import {CALL_SCREEN_NAME, isIos} from '../../const';
import type {ActiveCall, RootStackParamList, RootState} from '../../types';
import materialIcons from '../../../assets/material_icons';

const access_token = 'PUT_YOUR_TOKEN_HERE';

const HomeScreen = (): React.ReactElement => {
  const [callWith, setCallWith] = useState('');
  const [accessToken, setAccessToken] = useState(
    access_token === 'PUT_YOUR_TOKEN_HERE' ? '' : access_token,
  );
  const [connecting, setConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Not connected...');
  const [calleeError, setCalleeError] = useState('');
  const isOnline = useSelector(
    (state: RootState) => state.stringee.client.isOnline,
  );
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch();

  const presentIncomingCall = (call: ActiveCall, useCall2: boolean): void => {
    dispatch(
      setCallInfo({
        call_with: call.fromAlias || call.from,
        isVideo: call.isVideoCall,
        useCall2,
        isIncoming: true,
      }),
    );
    navigation.navigate(CALL_SCREEN_NAME);
  };

  async function bootstrap(): Promise<void> {
    await AndroidPushManager.instance.bootstrap();
    await restoreSavedConnection();
    if (StringeeCallManager.instance.call) {
      const call = StringeeCallManager.instance.call;
      presentIncomingCall(call, call instanceof StringeeCall2);
    }
  }

  async function restoreSavedConnection(): Promise<void> {
    const savedToken =
      await StringeeClientManager.instance.getSavedAccessToken();
    if (savedToken) {
      setAccessToken(savedToken);
    }
    await StringeeClientManager.instance.restoreConnection();
  }

  useEffect(() => {
    if (!isIos) {
      requestPermission().then(bootstrap).catch(console.log);
    } else {
      restoreSavedConnection().catch(console.log);
    }

    const wrapper = StringeeWrapper.instance;
    if (wrapper.client.userId !== undefined) {
      const connected = wrapper.connected;
      dispatch(
        setClientInfo({
          isOnline: connected,
          client_id: wrapper.client.userId,
        }),
      );
      if (connected) {
        setStatusMessage(`Connected as ${wrapper.client.userId}`);
      }
    }

    const listener = new StringeeClientListener();
    listener.onConnect = (_, id) => {
      setConnecting(false);
      setStatusMessage(`Connected as ${id}`);
      dispatch(setClientInfo({isOnline: true, client_id: id}));
    };
    listener.onDisConnect = () => {
      setConnecting(false);
      setStatusMessage('Disconnected');
      dispatch(setClientInfo({isOnline: false, client_id: ''}));
    };
    listener.onIncomingCall = (_, call) => presentIncomingCall(call, false);
    listener.onIncomingCall2 = (_, call) => presentIncomingCall(call, true);
    listener.onFailWithError = (_, code, message) => {
      setConnecting(false);
      setStatusMessage(`Connect fail: ${message || code}`);
    };
    listener.onRequestAccessToken = () => {
      setConnecting(false);
      setStatusMessage('Token expired. Enter a new token');
    };

    wrapper.setListener(listener);
    return () => wrapper.removeListener(listener);
    // Managers are singletons; register this screen listener once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestPermission = async (): Promise<void> => {
    try {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      const deniedPermissions = Object.entries(result)
        .filter(([, value]) => value === PermissionsAndroid.RESULTS.DENIED)
        .map(([permission]) => permission);
      if (deniedPermissions.length > 0) {
        console.log('Permissions denied', deniedPermissions);
      }
    } catch (error) {
      console.log('Permission request failed', error);
    }
  };

  const connect = async (): Promise<void> => {
    const token = accessToken.trim();
    if (!token || connecting) {
      return;
    }
    setConnecting(true);
    setStatusMessage('Connecting...');
    try {
      await StringeeWrapper.instance.connect(token);
    } catch (error) {
      setConnecting(false);
      setStatusMessage(`Connect failed: ${String(error)}`);
    }
  };

  const logout = async (): Promise<void> => {
    if (connecting) {
      return;
    }
    setConnecting(true);
    setStatusMessage('Logging out...');
    try {
      await StringeeWrapper.instance.disconnect();
      setAccessToken('');
      setStatusMessage('Logged out');
      dispatch(setClientInfo({isOnline: false, client_id: ''}));
    } catch (error) {
      setStatusMessage(`Logout failed: ${String(error)}`);
    } finally {
      setConnecting(false);
    }
  };

  const makeCall = (isVideo: boolean, useCall2: boolean): void => {
    const callee = callWith.trim();
    if (!callee) {
      setCalleeError('Please enter a callee id');
      return;
    }
    setCalleeError('');
    dispatch(
      setCallInfo({
        call_with: callee,
        isVideo,
        useCall2,
        isIncoming: false,
      }),
    );
    navigation.navigate(CALL_SCREEN_NAME);
  };

  const renderSectionHeading = (
    source: number,
    title: string,
    description: string,
  ): React.ReactElement => (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionBadge}>
        <Image source={source} style={styles.sectionBadgeIcon} />
      </View>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionDescription}>{description}</Text>
      </View>
    </View>
  );

  const renderCallButton = (
    label: string,
    variant: 'voice' | 'video',
    onPress: () => void,
  ): React.ReactElement => {
    const enabled = callWith.trim().length > 0;
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={!enabled}
        onPress={onPress}
        style={[
          styles.callButton,
          variant === 'voice' ? styles.voiceButton : styles.videoButton,
          !enabled && styles.buttonDisabled,
        ]}>
        <Image
          source={
            variant === 'voice' ? materialIcons.phone : materialIcons.video
          }
          style={[
            styles.callButtonIcon,
            variant === 'video' && styles.videoButtonIcon,
          ]}
        />
        <Text
          style={[
            styles.callButtonText,
            variant === 'video' && styles.videoButtonText,
          ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSdkActions = (
    title: string,
    useCall2: boolean,
  ): React.ReactElement => (
    <View>
      <Text style={styles.sdkTitle}>{title}</Text>
      <View style={styles.callActionRow}>
        {renderCallButton('Voice', 'voice', () => makeCall(false, useCall2))}
        <View style={styles.actionGap} />
        {renderCallButton('Video', 'video', () => makeCall(true, useCall2))}
      </View>
    </View>
  );

  const statusHasError = /fail|expired/i.test(statusMessage);
  const statusStyle = statusHasError
    ? styles.statusError
    : isOnline
    ? styles.statusConnected
    : styles.statusOffline;
  const statusTextStyle = statusHasError
    ? styles.statusErrorText
    : isOnline
    ? styles.statusConnectedText
    : styles.statusOfflineText;
  const statusIconStyle = statusHasError
    ? styles.statusErrorIcon
    : isOnline
    ? styles.statusConnectedIcon
    : styles.statusOfflineIcon;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.appBar}>
        <View style={styles.brandMark}>
          <Image source={materialIcons.phone} style={styles.brandMarkIcon} />
        </View>
        <View style={styles.brandCopy}>
          <Text style={styles.brandName}>STRINGEE</Text>
          <Text style={styles.brandSubtitle}>Call sample</Text>
        </View>
        {isOnline && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Logout"
            disabled={connecting}
            onPress={logout}
            style={styles.logoutButton}>
            <Image source={materialIcons.logout} style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Image source={materialIcons.phone} style={styles.heroIconImage} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Stringee Call Sample</Text>
            <Text style={styles.heroDescription}>
              Connect once, then start clear voice and video calls.
            </Text>
          </View>
        </View>

        <View style={[styles.statusCard, statusStyle]}>
          {connecting ? (
            <ActivityIndicator size="small" color={COLORS.blue} />
          ) : (
            <Image
              source={
                statusHasError
                  ? materialIcons.error
                  : isOnline
                  ? materialIcons.connected
                  : materialIcons.offline
              }
              style={[styles.statusIcon, statusIconStyle]}
            />
          )}
          <Text style={[styles.statusText, statusTextStyle]}>
            {statusMessage}
          </Text>
        </View>

        {!isOnline ? (
          <View style={styles.surfaceCard}>
            {renderSectionHeading(
              materialIcons.key,
              'Connect to Stringee',
              'Paste an access token generated by your trusted server.',
            )}
            <TextInput
              accessibilityLabel="Access token"
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              placeholder="Enter a Stringee access token"
              placeholderTextColor={COLORS.textMuted}
              value={accessToken}
              onChangeText={setAccessToken}
              style={[styles.input, styles.tokenInput]}
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Connect"
              disabled={!accessToken.trim() || connecting}
              onPress={connect}
              style={[
                styles.connectButton,
                (!accessToken.trim() || connecting) && styles.buttonDisabled,
              ]}>
              {connecting && (
                <ActivityIndicator
                  style={styles.connectSpinner}
                  size="small"
                  color="white"
                />
              )}
              {!connecting && (
                <Image
                  source={materialIcons.login}
                  style={styles.connectIcon}
                />
              )}
              <Text style={styles.connectButtonText}>
                {connecting ? 'Connecting...' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.surfaceCard}>
            {renderSectionHeading(
              materialIcons.addCall,
              'Start a new call',
              'Enter the Stringee user ID you want to reach.',
            )}
            <TextInput
              accessibilityLabel="Callee ID"
              autoCapitalize="none"
              placeholder="Enter a callee id"
              placeholderTextColor={COLORS.textMuted}
              value={callWith}
              onChangeText={value => {
                setCallWith(value);
                if (value.trim()) {
                  setCalleeError('');
                }
              }}
              style={[styles.input, !!calleeError && styles.inputError]}
            />
            {!!calleeError && (
              <Text style={styles.errorText}>{calleeError}</Text>
            )}
            <Text style={styles.callTypeLabel}>Call type</Text>
            {renderSdkActions('StringeeCall', false)}
            <View style={styles.divider} />
            {renderSdkActions('StringeeCall2', true)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export {HomeScreen, access_token};

const COLORS = {
  background: '#F8F8F8',
  blue: '#0FACF3',
  border: '#E4E7EC',
  green: '#46DA60',
  greenDark: '#159447',
  navy: '#0D112B',
  navyLight: '#233659',
  red: '#FF4954',
  redStrong: '#EE2333',
  text: '#535353',
  textMuted: '#858B98',
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: 'white'},
  appBar: {
    minHeight: 66,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.redStrong,
  },
  brandMarkIcon: {width: 19, height: 19, tintColor: 'white'},
  brandCopy: {marginLeft: 11},
  brandName: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  brandSubtitle: {color: COLORS.text, fontSize: 11, fontWeight: '500'},
  logoutButton: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutIcon: {
    width: 19,
    height: 19,
    marginRight: 5,
    tintColor: COLORS.redStrong,
  },
  logoutText: {color: COLORS.redStrong, fontSize: 14, fontWeight: '600'},
  content: {paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32},
  hero: {
    padding: 24,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 10},
    elevation: 7,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.red,
  },
  heroIconImage: {width: 30, height: 30, tintColor: 'white'},
  heroCopy: {flex: 1, marginLeft: 18},
  heroTitle: {color: 'white', fontSize: 21, fontWeight: '700'},
  heroDescription: {
    marginTop: 7,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  statusCard: {
    marginTop: 22,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusOffline: {
    color: COLORS.blue,
    backgroundColor: '#F0FAFF',
    borderColor: '#BFEAFF',
  },
  statusConnected: {
    color: COLORS.greenDark,
    backgroundColor: '#EFFAF2',
    borderColor: '#C7EED0',
  },
  statusError: {
    color: COLORS.redStrong,
    backgroundColor: '#FFF3F4',
    borderColor: '#FFD0D4',
  },
  statusOfflineText: {color: COLORS.blue},
  statusConnectedText: {color: COLORS.greenDark},
  statusErrorText: {color: COLORS.redStrong},
  statusOfflineIcon: {tintColor: COLORS.blue},
  statusConnectedIcon: {tintColor: COLORS.greenDark},
  statusErrorIcon: {tintColor: COLORS.redStrong},
  statusIcon: {
    width: 21,
    height: 21,
  },
  statusText: {flex: 1, marginLeft: 11, fontWeight: '600'},
  surfaceCard: {
    marginTop: 14,
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EAEE',
    backgroundColor: 'white',
    shadowColor: COLORS.navy,
    shadowOpacity: 0.06,
    shadowRadius: 9,
    shadowOffset: {width: 0, height: 6},
    elevation: 2,
  },
  sectionHeading: {flexDirection: 'row', alignItems: 'flex-start'},
  sectionBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE8EA',
  },
  sectionBadgeIcon: {width: 24, height: 24, tintColor: COLORS.redStrong},
  sectionCopy: {flex: 1, marginLeft: 14},
  sectionTitle: {color: COLORS.navy, fontSize: 17, fontWeight: '700'},
  sectionDescription: {
    marginTop: 4,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 19,
  },
  input: {
    marginTop: 22,
    minHeight: 54,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'white',
    color: COLORS.navy,
    fontSize: 15,
  },
  tokenInput: {minHeight: 92, textAlignVertical: 'top'},
  inputError: {borderColor: COLORS.redStrong},
  errorText: {marginTop: 7, color: COLORS.redStrong, fontSize: 12},
  connectButton: {
    height: 54,
    marginTop: 18,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.redStrong,
  },
  connectSpinner: {marginRight: 9},
  connectIcon: {width: 20, height: 20, marginRight: 9, tintColor: 'white'},
  connectButtonText: {color: 'white', fontSize: 16, fontWeight: '700'},
  buttonDisabled: {opacity: 0.42},
  callTypeLabel: {
    marginTop: 18,
    marginBottom: 10,
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '700',
  },
  sdkTitle: {color: COLORS.navy, fontSize: 14, fontWeight: '700'},
  callActionRow: {marginTop: 9, flexDirection: 'row'},
  actionGap: {width: 12},
  callButton: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButton: {backgroundColor: COLORS.redStrong},
  videoButton: {backgroundColor: COLORS.green},
  callButtonText: {color: 'white', fontSize: 15, fontWeight: '700'},
  callButtonIcon: {width: 20, height: 20, marginRight: 8, tintColor: 'white'},
  videoButtonIcon: {tintColor: COLORS.navy},
  videoButtonText: {color: COLORS.navy},
  divider: {height: 1, marginVertical: 18, backgroundColor: COLORS.border},
});
