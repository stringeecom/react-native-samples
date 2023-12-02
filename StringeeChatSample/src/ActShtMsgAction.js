import React, {Component, createRef} from 'react';
import ActionSheet from 'react-native-actions-sheet';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';

export default class ActShtMsgAction extends Component {
  constructor(props) {
    super(props);

    this.ref = createRef();
    this.state = {
      isEditMessage: false,
      newContent: '',
    };
  }

  show = () => {
    this.ref.current.show();
  };

  hide = () => {
    this.ref.current.hide();
  };

  render(): React.ReactNode {
    return (
      <ActionSheet
        containerStyle={this.styles.container}
        ref={this.ref}
        bounceOnOpen={true}
        onClose={() => {
          this.setState({
            isEditMessage: false,
          });
          this.props.onClose();
        }}
        defaultOverlayOpacity={0.3}>
        {this.state.isEditMessage ? (
          <SafeAreaView>
            <Text style={this.styles.title}>New content</Text>
            <TextInput
              style={this.styles.input}
              placeholder={this.state.title}
              onChangeText={text => {
                this.setState({
                  newContent: text,
                });
              }}
            />

            <View style={this.styles.rowButton}>
              <TouchableOpacity
                style={this.styles.button}
                onPress={() => {
                  this.props.data('editMessage', this.state.newContent);
                  this.hide();
                }}>
                <Text style={this.styles.text}>Edit</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        ) : (
          <SafeAreaView>
            <View style={this.styles.rowButton}>
              <TouchableOpacity
                style={this.styles.actionButton}
                onPress={() => {
                  this.setState({
                    isEditMessage: true,
                  });
                }}>
                <Text style={this.styles.textAction}>Edit message</Text>
              </TouchableOpacity>
            </View>
            <View style={this.styles.divider} />
            <View style={this.styles.rowButton}>
              <TouchableOpacity
                style={this.styles.actionButton}
                onPress={() => {
                  this.props.data('pinMessage');
                  this.hide();
                }}>
                <Text style={this.styles.textAction}>Pin/Unpin message</Text>
              </TouchableOpacity>
            </View>
            <View style={this.styles.divider} />
            <View style={this.styles.rowButton}>
              <TouchableOpacity
                style={this.styles.actionButton}
                onPress={() => {
                  this.props.data('deleteMessage');
                  this.hide();
                }}>
                <Text style={this.styles.textAction}>Delete message</Text>
              </TouchableOpacity>
            </View>
            <View style={this.styles.divider} />
            <View style={this.styles.rowButton}>
              <TouchableOpacity
                style={this.styles.actionButton}
                onPress={() => {
                  this.props.data('revokeMessage');
                  this.hide();
                }}>
                <Text style={this.styles.textAction}>Revoke message</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </ActionSheet>
    );
  }
  styles = StyleSheet.create({
    container: {
      marginBottom: 10,
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    input: {
      height: 40,
      borderWidth: 1,
      marginHorizontal: 10,
      padding: 10,
    },
    title: {
      fontSize: 16,
      textAlign: 'left',
      margin: 10,
      fontWeight: 'bold',
    },
    text: {
      textAlign: 'center',
      color: '#F5FCFF',
      fontWeight: 'bold',
      fontSize: 15,
    },
    rowButton: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
    },
    button: {
      margin: 10,
      paddingVertical: 10,
      paddingHorizontal: 5,
      width: '45%',
      justifyContent: 'center',
      backgroundColor: '#1E6738',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#fff',
    },
    actionButton: {
      height: 50,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    textAction: {
      textAlign: 'center',
      color: '#000000',
      fontSize: 21,
    },
    divider: {
      width: '100%',
      height: 1,
      backgroundColor: 'black',
    },
  });
}
